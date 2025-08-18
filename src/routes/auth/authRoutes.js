const express = require('express');
const router = express.Router();
const adminAuthController = require('../../controllers/auth.controller');

// Admin registration & login
router.post('/register', adminAuthController.register);
router.post('/login', adminAuthController.login);
router.post('/verify-otp',adminAuthController.verifyOTP);

router.post('/forgot-password',adminAuthController.forgotPassword);
router.post('/reset-password', adminAuthController.resetPassword);


// Course CRUD (admin only)
router.post('/create', adminAuthController.createCourse);
router.put('/:id', adminAuthController.updateCourse);

module.exports = router;
