const express = require("express");
const router = express.Router();
const { verifyAdmin, verifyToken, verifyTecherNAdmin } = require("../middleware/authMiddleware");
const uploadMp3 = require("../middleware/uploadMp3");
const voiceCourseController = require("../controllers/voiceCourse.controller");

router.post("/add", verifyTecherNAdmin, uploadMp3.single("mp3File"), voiceCourseController.createCourse);
router.get("/getAllListeningCourse", verifyToken, voiceCourseController.getAllCourses);
router.post("/updateProgress", verifyToken, voiceCourseController.updateProgress);
router.get("/getDetails/:id", verifyToken, voiceCourseController.getCourseDetails);
router.get("/viewProgress", verifyToken, voiceCourseController.viewProgress);

router.post('/viewProgressForUsr', verifyTecherNAdmin, voiceCourseController.viewProgressForUsr);

router.delete("/:id", verifyTecherNAdmin, voiceCourseController.deleteVoiceCourse);
router.patch("/toggle/:id", verifyTecherNAdmin, voiceCourseController.toggleVoiceCourse);

module.exports = router;