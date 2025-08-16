const express = require('express');
const router = express.Router();
const { verifyAdmin, verifyToken } = require('../middleware/authMiddleware');
const adminContentController = require('../controllers/adminContent.controller');

// Routes
router.get('/progress', verifyToken, adminContentController.getProgress);
router.post('/create', verifyToken, verifyAdmin, adminContentController.createCourse);
router.put('/:id', verifyToken, verifyAdmin, adminContentController.updateCourse);

module.exports = router;
