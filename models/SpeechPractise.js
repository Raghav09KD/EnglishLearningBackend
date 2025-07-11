// models/SpeechPractice.js
const mongoose = require('mongoose');

const SpeechPracticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  text: { type: String, required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }, // Optional, if tied to a course
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SpeechPractice', SpeechPracticeSchema);