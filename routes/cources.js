const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { verifyAdmin, verifyToken } = require('../middleware/authMiddleware');

// CREATE course 
router.post('/create', verifyAdmin ,async (req, res) => {
  try {
    const { title, description, sections, adminId } = req.body;
    const course = new Course({
      title,
      description,
      sections: sections,
      createdBy: req.user.id,
    });
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/",verifyToken, async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 }).select("title createdAt");
    res.status(200).json(courses);
  } catch (err) {
    console.error("Fetch courses error:", err);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

router.get("/:id",verifyToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) return res.status(404).json({ error: "Course not found" });

    res.status(200).json(course);
  } catch (err) {
    console.error("Error fetching course:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// // UPDATE course
// router.put('/:id', async (req, res) => {
//   try {
//     const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!course) return res.status(404).json({ error: 'Course not found' });
//     res.json(course);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

module.exports = router;
