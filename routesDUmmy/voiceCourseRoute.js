const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const VoiceCourse = require("../models/VoiceCourse");
const { verifyAdmin, verifyToken } = require("../middleware/authMiddleware");
const UserVoiceCourseProgressSchema = require("../models/VoiceProgress");
const fs = require("fs");

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/mp3"); // folder where mp3 files will be stored
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // e.g., 1234567890.mp3
  }
});

// File filter to allow only MP3 files
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["audio/mpeg", "audio/mp3"];
  const extname = path.extname(file.originalname).toLowerCase() === ".mp3";
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error("Only MP3 files are allowed!"));
  }
};

// Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB max file size
});

// Create Voice Course
router.post("/add", verifyAdmin, upload.single("mp3File"), async (req, res) => {
  try {
    const { title, quiz } = req.body;

    console.log(req.files)

    if (!req.file) {
      return res.status(400).json({ error: "MP3 file is required" });
    }

    const parsedQuiz = quiz ? JSON.parse(quiz) : [];

    const course = await VoiceCourse.create({
      title,
      mp3File: `/uploads/mp3/${req.file.filename}`,
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
});

// GET all voice courses (user-facing)
router.get("/getAllListeningCourse", verifyToken, async (req, res) => {
  try {
    // Fetch all courses
    const courseFilter = req.user.role === 'admin' ? {} : { isActive: true };
    const courses = await VoiceCourse.find(courseFilter).select("title");

    res.status(200).json(courses);
  } catch (err) {
    console.error("Error fetching voice courses:", err);
    res.status(500).json({ error: "Failed to fetch voice courses" });
  }
});

router.post("/updateProgress", verifyToken, async (req, res) => {
  try {
    const { id, submitedAnswers } = req.body;

    // 0. Check if progress already exists
    const existing = await UserVoiceCourseProgressSchema.findOne({
      userId: req.user.id,
      courseId: id
    });
    if (existing) {
      return res.status(400).json({
        error: "Course already completed",
        progress: existing
      });
    }

    const course = await VoiceCourse.findById(id).lean();
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // 1. Increment answers by 1
    const adjustedAnswers = {};
    Object.keys(submitedAnswers).forEach(key => {
      adjustedAnswers[key] = submitedAnswers[key] + 1;
    });

    // 2. Calculate score
    let score = 0;
    if (course.quiz && course.quiz.length > 0) {
      course.quiz.forEach((q, idx) => {
        const correct = q.correctAnswer; // should be 1–4
        const submitted = adjustedAnswers[idx];
        if (submitted === correct) {
          score++;
        }
      });
    }

    score = (score / course.quiz.length) * 100;

    let medal = 'none';
    if (score >= 90) medal = 'gold';
    else if (score >= 75) medal = 'silver';
    else if (score >= 50) medal = 'bronze';

    // 3. Save progress
    const progress = await UserVoiceCourseProgressSchema.create({
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
});
// GET a single voice course by ID
router.get("/getDetails/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const course = await VoiceCourse.findById(id).lean();
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Get the full file path
    const filePath = path.join(__dirname, "..", course.mp3File);

    // Read file as base64
    const fileData = fs.readFileSync(filePath, { encoding: "base64" });

    // Replace mp3File path with base64 string
    course.mp3File = `data:audio/mpeg;base64,${fileData}`;

    if (course?.quiz && course?.quiz?.length > 0) {
      course?.quiz.forEach(q => {
        delete q?.correctAnswer;
      });
    }
    res.status(200).json(course);

  } catch (err) {
    console.error("Error fetching voice course details:", err);
    res.status(500).json({ error: "Failed to fetch course details" });
  }
});

router.get("/viewProgress", verifyToken, async (req, res) => {
  try {
    const progress = await getUserVoiceCourseProgress(req.user.id);
    if (progress.length === 0) {
      return res.status(404).json({ error: "No progress found for this user" });
    }
    res.status(200).json(progress);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch progress data" });
  }
});









module.exports = router;