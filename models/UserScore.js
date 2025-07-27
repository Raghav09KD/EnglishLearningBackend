// models/UserScore.js
const mongoose = require('mongoose');

const userScoreSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },

  medal: {
    type: String,
    enum: ['gold', 'silver', 'bronze', 'none'],
    default: 'none'
  },

  quizScores: [
    {
      sectionIndex: Number,
      score: Number, // e.g. 80
      totalQuestions: Number,
      correctAnswers: Number,
      details: [
        {
          question: String,
          options: [String],
          selected: Number,
          correct: Number
        }
      ],
      attemptedAt: { type: Date, default: Date.now }
    }
  ],

  speechScores: [
    {
      sectionIndex: Number,
      expectedText: String,
      userSpokenText: String,
      score: Number, // 0-100
      submittedAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('UserScore', userScoreSchema);
