const express = require('express');
const { verifyAdmin, verifyToken, verifyTecherNAdmin } = require('../middleware/authMiddleware');
const speechController = require('../controllers/speechPractise.controller');

const router = express.Router();

router.post('/create', verifyTecherNAdmin, speechController.createSpeechPractice);
router.get('/all', verifyToken, speechController.getAllSpeechPractices);
router.post('/score', verifyToken, speechController.scoreSpeech);
router.patch('/toggleSpeech', verifyTecherNAdmin, speechController.toggleSpeech);
router.put('/update', verifyTecherNAdmin, speechController.updateSpeechPractice);
router.get('/progress', verifyToken, speechController.getSpeechProgress);

module.exports = router;
