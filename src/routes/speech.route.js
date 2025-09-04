const express = require('express');
const { verifyAdmin, verifyToken, verifyTecherNAdmin } = require('../middleware/authMiddleware');
const speechController = require('../controllers/speechPractise.controller');

const router = express.Router();

router.post('/create', verifyTecherNAdmin, speechController.createSpeechPractice);
router.get('/all', verifyToken, speechController.getAllSpeechPractices);
router.get('/fetchAllGlobal', verifyTecherNAdmin, speechController.getAllGlobalSpeechPractices);
router.post('/score', verifyToken, speechController.scoreSpeech);
router.patch('/toggleSpeech', verifyTecherNAdmin, speechController.toggleSpeech);
router.put('/update', verifyTecherNAdmin, speechController.updateSpeechPractice);
router.get('/progress', verifyToken, speechController.getSpeechProgress);
router.post('/getProgressForUsr', verifyTecherNAdmin, speechController.getSpeechProgressForUsr);

router.get("/", async (req, res) => {
  const Speech = require("../models/SpeechPractise");
  const speeches = await Speech.find();
  res.json(speeches);
});

module.exports = router;    