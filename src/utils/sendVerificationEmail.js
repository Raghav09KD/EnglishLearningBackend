const nodemailer = require('nodemailer');

async function sendOTPEmail(email, otp, resetLink = null) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  });

  console.log("Email user and pass:", process.env.EMAIL_USER, process.env.EMAIL_PASS);

  // Email content initialization
  let mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '',
    html: ''
  };

  // If OTP is provided, send OTP email
  if (otp) {
    mailOptions.subject = 'Your Email Verification OTP'; // Subject for OTP
    mailOptions.html = `
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
    `;
  }

  // If resetLink is provided, send password reset email
  if (resetLink) {
    mailOptions.subject = 'Password Reset Request'; // Subject for password reset
    mailOptions.html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password. Click the link below to reset your password:</p>
        <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">
          Reset Your Password
        </a>
        <p>This link will expire in 1 hour.</p>
        <hr/>
        <small>If you did not request a password reset, please ignore this email.</small>
      </div>
    `;
  }

  // Send the email
  await transporter.sendMail(mailOptions);
}

module.exports = sendOTPEmail;
