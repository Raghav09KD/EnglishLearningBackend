// routes/speechPractice.js
const express = require('express');
const router = express.Router();
const SpeechPractice = require('../models/SpeechPractise');
const { verifyAdmin, verifyToken } = require('../middleware/authMiddleware');
const SpeechScore = require('../models/SpeechScore');
const {calculatePronunciationScore} = require('../utils/utils')

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
      .select('title text courseId createdAt');

    res.status(200).json(speechTexts);
  } catch (err) {
    console.error("Fetch speech texts error:", err);
    res.status(500).json({ error: 'Failed to fetch speech practices' });
  }
});

router.post('/score', verifyToken, async (req, res) => {
  try {
    const { id,expectedText, spokenText } = req.body;
    const userId = req.user.id;

    if (!expectedText || !spokenText) {
      return res.status(400).json({ error: 'Missing expected or spoken text' });
    }
    
    const result = calculatePronunciationScore(expectedText, spokenText);
    console.log("🚀 ~ router.post ~ result:", result)

    // Save to a new SpeechScore model
    const speechScore = new SpeechScore({
      speechPractId : id,
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



module.exports = router;
