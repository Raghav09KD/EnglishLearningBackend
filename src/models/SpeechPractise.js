
// models/SpeechPractice.js
const mongoose = require('mongoose');

const SpeechPracticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  text: { type: String, required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  isActive: { type: Boolean, default: true },
  isGlobal: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SpeechPractice', SpeechPracticeSchema);