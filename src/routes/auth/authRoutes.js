const express = require('express');
const router = express.Router();
const adminAuthController = require('../../controllers/auth.controller');
const Admin = require('../../models/Admin');

// Admin registration & login
router.post('/register', adminAuthController.register);
router.post('/login', adminAuthController.login);
router.post('/verify-otp', adminAuthController.verifyOTP);

// Course CRUD (admin only)
router.post('/create', adminAuthController.createCourse);

// Admin Sign Up (with Super Password validation)
router.post("/adminSignup", adminAuthController.adminSignUp);
router.put('/:id', adminAuthController.updateCourse);

module.exports = router;
