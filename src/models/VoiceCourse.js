const mongoose = require("mongoose");

const voiceQuizSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: {
    type: [String],
    validate: v => Array.isArray(v) && v.length >= 2,
    required: true
  },
  correctAnswer: { type: Number, required: true } // index starting at 0
});

const voiceCourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  mp3File: { type: String, required: true }, // store uploaded file path/URL
  quiz: { type: [voiceQuizSchema], default: [] },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isGlobal: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("VoiceCourse", voiceCourseSchema);