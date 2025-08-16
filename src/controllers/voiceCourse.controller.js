const path = require("path");
const fs = require("fs");
const VoiceCourse = require("../models/VoiceCourse");
const UserVoiceCourseProgress = require("../models/VoiceProgress");

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
    const courseFilter = req.user.role === "admin" ? {} : { isActive: true };
    const courses = await VoiceCourse.find(courseFilter).select("title");
    res.status(200).json(courses);
  } catch (err) {
    console.error("Error fetching voice courses:", err);
    res.status(500).json({ error: "Failed to fetch voice courses" });
  }
};

// Update Progress
exports.updateProgress = async (req, res) => {
  try {
    const { id, submitedAnswers } = req.body;

    const existing = await UserVoiceCourseProgress.findOne({ userId: req.user.id, courseId: id });
    if (existing) {
      return res.status(400).json({ error: "Course already completed", progress: existing });
    }

    const course = await VoiceCourse.findById(id).lean();
    if (!course) return res.status(404).json({ error: "Course not found" });

    const adjustedAnswers = {};
    Object.keys(submitedAnswers).forEach(key => {
      adjustedAnswers[key] = submitedAnswers[key] + 1;
    });

    let score = 0;
    if (course.quiz?.length) {
      course.quiz.forEach((q, idx) => {
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
      totalQuestions: course.quiz.length
    });

    res.status(200).json({
      message: "Progress updated successfully",
      score,
      totalQuestions: course.quiz.length,
      progress
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
exports.viewProgress = async (req, res) => {
  try {
    const progress = await UserVoiceCourseProgress.find({ userId: req.user.id });
    if (!progress.length) return res.status(404).json({ error: "No progress found" });
    res.status(200).json(progress);
  } catch (err) {
    console.error("Error fetching progress:", err);
    res.status(500).json({ error: "Failed to fetch progress data" });
  }
};
