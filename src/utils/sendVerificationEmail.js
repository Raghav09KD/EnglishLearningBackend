// utils/sendVerificationEmail.js
// utils/sendOTPEmail.js
const nodemailer = require('nodemailer');

async function sendOTPEmail(email, otp) {
  const transporter = nodemailer.createTransport({
 service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Email Verification OTP',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Email Verification</h2>
        <p>Hello,</p>
        <p>Your OTP for email verification is:</p>
        <h1 style="background:#f5f5f5; padding:10px; display:inline-block; border-radius:5px; letter-spacing:5px;">
          ${otp}
        </h1>
        <p>This OTP will expire in 10 minutes. Please do not share it with anyone.</p>
        <hr/>
        <small>If you did not request this, you can safely ignore this email.</small>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

module.exports = sendOTPEmail;

