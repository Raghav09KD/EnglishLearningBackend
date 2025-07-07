const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { verifyAdmin } = require('../middleware/authMiddleware');

router.use(verifyAdmin);

// CREATE course 
router.post('/create', async (req, res) => {
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
