const express = require('express');
const router = express.Router();
const { addComment, getCommentsByCourse } = require('../controllers/courseComments.controller');
const { verifyToken } = require('../middleware/authMiddleware');

// POST - Add comment
router.post('/add', verifyToken, addComment);

// GET - Comments by course
router.get('/:courseId', getCommentsByCourse);

module.exports = router;
