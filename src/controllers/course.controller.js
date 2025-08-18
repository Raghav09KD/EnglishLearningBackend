const mongoose = require('mongoose');
const Course = require('../models/Course');
const UserProgress = require('../models/CourseProgress');
const UserScore = require('../models/UserScore');
const User = require('../models/User');

const featureFlags = require('../config/featureFlags')

// CREATE course
exports.createCourse = async (req, res) => {
  try {
    const { title, description, sections } = req.body;

    console.log(req.user.role)
    const course = new Course({
      title,
      description,
      sections,
      createdBy: req.user.id,
      isGlobal: req.user.role === "admin" ? true : false,
    });
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE course
exports.updateCourse = async (req, res) => {
  try {
    const { title, description, sections, isActive } = req.body;
    const courseId = req.params.id;



    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    course.title = title || course.title;
    course.description = description || course.description;
    course.sections = sections || course.sections;
    if (typeof isActive === 'boolean') course.isActive = isActive;
    course.updatedAt = new Date();

    await course.save();
    res.status(200).json({ message: "Course updated successfully", course });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let courseFilter = {};

    let user = await User.findOne({ _id: userId });
    // Student: only active courses
    if (user?.role === "student" && featureFlags.teacherCourseRestriction) {
      courseFilter = {
        isActive: true,
        $or: [
          { createdBy: user?.teacher }, // student’s teacher courses
          { isGlobal: true }            // global courses
        ]
      };
    }

    // Teacher: restrict if feature flag is ON
    if (userRole === "teacher" && featureFlags.teacherCourseRestriction) {
      courseFilter.createdBy = userId; // only their own
    }

    // Admin: no restriction (can see all)
    // if role === admin → leave courseFilter empty

    const courses = await Course.find(courseFilter).sort({ createdAt: -1 });

    // Fetch progress for current user
    const progressData = await UserProgress.find({ userId });
    const progressMap = progressData.reduce((acc, prog) => {
      acc[prog.courseId] = prog;
      return acc;
    }, {});

    const coursesWithProgress = courses.map((course) => {
      const progress = progressMap[course._id];
      const completedCount = progress?.completedSections?.length || 0;
      const totalCount = course.sections?.length || 0;
      const percentage =
        totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      return {
        _id: course._id,
        title: course.title,
        createdAt: course.createdAt,
        isActive: course.isActive,
        completedCount,
        totalCount,
        percentage,
      };
    });

    res.status(200).json(coursesWithProgress);
  } catch (err) {
    console.error("Error in getCourses:", err);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
};

// GET single course
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.status(200).json(course);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET section titles
exports.getSectionTitles = async (req, res) => {
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
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
};

// GET specific section
exports.getSectionByIndex = async (req, res) => {
  try {
    const { courseId, sectionIndex } = req.params;
    const userId = req.user.id;

    const progress = await UserProgress.findOne({ userId, courseId });

    if (!progress && parseInt(sectionIndex) === 0) {
      await UserProgress.create({
        userId,
        courseId,
        currentSection: 0,
        completedSections: []
      });
    } else if (progress.currentSection < sectionIndex) {
      return res.status(403).json({ error: 'Complete previous sections first' });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const section = course.sections[sectionIndex];
    const sectionSafe = {
      ...section.toObject(),
      quiz: section.quiz.map(q => ({
        question: q.question,
        options: q.options
      }))
    };

    res.json(sectionSafe);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching section' });
  }
};

// UPDATE progress
exports.updateProgress = async (req, res) => {
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
      quizResults = section.quiz.map((q, i) => ({
        question: q.question,
        selected: answers[i] + 1,
        correct: q.correctAnswer,
        isCorrect: (answers[i] + 1) === q.correctAnswer,
        options: q.options
      }));

      const totalQuestions = quizResults.length;
      const correctAnswers = quizResults.filter(r => r.isCorrect).length;
      const score = Math.round((correctAnswers / totalQuestions) * 100);

      await UserScore.findOneAndUpdate(
        { userId, courseId },
        {
          $push: {
            quizScores: {
              sectionIndex,
              score,
              totalQuestions,
              correctAnswers,
              details: quizResults.map(q => ({
                question: q.question,
                options: q.options,
                selected: q.selected,
                correct: q.correct
              })),
              attemptedAt: new Date(),
            }
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

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
    await assignMedalIfCompleted(userId, course);

    res.status(200).json({
      message: 'Progress updated',
      nextSection: progress.currentSection,
      quizResults,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update progress' });
  }
};


const assignMedalIfCompleted = async (userId, course) => {
  const totalSections = course.sections.length;

  const userProgress = await UserProgress.findOne({ userId, courseId: course._id });

  if (!userProgress || userProgress.completedSections.length < totalSections) {
    return; // Not all sections completed yet
  }

  const userScore = await UserScore.findOne({ userId, courseId: course._id });
  if (!userScore) return;

  // If medal already assigned, skip
  if (userScore.medal && userScore.medal !== 'none') return;

  // Calculate average score
  const quizScores = userScore.quizScores || [];
  const speechScores = userScore.speechScores || [];

  let totalQuizScore = 0;
  let totalQuizMax = 0;

  quizScores.forEach(q => {
    totalQuizScore += q.score;
    totalQuizMax += 100;
  });

  let totalSpeechScore = 0;
  let totalSpeechMax = 0;

  speechScores.forEach(s => {
    totalSpeechScore += s.score;
    totalSpeechMax += 100;
  });

  const quizPercent = totalQuizMax ? (totalQuizScore / totalQuizMax) * 100 : 0;
  console.log("🚀 ~ assignMedalIfCompleted ~ quizPercent:", quizPercent)
  // const speechPercent = totalSpeechMax ? (totalSpeechScore / totalSpeechMax) * 100 : 0;
  // console.log("🚀 ~ assignMedalIfCompleted ~ speechPercent:", speechPercent)
  // const avg = (quizPercent + speechPercent) / 2;
  // console.log("🚀 ~ assignMedalIfCompleted ~ avg:", avg)

  let medal = 'none';
  if (quizPercent >= 90) medal = 'gold';
  else if (quizPercent >= 75) medal = 'silver';
  else if (quizPercent >= 50) medal = 'bronze';

  userScore.medal = medal;
  await userScore.save();

  console.log(`🥇 Medal assigned to user ${userId}: ${medal}`);
};