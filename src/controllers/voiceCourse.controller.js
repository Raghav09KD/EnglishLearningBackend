const path = require("path");
const fs = require("fs");
const VoiceCourse = require("../models/VoiceCourse");
const UserVoiceCourseProgress = require("../models/VoiceProgress");
const User = require("../models/User");
const featureFlags = require('../config/featureFlags')
// Create Voice Course
exports.createCourse = async (req, res) => {
  try {
    const { title, quiz } = req.body;

    console.log(req.files)

    if (!req.file) {
      return res.status(400).json({ error: "MP3 file is required" });
    }

    const parsedQuiz = quiz ? JSON.parse(quiz) : [];

    const course = await VoiceCourse.create({
      title,
      mp3File: `uploads/mp3/${req.file.filename}`,
      quiz: parsedQuiz,
      isGlobal: req.user.role === "admin" ? true : false,

      createdBy: req.user.id
    });

    res.status(201).json({
      message: "Voice course created successfully",
      course
    });
  } catch (err) {
    console.error("Error creating voice course:", err);
    res.status(500).json({ error: "Failed to create voice course" });
  }
};

// Get all voice courses
exports.getAllCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId)
      .populate("voiceCourses"); // ✅ populate admin-assigned voice courses

    let courseFilter = {};

    // ---------------- Student logic ----------------
    if (user?.role === "student") {
      courseFilter.isActive = true;

      if (featureFlags.teacherCourseRestriction) {
        courseFilter = {
          isActive: true,
          $or: [
            { createdBy: user?.teacher }, // student’s teacher-created
            { isGlobal: true }            // global voice courses
          ]
        };
      }
    }

    // ---------------- Teacher logic ----------------
    if (user?.role === "teacher") {
      if (featureFlags.teacherCourseRestriction) {
        courseFilter.createdBy = userId;
      }

      // Fetch teacher's own created voice courses
      let teacherCourses = await VoiceCourse.find(courseFilter)
        .select("title isActive");

      // Merge in admin-assigned voice courses
      if (user.voiceCourses?.length) {
        const courseMap = new Map(teacherCourses.map(c => [c._id.toString(), c]));
        user.voiceCourses.forEach(vc => {
          courseMap.set(vc._id.toString(), vc);
        });
        teacherCourses = Array.from(courseMap.values());
      }

      // Progress check for teacher
      const courseIds = teacherCourses.map(c => c._id);
      const progress = await UserVoiceCourseProgress.find({
        userId,
        courseId: { $in: courseIds }
      }).select("courseId");

      const completedCourseIds = new Set(progress.map(p => p.courseId.toString()));

      const result = teacherCourses.map(course => ({
        _id: course._id,
        title: course.title,
        isCompleted: completedCourseIds.has(course._id.toString()),
        isActive: course.isActive
      }));

      return res.status(200).json(result);
    }

    // ---------------- Admin logic ----------------
    if (user?.role === "admin") {
      courseFilter = {}; // no restrictions
    }

    // ---------------- Default fetch (students/admin) ----------------
    const courses = await VoiceCourse.find(courseFilter).select("title isActive");

    // Progress check
    const courseIds = courses.map(c => c._id);
    const progress = await UserVoiceCourseProgress.find({
      userId,
      courseId: { $in: courseIds }
    }).select("courseId");

    const completedCourseIds = new Set(progress.map(p => p.courseId.toString()));

    const result = courses.map(course => ({
      _id: course._id,
      title: course.title,
      isCompleted: completedCourseIds.has(course._id.toString()),
      isActive: course.isActive
    }));

    return res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching voice courses:", err);
    res.status(500).json({ error: "Failed to fetch voice courses" });
  }
};


// Get all voice courses
exports.getAllGlobalCourses = async (req, res) => {
  try {
    let courseFilter = {
      isActive: true,
      $or: [
        { isGlobal: true }            // global courses
      ]
    };

    // Fetch courses
    const courses = await VoiceCourse.find(courseFilter).select("title isActive createdBy");

    // Attach completion flag
    const result = courses.map(course => ({
      _id: course._id,
      title: course.title,
      description: '',
      isActive: course.isActive
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching voice courses:", err);
    res.status(500).json({ error: "Failed to fetch voice courses" });
  }
};


// Update Progress
exports.updateProgress = async (req, res) => {
  try {
    const { id, submitedAnswers } = req.body;

    const existing = await UserVoiceCourseProgress.findOne({
      userId: req.user.id,
      courseId: id,
    });
    if (existing) {
      return res
        .status(400)
        .json({ error: "Course already completed", progress: existing });
    }

    const course = await VoiceCourse.findById(id).lean();
    if (!course) return res.status(404).json({ error: "Course not found" });

    const adjustedAnswers = {};
    Object.keys(submitedAnswers).forEach((key) => {
      adjustedAnswers[key] = submitedAnswers[key] + 1; // shift index
    });

    let score = 0;
    const correctAnswers = {};

    if (course.quiz?.length) {
      course.quiz.forEach((q, idx) => {
        correctAnswers[idx] = q.correctAnswer; // ✅ store correct answer
        if (adjustedAnswers[idx] === q.correctAnswer) score++;
      });
    }

    score = (score / course.quiz.length) * 100;

    let medal = "none";
    if (score >= 90) medal = "gold";
    else if (score >= 75) medal = "silver";
    else if (score >= 50) medal = "bronze";

    const progress = await UserVoiceCourseProgress.create({
      userId: req.user.id,
      courseId: id,
      submittedAnswers: adjustedAnswers,
      score,
      medal,
      totalQuestions: course.quiz.length,
    });

    res.status(200).json({
      message: "Progress updated successfully",
      score,
      totalQuestions: course.quiz.length,
      correctAnswers, // ✅ send correct answers back
      progress,
    });
  } catch (err) {
    console.error("Error updating progress:", err);
    res.status(500).json({ error: "Failed to update progress" });
  }
};

// Get single course details
exports.getCourseDetails = async (req, res) => {
  try {
    const course = await VoiceCourse.findById(req.params.id).lean();
    if (!course) return res.status(404).json({ error: "Course not found" });

    const filePath = path.join(__dirname, "..", course.mp3File);
    const fileData = fs.readFileSync(filePath, { encoding: "base64" });

    course.mp3File = `data:audio/mpeg;base64,${fileData}`;

    if (course.quiz?.length) {
      course.quiz.forEach(q => delete q.correctAnswer);
    }

    res.status(200).json(course);
  } catch (err) {
    console.error("Error fetching voice course details:", err);
    res.status(500).json({ error: "Failed to fetch course details" });
  }
};

// View progress
// View progress
exports.viewProgress = async (req, res) => {
  try {
    // Fetch all progress records of the user
    const progress = await UserVoiceCourseProgress.find({ userId: req.user.id })
      .lean();

    if (!progress.length) {
      return res.status(404).json({ error: "No progress found" });
    }

    // Collect all courseIds from progress
    const courseIds = progress.map(p => p.courseId);

    // Fetch course details in one go
    const courses = await VoiceCourse.find({ _id: { $in: courseIds } })
      .select("title quiz") // only return title & quiz
      .lean();

    // Map courseId → course details
    const courseMap = {};
    courses.forEach(c => {
      courseMap[c._id.toString()] = c;
    });

    // Attach course info to each progress
    const result = progress.map(p => ({
      ...p,
      courseTitle: courseMap[p.courseId.toString()]?.title || "Untitled",
      quiz: courseMap[p.courseId.toString()]?.quiz || [],
    }));

    res.status(200).json(result);

  } catch (err) {
    console.error("Error fetching progress:", err);
    res.status(500).json({ error: "Failed to fetch progress data" });
  }
};

// View progress
// View progress
exports.viewProgressForUsr = async (req, res) => {
  try {
    const { userId } = req.body
    // Fetch all progress records of the user
    const progress = await UserVoiceCourseProgress.find({ userId: userId })
      .lean();

    if (!progress.length) {
      return res.status(404).json({ error: "No progress found" });
    }

    // Collect all courseIds from progress
    const courseIds = progress.map(p => p.courseId);

    // Fetch course details in one go
    const courses = await VoiceCourse.find({ _id: { $in: courseIds } })
      .select("title quiz") // only return title & quiz
      .lean();

    // Map courseId → course details
    const courseMap = {};
    courses.forEach(c => {
      courseMap[c._id.toString()] = c;
    });

    // Attach course info to each progress
    const result = progress.map(p => ({
      ...p,
      courseTitle: courseMap[p.courseId.toString()]?.title || "Untitled",
      quiz: courseMap[p.courseId.toString()]?.quiz || [],
    }));

    res.status(200).json(result);

  } catch (err) {
    console.error("Error fetching progress:", err);
    res.status(500).json({ error: "Failed to fetch progress data" });
  }
};

// ✅ Delete course (Admin only)
exports.deleteVoiceCourse = async (req, res) => {
  try {
    const { id } = req.params;

    await VoiceCourse.findByIdAndDelete(id);
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (err) {
    console.error("Error deleting course:", err);
    res.status(500).json({ error: "Failed to delete course" });
  }
};

// ✅ Toggle course active/inactive
exports.toggleVoiceCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await VoiceCourse.findById(id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    course.isActive = !course.isActive;
    await course.save();

    res.status(200).json({
      message: `Course ${course.isActive ? "activated" : "deactivated"} successfully`,
      course,
    });
  } catch (err) {
    console.error("Error updating course:", err);
    res.status(500).json({ error: "Failed to update course status" });
  }
};