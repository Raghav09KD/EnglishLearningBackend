const express = require('express');
const router = express.Router();
const { verifyAdmin, verifyToken } = require('../middleware/authMiddleware');
const courseController = require('../controllers/course.controller');

router.post('/create', verifyAdmin, courseController.createCourse);
router.put('/update/:id', verifyAdmin, courseController.updateCourse);
router.get('/getCources', verifyToken, courseController.getCourses);
router.get('/getCourse/:id', verifyToken, courseController.getCourseById);
router.get('/getCourse/:courseId/sections-titles', verifyToken, courseController.getSectionTitles);
router.get('/getCourse/:courseId/section/:sectionIndex', verifyToken, courseController.getSectionByIndex);
router.post('/updateProgress', verifyToken, courseController.updateProgress);

module.exports = router;
