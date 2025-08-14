const mongoose = require('mongoose');

const SpeechScoreSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expectedText: { type: String, required: true },
  spokenText: { type: String, required: true },
  score: { type: Number, required: true },
  totalWords: { type: Number, required: true },
  correctWords: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SpeechScore', SpeechScoreSchema);
