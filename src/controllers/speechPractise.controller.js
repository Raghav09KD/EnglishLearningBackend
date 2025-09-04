const SpeechPractice = require('../models/SpeechPractise');
const SpeechScore = require('../models/SpeechScore');
const User = require('../models/User');
const { calculatePronunciationScore } = require('../utils/utils');

const mongoose = require('mongoose');
const featureFlags = require('../config/featureFlags');
const Admin = require('../models/Admin');

exports.createSpeechPractice = async (req, res) => {
  try {
    const { title, text, courseId } = req.body;
    const newPractice = await SpeechPractice.create({
      title,
      text,
      courseId,
      createdBy: req.user.id,
      isGlobal: req.user.role === "admin" ? true : false,
    });
    res.status(201).json({ message: 'Speech practice created', data: newPractice });
  } catch (err) {
    console.error('Create error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAllSpeechPractices = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("User ID:", req.user); // Debug log
    const user = await User.findById(userId)
      .populate("speechCourses"); // ✅ include assigned speech courses
    console.log("user ====>", user)
    let courseFilter = {};

    // ---------------- Student logic ----------------
    if (user?.role === "student") {
      courseFilter.isActive = true;

      // 1. Get the student's teacher
      let teacher = user.teacher
        ? await User.findById(user.teacher).populate("speechCourses")
        : null;

      // 2. Build query
      let studentSpeech = await SpeechPractice.find({
        isActive: true,
        $or: [
          { isGlobal: false }, // all non-global
          { _id: { $in: teacher?.speechCourses || [] } } // only teacher-assigned global
        ]
      })
        .sort({ createdAt: -1 })
        .select("title text courseId createdAt isActive isGlobal");

      return res.status(200).json(studentSpeech);
    }

    // ---------------- Teacher logic ----------------
    else if (user?.role === "teacher") {
      if (featureFlags.teacherCourseRestriction) {
        courseFilter.createdBy = userId;
      }

      let teacherSpeech = await SpeechPractice.find(courseFilter)
        .sort({ createdAt: -1 })
        .select("title text courseId createdAt isActive");

      if (user.speechCourses?.length) {
        const speechMap = new Map(teacherSpeech.map(s => [s._id.toString(), s]));
        user.speechCourses.forEach(sc => {
          speechMap.set(sc._id.toString(), sc);
        });
        teacherSpeech = Array.from(speechMap.values());
      }

      return res.status(200).json(teacherSpeech); // ✅ RETURN here
    }

    // ---------------- Admin logic ----------------
    else if (!user) {

      const user = await Admin.findById(userId)
      if (user) {
        const allSpeech = await SpeechPractice.find(courseFilter)
          .sort({ createdAt: -1 })
          .select("title text courseId createdAt isActive");
        return res.status(200).json(allSpeech); // ✅ RETURN here
      }else{
        return res.status(403).json({ error: "Invalid role" });
      }

    }

    // ---------------- Fallback ----------------
    return res.status(403).json({ error: "Invalid role" });
  } catch (err) {
    console.error("Fetch speech texts error:", err);
    res.status(500).json({ error: "Failed to fetch speech practices" });
  }
};



exports.getAllGlobalSpeechPractices = async (req, res) => {
  try {
    const userId = req.user.id; // define this for later use
    const user = await User.findById(userId);

    let courseFilter = {};

    courseFilter = {
      isActive: true,
      $or: [

        { isGlobal: true }            // global courses
      ]
    };

    // Apply filter in query
    const speechTexts = await SpeechPractice.find(courseFilter)
      .sort({ createdAt: -1 })
      .select('title text courseId createdAt isActive createdBy');

    res.status(200).json(speechTexts);
  } catch (err) {
    console.error("Fetch speech texts error:", err);
    res.status(500).json({ error: 'Failed to fetch speech practices' });
  }
};

exports.scoreSpeech = async (req, res) => {
  try {
    const { id, expectedText, spokenText } = req.body;
    const userId = req.user.id;

    if (!expectedText || !spokenText) {
      return res.status(400).json({ error: 'Missing expected or spoken text' });
    }

    const result = calculatePronunciationScore(expectedText, spokenText);

    const speechScore = new SpeechScore({
      speechPractId: id,
      userId,
      expectedText,
      spokenText,
      score: result.score,
      totalWords: result.totalExpected,
      correctWords: result.correct,
      createdAt: new Date()
    });

    await speechScore.save();
    res.status(200).json({ message: 'Speech score saved', result });
  } catch (err) {
    console.error('Speech scoring error:', err);
    res.status(500).json({ error: 'Failed to score speech' });
  }
};

exports.toggleSpeech = async (req, res) => {
  const { speechPractId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(speechPractId)) {
    return res.status(400).json({ error: "Invalid speech ID" });
  }

  try {
    const exercise = await SpeechPractice.findById(speechPractId);
    if (!exercise) return res.status(404).json({ error: "Exercise not found" });

    const updatedExercise = await SpeechPractice.findByIdAndUpdate(
      speechPractId,
      { $set: { isActive: !exercise.isActive } },
      { new: true }
    );

    res.status(200).json({
      message: `Exercise ${updatedExercise.title} is now ${updatedExercise.isActive ? "active" : "inactive"}.`,
      exercise: updatedExercise,
    });
  } catch (err) {
    console.error("Toggle exercise error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateSpeechPractice = async (req, res) => {
  const { id, title, text } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid speech ID" });
  }

  try {
    const exercise = await SpeechPractice.findById(id);
    if (!exercise) {
      return res.status(404).json({ error: "Exercise not found" });
    }

    const updatedExercise = await SpeechPractice.findByIdAndUpdate(
      id,
      { $set: { title: title || exercise.title, text: text || exercise.text } },
      { new: true }
    );

    res.status(200).json(updatedExercise);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSpeechProgress = async (req, res) => {
  const requestedUserId = req.query.userId;

  try {
    let filter = {};
    if (req.user.role !== 'admin') {
      filter.userId = req.user.id;
    } else if (requestedUserId) {
      if (!mongoose.Types.ObjectId.isValid(requestedUserId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      filter.userId = requestedUserId;
    }

    const scores = await SpeechScore.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(scores);
  } catch (err) {
    console.error("Error fetching speech progress:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getSpeechProgressForUsr = async (req, res) => {
  const { userId } = req.body;

  try {
    let filter = { userId: userId };


    const scores = await SpeechScore.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(scores);
  } catch (err) {
    console.error("Error fetching speech progress:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
};