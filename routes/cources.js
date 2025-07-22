const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const UserProgress = require('../models/CourseProgress');
const { verifyAdmin, verifyToken } = require('../middleware/authMiddleware');
const { default: mongoose } = require('mongoose');
const UserScore = require('../models/UserScore');

// CREATE course 
router.post('/create', verifyAdmin, async (req, res) => {
  try {
    const { title, description, sections } = req.body;
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



router.post('/updateProgress', verifyToken, async (req, res) => {
  try {
    const { courseId, sectionIndex, answers } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ error: "Invalid courseId" });
    }

    if (typeof sectionIndex !== "number") {
      return res.status(400).json({ error: "Invalid sectionIndex" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const section = course.sections[sectionIndex];
    if (!section) return res.status(404).json({ error: 'Section not found' });

    let quizResults = [];
    let hasQuiz = Array.isArray(section.quiz) && section.quiz.length > 0;

    if (hasQuiz && answers) {
      // First, build quizResults
      quizResults = section.quiz.map((q, i) => {
        console.log(`🚀 ~ quizResults=section.quiz.map ~ {
          question: q.question,
          selected: answers[i],
          correct: q.correctAnswer,
          isCorrect: answers[i] === q.correctAnswer,
          options: q.options
        }:`, {
          question: q.question,
          selected: answers[i] + 1,
          correct: q.correctAnswer,
          isCorrect: (answers[i] + 1) === q.correctAnswer,
          options: q.options
        })
        return {
          question: q.question,
          selected: answers[i] + 1,
          correct: q.correctAnswer,
          isCorrect: (answers[i] + 1) === q.correctAnswer,
          options: q.options
        };
      });

      // Now calculate scores AFTER quizResults is ready
      const totalQuestions = quizResults.length;
      const correctAnswers = quizResults.filter(r => r.isCorrect).length;
      const score = Math.round((correctAnswers / totalQuestions) * 100);

      // Upsert score
      await UserScore.findOneAndUpdate(
        { userId, courseId },
        {
          $push: {

            quizScores: {
              sectionIndex,
              score,
              totalQuestions,
              correctAnswers,
              details: quizResults?.map((q, index) => ({
                question: q.question,
                options: q.options,
                selected: q.selected,
                correct: q.correct
              })),
              attemptedAt: new Date(),
            }
          }
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );
    }

    // Update or create progress
    let progress = await UserProgress.findOne({ userId, courseId });

    if (!progress) {
      progress = new UserProgress({
        userId,
        courseId,
        currentSection: sectionIndex + 1,
        completedSections: [sectionIndex],
      });
    } else {
      if (!progress.completedSections.includes(sectionIndex)) {
        progress.completedSections.push(sectionIndex);
      }
      progress.currentSection = Math.max(progress.currentSection, sectionIndex + 1);
    }

    await progress.save();

    res.status(200).json({
      message: 'Progress updated',
      nextSection: progress.currentSection,
      quizResults,
    });

  } catch (err) {
    console.error("Progress update error:", err);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

router.get("/getCources", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user;
    console.log("🚀 ~ router.get ~ role:", role)

    const courseFilter = req.user.role === 'admin' ? {} : { isActive: true };
    const courses = await Course.find(courseFilter).sort({ createdAt: -1 });

    const progressData = await UserProgress.find({ userId });

    const progressMap = progressData.reduce((acc, prog) => {
      acc[prog.courseId] = prog;
      return acc;
    }, {});

    const coursesWithProgress = courses.map((course) => {
      const progress = progressMap[course._id];
      const completedCount = progress?.completedSections?.length || 0;
      const totalCount = course.sections?.length || 0;
      const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      return {
        _id: course._id,
        title: course.title,
        createdAt: course.createdAt,
        isActive: course.isActive,
        completedCount,
        totalCount,
        percentage
      };
    });

    res.status(200).json(coursesWithProgress);
  } catch (err) {
    console.error("Fetch courses error:", err);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

router.put('/update/:id', verifyAdmin, async (req, res) => {
  try {
    const { title, description, sections } = req.body;
    const courseId = req.params.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    course.title = title || course.title;
    course.description = description || course.description;
    course.sections = sections || course.sections;
    course.updatedAt = new Date();

    await course.save();

    res.status(200).json({ message: "Course updated successfully", course });
  } catch (err) {
    console.error("Error updating course:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/getCourse/:id", verifyToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) return res.status(404).json({ error: "Course not found" });

    res.status(200).json(course);
  } catch (err) {
    console.error("Error fetching course:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.get('/getCourse/:courseId/sections-titles', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const course = await Course.findById(courseId).select('sections.title');
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const progress = await UserProgress.findOne({ userId, courseId });

    const currentSection = progress?.currentSection ?? 0;
    const completed = progress?.completedSections || [];

    const sectionsWithStatus = course.sections.map((section, index) => ({
      title: section.title,
      index,
      isCompleted: completed.includes(index),
      isAccessible: index <= currentSection,
    }));

    res.json({
      courseId,
      totalSections: course.sections.length,
      currentSection,
      sections: sectionsWithStatus,
    });
  } catch (err) {
    console.error("Section title fetch error:", err);
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
});

// GET /api/courses/:courseId/section/:sectionIndex
router.get('/getCourse/:courseId/section/:sectionIndex', verifyToken, async (req, res) => {
  try {
    const { courseId, sectionIndex } = req.params;
    const userId = req.user.id;

    // Fetch user's progress for this course
    const progress = await UserProgress.findOne({ userId, courseId });

    // Block if not allowed
    console.log("🚀 ~ router.get ~ sectionIndex:", sectionIndex)

    if (!progress && parseInt(sectionIndex) === 0) {
      await UserProgress.create({
        userId,
        courseId,
        currentSection: 0,
        completedSections: []
      });
    } else
      if (progress.currentSection < sectionIndex) {
        console.log("🚀 ~ router.get ~ progress:", progress)
        return res.status(403).json({ error: 'Complete previous sections first' });
      }

    // Fetch section
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const section = course.sections[sectionIndex];

    const sectionSafe = {
      ...section.toObject(), // Convert Mongoose doc to plain object
      quiz: section.quiz.map(q => ({
        question: q.question,
        options: q.options
      }))
    };
    res.json(sectionSafe);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching section' });
  }
});



module.exports = router;

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
