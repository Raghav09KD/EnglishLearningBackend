const mongoose = require('mongoose');
const AdminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isActive: { type: Boolean, default: true },

  emailVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpiry: { type: Date },
});
module.exports = mongoose.model('Admin', AdminSchema);
