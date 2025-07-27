
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

// Toggle isActive field
router.patch("/toggle-user",verifyAdmin, async (req, res) => {
  const { userId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { isActive: !user.isActive } },
      { new: true }
    );

    res.status(200).json({
      message: `User ${updatedUser.name} is now ${updatedUser.isActive ? "active" : "inactive"}.`,
      user: updatedUser,
    });
  } catch (err) {
    console.error("Toggle user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});




module.exports = router;