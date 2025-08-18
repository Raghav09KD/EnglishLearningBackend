

const express = require('express');
const router = express.Router();
const { verifyAdmin } = require("../middleware/authMiddleware");
const User = require('../models/User');
const { default: mongoose } = require('mongoose');


router.get('/fetchAll', verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // exclude passwords
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});






module.exports = router;
