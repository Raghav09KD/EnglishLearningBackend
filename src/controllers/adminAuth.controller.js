const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const sendOTPEmail = require('../utils/sendVerificationEmail'); 

exports.register = async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    // 1. Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin account already exists with this email' });
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Generate OTP & expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // 4. Create new admin
    const newAdmin = new Admin({
      name,
      email,
      password: hashedPassword,
      emailVerified: false,
      otp,
      otpExpiry,
      isActive: true,
    });

    await newAdmin.save();

    // 5. Send OTP email
    await sendOTPEmail(email, otp);

    res.status(201).json({
      message: 'OTP sent to your email. Please verify within 10 minutes.',
    });

  } catch (err) {
    console.error('Admin registration error:', err);
    next(err);
  }
};

exports.verifyAdminOTP = async (req, res) => {
  const { email, otp } = req.body;
  console.log("Received email:", email);
  console.log("Received OTP:", otp);

  const admin = await Admin.findOne({ email });
  console.log("Admin found:", admin);

  if (!admin) return res.status(404).json({ message: 'Admin not found' });

  if (admin.otp !== otp || Date.now() > admin.otpExpiry) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  admin.emailVerified = true;
  admin.otp = undefined;
  admin.otpExpiry = undefined;
  await admin.save();

  res.json({ message: 'Email verified successfully' });
};

