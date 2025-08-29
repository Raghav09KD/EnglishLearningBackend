const express = require('express');
const router = express.Router();
const AuthController = require('../../controllers/adminAuth.controller');

// Register admin
router.post('/register', AuthController.register);
router.post('/verify-otp', AuthController.verifyAdminOTP);

module.exports = router;
