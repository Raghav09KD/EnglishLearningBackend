const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema({
    name: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    emailVerified: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false }, // Only relevant for teachers
    verificationToken: { type: String },
});
module.exports = mongoose.model('Teacher', TeacherSchema);