const express = require('express');
const router = express.Router();
const GrammarLesson = require('../models/GrammarLesson');
const Course = require('../models/Course');

// CREATE
router.post('/grammar', async (req, res) => {
  try {
    const lesson = new GrammarLesson({ ...req.body, createdBy: req.adminId });
    await lesson.save();
    res.status(201).json(lesson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ ALL
router.get('/grammar',  async (req, res) => {
  const lessons = await GrammarLesson.find().sort({ createdAt: -1 });
  res.json(lessons);
});

// UPDATE
router.put('/grammar/:id', async (req, res) => {
  try {
    const updated = await GrammarLesson.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete('/grammar/:id', async (req, res) => {
  try {
    await GrammarLesson.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE course
router.post("/create", async (req, res) => {
  try {
    const { title, description, sections, adminId } = req.body;

    const course = new Course({
      title,
      description,
      sections,
      createdBy: adminId,
    });

    await course.save();
    res.status(201).json(course);
  } catch (err) {
    console.error("Create course error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// UPDATE course
router.put("/:id", async (req, res) => {
  try {
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json(updatedCourse);
  } catch (err) {
    console.error("Update course error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
