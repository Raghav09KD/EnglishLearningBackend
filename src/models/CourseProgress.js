const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  currentSection: { type: Number, default: 0 },
  completedSections: [{ type: Number }],
}, { timestamps: true });

module.exports = mongoose.model('UserProgress', userProgressSchema);