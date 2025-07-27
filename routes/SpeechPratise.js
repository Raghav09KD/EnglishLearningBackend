// routes/speechPractice.js
const express = require('express');
const router = express.Router();
const SpeechPractice = require('../models/SpeechPractise');
const { verifyAdmin, verifyToken } = require('../middleware/authMiddleware');
const SpeechScore = require('../models/SpeechScore');
const { calculatePronunciationScore } = require('../utils/utils');
const { default: mongoose } = require('mongoose');

router.post('/create', verifyAdmin, async (req, res) => {
  try {
    const { title, text, courseId } = req.body;

    const newPractice = await SpeechPractice.create({
      title,
      text,
      courseId,
      createdBy: req.user.id,
    });

    res.status(201).json({ message: 'Speech practice created', data: newPractice });
  } catch (err) {
    console.error('Create error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/speech-practice/all
router.get('/all', verifyToken, async (req, res) => {
  try {
    const speechTexts = await SpeechPractice.find()
      .sort({ createdAt: -1 })
      .select('title text courseId createdAt isActive');

    res.status(200).json(speechTexts);
  } catch (err) {
    console.error("Fetch speech texts error:", err);
    res.status(500).json({ error: 'Failed to fetch speech practices' });
  }
});

router.post('/score', verifyToken, async (req, res) => {
  try {
    const { id, expectedText, spokenText } = req.body;
    const userId = req.user.id;

    if (!expectedText || !spokenText) {
      return res.status(400).json({ error: 'Missing expected or spoken text' });
    }

    const result = calculatePronunciationScore(expectedText, spokenText);
    console.log("🚀 ~ router.post ~ result:", result)

    // Save to a new SpeechScore model
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

    res.status(200).json({
      message: 'Speech score saved',
      result
    });

  } catch (err) {
    console.error('Speech scoring error:', err);
    res.status(500).json({ error: 'Failed to score speech' });
  }
});

// Toggle isActive field
router.patch("/toggleSpeech", verifyAdmin, async (req, res) => {
  const { speechPractId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(speechPractId)) {
    return res.status(400).json({ error: "Invalid speech ID" });
  }
  try {
    const exercise = await SpeechPractice.findById(speechPractId);
    if (!exercise) return res.status(404).json({ error: "Exercise not found" });

    const updatedExerise = await SpeechPractice.findByIdAndUpdate(
      speechPractId,
      { $set: { isActive: !exercise.isActive } },
      { new: true }
    );

    res.status(200).json({
      message: `Exercise ${updatedExerise.title} is now ${updatedExerise.isActive ? "active" : "inactive"}.`,
      exercise: updatedExerise,
    });
  } catch (err) {
    console.error("Toggle exercise error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put('/update', verifyAdmin, async (req, res) => {
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
      {
        $set: {
          title: title || exercise.title,
          text: text || exercise.text,
        },
      },
      { new: true }
    );

    return res.status(200).json(updatedExercise);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


// GET /api/speech/progress?userId=xxxx (optional if admin)
router.get('/progress', verifyToken, async (req, res) => {
  const requestedUserId = req.query.userId;

  try {
    let filter = {};

    if (req.user.role !== 'admin') {
      // If not admin, use ID from token
      filter.userId = req.user.id;
    } else if (requestedUserId) {
      // If admin passed a specific userId
      if (!mongoose.Types.ObjectId.isValid(requestedUserId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      filter.userId = requestedUserId;
    }

    const scores = await SpeechScore.find(filter)
      .populate('userId', 'name email') // Optional: include user name/email
      .sort({ createdAt: -1 });

    return res.status(200).json(scores);
  } catch (err) {
    console.error("Error fetching speech progress:", err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
