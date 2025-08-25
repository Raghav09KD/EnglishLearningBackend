const express = require('express');
const { verifyTecherNAdmin } = require('../middleware/authMiddleware');
const userController = require('../controllers/manageUser.controller');

const router = express.Router();

router.patch('/toggle-user', verifyTecherNAdmin, userController.toggleUser);


router.get('/getTeacherStudent', verifyTecherNAdmin, userController.getTeacherStudentsWithCourses);

module.exports = router;