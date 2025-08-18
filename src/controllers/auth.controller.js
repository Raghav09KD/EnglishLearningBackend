const Admin = require('../models/Admin');
const User = require('../models/User'); // assuming this exists
const Teacher = require('../models/Teacher'); // assuming this exists
const Course = require('../models/Course'); // assuming this exists
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const express = require('express');

const sendOTPEmail = require('../utils/sendVerificationEmail');

const router = express.Router();


// Forgot Password Logic
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate reset token (expires in 1 hour)
    const resetToken = jwt.sign({ userId: user._id }, process.env.RESET_PASSWORD_SECRET, { expiresIn: '1h' });

    // Create reset link
    const resetLink = `http://localhost:3000/reset-password/${resetToken}`;  // Make sure this matches your frontend route

    // Send the reset link via email
    await sendOTPEmail(user.email, null, resetLink);

    res.status(200).json({ message: 'Password reset link has been sent to your email.' });
  } catch (err) {
    console.error("Error during password reset:", err);  // Logging the error
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};


// Reset Password Logic
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    // Verify the reset token
    const decoded = jwt.verify(token, process.env.RESET_PASSWORD_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully.' });
  } catch (err) {
    console.error("Error during password reset:", err);  // Logging error
    res.status(400).json({ message: 'Invalid or expired reset token' });
  }
};



exports.register = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  try {
    // 1. Validate role
    if (role !== 'student' && role !== 'teacher') {
      return res.status(400).json({ message: 'Invalid role provided' });
    }

    // 2. Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Account already exists with this email' });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Generate OTP & expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // 5. Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      emailVerified: false,
      isApproved: role === 'teacher' ? false : true, // Teachers need admin approval
      otp,
      otpExpiry
    });

    await newUser.save();

    // 6. Send OTP email
    await sendOTPEmail(email, otp);

    res.status(201).json({
      message: 'OTP sent to your email. Please verify within 10 minutes.'
    });

  } catch (err) {
    next(err);
  }
};


// POST /api/auth/verify-otp
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  console.log("🚀 ~ otp:", otp)
  console.log("🚀 ~ email:", email)
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.otp !== otp || Date.now() > user.otpExpiry) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  user.emailVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  res.json({ message: "Email verified successfully" });
};


// Admin, Teacher, Student Login
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Default: student
    let user = await User.findOne({ email });
    let role = user?.role;

    // if (!user) {
    //   // If not found in students, try teacher
    //   user = await Teacher.findOne({ email });
    //   role = "teacher";
    // }

    if (!user) {
      // If not found in teachers, try admin
      user = await Admin.findOne({ email });
      role = "admin";
    }

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Password match check
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Active status check (all roles)
    if (user.isActive === false) {



      return res.status(400).json({ message: "User is inactive" });
    }

    // ✅ Email verification check ONLY for student & teacher
    if ((role === "student" || role === "teacher") && !user?.emailVerified) {

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

      await User.findOneAndUpdate(
        { email },  // find by email
        {
          otp: otp,
          otpExpiry: otpExpiry
        },
        { upsert: true, new: true } // create if not exists, return updated
      );

      // 6. Send OTP email
      await sendOTPEmail(email, otp);
      return res.status(400).json({ message: "Please verify your email before logging in.", statusCode: 'VRYFYEML' });
    }

    // JWT token
    const token = jwt.sign(
      { id: user._id, role },
      process.env.JWT_SECRET,
      { expiresIn: "30m" }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.adminSignUp = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, superPassword } = req.body;


    if (superPassword !== process.env.SUPER_ADMIN_SECRET) {
      return res.status(403).json({ error: "Invalid super password" });
    }


    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }


    const existingUser = await Admin.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }


    const hashedPassword = await bcrypt.hash(password, 10);


    const newAdmin = new Admin({
      name,
      email,
      password: hashedPassword,
      role: "admin", // force role as admin
    });

    await newAdmin.save();


    const token = jwt.sign(
      { userId: newAdmin._id, role: newAdmin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      message: "Admin registered successfully",
      token,
      user: { id: newAdmin._id, name: newAdmin.name, email: newAdmin.email, role: newAdmin.role },
    });
  } catch (error) {
    console.error("Admin signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// Create Course
exports.createCourse = async (req, res, next) => {
  try {
    const { title, description, segments, adminId } = req.body;

    const course = new Course({
      title,
      description,
      segments,
      createdBy: adminId
    });

    await course.save();
    res.status(201).json(course);
  } catch (err) {
    next(err);
  }
};

// Update Course
exports.updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(course);
  } catch (err) {
    next(err);
  }
};
