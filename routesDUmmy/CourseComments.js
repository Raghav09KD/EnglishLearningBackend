// routes/courseCommentRoutes.js
const express = require('express');
const router = express.Router();
const CourseComments = require('../models/CourseComments');
const { verifyToken } = require('../middleware/authMiddleware');

// Add a comment
router.post('/add', verifyToken, async (req, res) => {
  const { courseId, comment } = req.body;

  if (!courseId || !comment) {
    return res.status(400).json({ error: 'Course ID and comment are required' });
  }

  try {
    const newComment = new CourseComments({
      courseId,
      userId: req.user.id,
      comment,
    });

    await newComment.save();
    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get comments for a course
router.get('/:courseId', async (req, res) => {
  try {
    const comments = await CourseComments.find({ courseId: req.params.courseId })
      .populate('userId', 'name') // optional: get user name
      .sort({ createdAt: -1 });
    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;