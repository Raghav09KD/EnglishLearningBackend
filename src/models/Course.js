const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [String],
  correctAnswer: { type: Number, required: true }, // index (0 to 3)
});

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  order: { type: Number, required: true },
  quiz: [quizSchema],
  speechPracticeText: String,
  mediaUrl: String,
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  level: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "easy",
    required: true
  },
  sections: [sectionSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isGlobal: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Course", courseSchema);