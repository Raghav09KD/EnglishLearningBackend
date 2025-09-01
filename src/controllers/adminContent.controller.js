const Course = require('../models/Course');
const UserProgress = require('../models/CourseProgress');
const UserScore = require('../models/UserScore');
const User = require('../models/User');
const VoiceProgress = require('../models/VoiceProgress');
const SpeechScore = require('../models/SpeechScore');
const VoiceCourse = require('../models/VoiceCourse');
const SpeechCourse = require('../models/SpeechPractise');

// GET progress
exports.getProgress = async (req, res) => {
  try {
    const { userId } = req.query;

    let fetchUserId;
    if (req.user.role === 'admin') {
      fetchUserId = userId; // Admin can fetch any user or their own
    } else {
      fetchUserId = req.user.id; // Regular users can only fetch their own progress
    }

    const userProgressQuery = userId ? { userId } : {};
    const userProgressList = await UserProgress.find(userProgressQuery)
      .populate('userId', 'name email')
      .populate('courseId', 'title')
      .lean();

    const userScoresQuery = userId ? { userId } : {};
    const userScores = await UserScore.find(userScoresQuery).lean();

    const validProgressList = userProgressList.filter(
      (p) => p.userId && p.courseId
    );

    const mergedData = validProgressList.map(progress => {
      const matchingScore = userScores.find(score =>
        String(score.userId) === String(progress.userId._id) &&
        String(score.courseId) === String(progress.courseId._id)
      );

      return {
        user: progress.userId,
        course: progress.courseId,
        completedSections: progress.completedSections,
        currentSection: progress.currentSection,
        medal: matchingScore?.medal || 'none',
        quizScores: matchingScore?.quizScores || [],
      };
    });

    res.status(200).json(mergedData);
  } catch (err) {
    console.error("Admin progress fetch error:", err);
    res.status(500).json({ error: "Failed to fetch student progress" });
  }
};

// CREATE course
exports.createCourse = async (req, res) => {
  try {
    const { title, description, sections, adminId } = req.body;

    const course = new Course({
      title,
      description,
      sections,
      createdBy: adminId,
    });

    await course.save();
    res.status(201).json(course);
  } catch (err) {
    console.error("Create course error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// UPDATE course
exports.updateCourse = async (req, res) => {
  try {
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json(updatedCourse);
  } catch (err) {
    console.error("Update course error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

exports.fetchAll = async (req, res) => {
  try {
    const currentUser = req.user; // set by auth middleware
    let users;

    if (currentUser.role === "admin") {
      // Admin -> fetch all users with courses populated
      users = await User.find({}, "-password")
        .populate("courses")
        .populate("voiceCourses")
        .populate("speechCourses");
    } else if (currentUser.role === "teacher") {
      // Teacher -> fetch only their students with courses populated
      const teacher = await User.findById(currentUser.id)
        .populate({
          path: "students",
          select: "-password",
          populate: [
            { path: "courses" },
            { path: "voiceCourses" },
            { path: "speechCourses" },
          ],
        });

      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found" });
      }

      users = teacher.students; // already populated with courses
    } else {
      return res.status(403).json({ error: "Not authorized" });
    }

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.generatePerformance = async (req, res) => {
  try {
    const { userId } = req.user.id;

    // Voice Scores (per day avg)
    const voiceScores = await VoiceProgress.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          avgScore: { $avg: "$score" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Speech Scores (per day avg)
    const speechScores = await SpeechScore.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          avgScore: { $avg: "$score" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Quiz Scores (per day avg)
    const quizScores = await UserScore.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
          avgScore: { $avg: "$score" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Weekly completions
    const weeklyCompletions = await UserScore.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: { $dateTrunc: { date: "$completedAt", unit: "week" } },
          completedCourses: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      voiceScores,
      speechScores,
      quizScores,
      weeklyCompletions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching performance data" });
  }
};

// POST /admin/assign-students
exports.assignStudents = async (req, res) => {
  const { studentIds, teacherId } = req.body;

  try {
    const teacher = await User.findById(teacherId);

    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ message: 'Teacher not found or invalid role' });
    }

    // Validate given students
    const students = await User.find({ _id: { $in: studentIds }, role: 'student' });
    if (students.length !== studentIds.length) {
      return res.status(400).json({ message: 'Some students are invalid' });
    }

    // Ensure the teacher has fewer than 10 students before assigning
    if (teacher.students.length >= 10) {
      return res.status(400).json({ message: 'Teacher already has 10 students.' });
    }

    // Assign students to teacher
    await User.updateMany(
      { _id: { $in: studentIds }, role: 'student' },
      { $set: { teacher: teacher._id } }
    );

    // Update teacher's student list
    teacher.students.push(...studentIds);
    await teacher.save();

    res.json({ message: 'Students assigned successfully', teacher });
  } catch (err) {
    console.error('Assign error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};



// POST /admin/remove-student
exports.removeStudent = async (req, res) => {
  const { studentId, teacherId } = req.body;

  try {
    const teacher = await User.findById(teacherId);
    const student = await User.findById(studentId);

    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({ message: "Teacher not found or invalid role" });
    }
    if (!student || student.role !== "student") {
      return res.status(404).json({ message: "Student not found or invalid role" });
    }

    // Remove student from teacher.students array
    teacher.students = teacher.students.filter(
      (id) => id.toString() !== studentId.toString()
    );
    await teacher.save();

    // Remove teacher reference from student
    if (student.teacher?.toString() === teacherId.toString()) {
      student.teacher = null;
      await student.save();
    }

    res.json({ message: "Student removed successfully" });
  } catch (err) {
    console.error("Remove error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// Teacher-course 

// POST /admin/assign-courses
// POST /admin/assign-courses
exports.assignCourses = async (req, res) => {
  const { courseIds, teacherId, courseType = "courses" } = req.body;

  try {
    const teacher = await User.findById(teacherId);

    if (!teacher || teacher.role !== "teacher") {
      return res
        .status(404)
        .json({ message: "Teacher not found or invalid role" });
    }

    // validate IDs against correct model
    let courses;
    switch (courseType) {
      case "courses":
        courses = await Course.find({ _id: { $in: courseIds } });
        if (courses.length !== courseIds.length) {
          return res
            .status(400)
            .json({ message: "Some normal courses are invalid" });
        }
        // limit check
        if (teacher.courses && teacher.courses.length + courseIds.length > 10) {
          return res.status(400).json({
            message:
              "This teacher already has the maximum number of courses assigned (10)",
          });
        }
        teacher.courses = [...(teacher.courses || []), ...courseIds];
        break;

      case "voiceCourses":
        courses = await VoiceCourse.find({ _id: { $in: courseIds } });
        if (courses.length !== courseIds.length) {
          return res
            .status(400)
            .json({ message: "Some voice courses are invalid" });
        }
        if (
          teacher.voiceCourses &&
          teacher.voiceCourses.length + courseIds.length > 10
        ) {
          return res.status(400).json({
            message:
              "This teacher already has the maximum number of voice courses assigned (10)",
          });
        }
        teacher.voiceCourses = [...(teacher.voiceCourses || []), ...courseIds];
        break;

      case "speechCourses":
        courses = await SpeechCourse.find({ _id: { $in: courseIds } });
        if (courses.length !== courseIds.length) {
          return res
            .status(400)
            .json({ message: "Some speech courses are invalid" });
        }
        if (
          teacher.speechCourses &&
          teacher.speechCourses.length + courseIds.length > 10
        ) {
          return res.status(400).json({
            message:
              "This teacher already has the maximum number of speech courses assigned (10)",
          });
        }
        teacher.speechCourses = [
          ...(teacher.speechCourses || []),
          ...courseIds,
        ];
        break;

      default:
        return res.status(400).json({ message: "Invalid course type" });
    }

    await teacher.save();

    res.json({
      message: `${courseType} assigned successfully`,
      teacher,
    });
  } catch (err) {
    console.error("Assign courses error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// POST /admin/remove-course
exports.removeCourse = async (req, res) => {
  const { teacherId, courseId, courseType } = req.body;

  try {
    const teacher = await User.findById(teacherId)
      .populate("courses")
      .populate("voiceCourses")
      .populate("speechCourses");

    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({ message: "Teacher not found or invalid role" });
    }

    // Determine which field to update
    let field;
    switch (courseType) {
      case "courses":
        field = "courses";
        break;
      case "voiceCourses":
        field = "voiceCourses";
        break;
      case "speechCourses":
        field = "speechCourses";
        break;
      default:
        return res.status(400).json({ message: "Invalid courseType" });
    }

    // Remove the course from the selected field
    teacher[field] = teacher[field].filter((c) => {
      const cid = c._id ? c._id.toString() : c.toString();
      return cid !== courseId.toString();
    });

    await teacher.save();

    // Return updated teacher with populated data
    const updatedTeacher = await User.findById(teacherId)
      .populate("courses")
      .populate("voiceCourses")
      .populate("speechCourses");

    res.json({
      message: "Course removed successfully",
      teacher: updatedTeacher,
    });
  } catch (err) {
    console.error("❌ Remove course error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// GET /admin/fetchAllCourses
exports.fetchAllCourses = async (req, res) => {
  try {
    const currentUser = req.user; // set by auth middleware

    let courses;

    if (currentUser.role === "admin") {
      // Admin sees all courses
      courses = await Course.find({});
    } else if (currentUser.role === "teacher") {
      // Teacher sees only assigned courses
      const teacher = await User.findById(currentUser.id).populate("courses");

      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found" });
      }

      courses = teacher.courses;  // Teacher sees only their assigned courses
    } else {
      return res.status(403).json({ error: "Not authorized" });
    }

    res.json(courses);
  } catch (err) {
    console.error("Error fetching courses:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


// GET /admin/fetchAllCourses
exports.fetchAllGlobalCourses = async (req, res) => {
  try {
    const currentUser = req.user; // set by auth middleware

    let courses;

    if (currentUser.role === "admin") {
      // Admin sees all courses
      courses = await Course.find({ isGlobal: true });
    } else if (currentUser.role === "teacher") {
      // Teacher sees only assigned courses
      const teacher = await User.findById(currentUser.id).populate("courses");

      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found" });
      }

      courses = teacher.courses;  // Teacher sees only their assigned courses
    } else {
      return res.status(403).json({ error: "Not authorized" });
    }

    res.json(courses);
  } catch (err) {
    console.error("Error fetching courses:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};











