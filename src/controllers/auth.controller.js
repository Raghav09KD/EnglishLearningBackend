const Admin = require('../models/Admin');
const User = require('../models/User'); // assuming this exists
const Teacher = require('../models/Teacher'); // assuming this exists
const Course = require('../models/Course'); // assuming this exists
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const sendOTPEmail = require('../utils/sendVerificationEmail');


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


// Admin Login
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Check if user is a student
    let user = await User.findOne({ email });
    let role = "student";

    if (!user) {
      // If not found, try admin
      user = await Admin.findOne({ email });
      role = "admin";
    }

    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    else if (user.isActive === false) {
      return res.status(400).json({ message: 'User is inactive' });
    }

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
