// models/UserVoiceCourseProgress.js
const mongoose = require("mongoose");

const UserVoiceCourseProgressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "VoiceCourse",
        required: true
    },
    submittedAnswers: {
        type: Map,
        of: Number, // option number (1–4)
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    totalQuestions: {
        type: Number,
        required: true
    },
    medal: {
        type: String,
        enum: ['gold', 'silver', 'bronze', 'none'],
        default: 'none'
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("UserVoiceCourseProgress", UserVoiceCourseProgressSchema);