
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin', 'teacher'], default: 'student' },
  isActive: { type: Boolean, default: true },

  emailVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpiry: { type: Date },

  // For Students: which teacher they belong to
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // For Teachers: which students they have (optional but helpful for queries)
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
