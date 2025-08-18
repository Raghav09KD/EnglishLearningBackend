const express = require('express');
const router = express.Router();
const { verifyAdmin, verifyToken, verifyTecherNAdmin } = require('../middleware/authMiddleware');
const adminContentController = require('../controllers/adminContent.controller');

// Routes
router.get('/progress', verifyToken, adminContentController.getProgress);
router.post('/create', verifyToken, verifyAdmin, adminContentController.createCourse);
router.get('/fetchAllUsers', verifyTecherNAdmin, adminContentController.fetchAll);
router.post('/assignStudents', verifyAdmin, adminContentController.assignStudents);
router.post('/removeStudent', verifyAdmin, adminContentController.removeStudent);
router.get("/performanceGraph", verifyToken, adminContentController.generatePerformance);
router.put('/:id', verifyToken, verifyAdmin, adminContentController.updateCourse);


module.exports = router;
