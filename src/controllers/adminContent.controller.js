const Course = require('../models/Course');
const UserProgress = require('../models/CourseProgress');
const UserScore = require('../models/UserScore');
const User = require('../models/User');
const VoiceProgress = require('../models/VoiceProgress');
const SpeechScore = require('../models/SpeechScore');

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
    const users = await User.find({}, '-password'); // exclude passwords
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: 'Internal server error' });
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

    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({ message: "Teacher not found or invalid role" });
    }

    // Validate given students
    const students = await User.find({ _id: { $in: studentIds }, role: "student" });
    if (students.length !== studentIds.length) {
      return res.status(400).json({ message: "Some students are invalid" });
    }

    // 1. Remove this teacher from students no longer assigned
    await User.updateMany(
      { role: "student", teacher: teacher._id, _id: { $nin: studentIds } },
      { $unset: { teacher: 1 } }
    );

    // 2. Assign this teacher to the new list of students
    await User.updateMany(
      { _id: { $in: studentIds }, role: "student" },
      { $set: { teacher: teacher._id } }
    );

    // 3. Replace teacher.students with the new array
    teacher.students = studentIds;
    await teacher.save();

    res.json({ message: "Students assigned successfully", teacher });
  } catch (err) {
    console.error("Assign error:", err);
    res.status(500).json({ message: "Server error" });
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



