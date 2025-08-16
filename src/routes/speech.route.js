const express = require('express');
const { verifyAdmin, verifyToken } = require('../middleware/authMiddleware');
const speechController = require('../controllers/speechPractise.controller');

const router = express.Router();

router.post('/create', verifyAdmin, speechController.createSpeechPractice);
router.get('/all', verifyToken, speechController.getAllSpeechPractices);
router.post('/score', verifyToken, speechController.scoreSpeech);
router.patch('/toggleSpeech', verifyAdmin, speechController.toggleSpeech);
router.put('/update', verifyAdmin, speechController.updateSpeechPractice);
router.get('/progress', verifyToken, speechController.getSpeechProgress);

module.exports = router;
