// courseAssignments.js (Mongoose Schema)
const mongoose = require('mongoose');

const CourseRestrictionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },  // optional (for per-student restriction)
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  restricted: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CourseAssignment", CourseRestrictionSchema);