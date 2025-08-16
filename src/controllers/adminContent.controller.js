const Course = require('../models/Course');
const UserProgress = require('../models/CourseProgress');
const UserScore = require('../models/UserScore');

// GET progress
exports.getProgress = async (req, res) => {
  try {
    const { userId } = req.query;

    let fetchUserId;
    if (req.user.role === 'admin') {
      fetchUserId = userId; // Admin can fetch any user or their own
    } else {
      fetchUserId = req.user.id; // Regular users can only fetch their own progress
    }

    const userProgressQuery = userId ? { userId } : {};
    const userProgressList = await UserProgress.find(userProgressQuery)
      .populate('userId', 'name email')
      .populate('courseId', 'title')
      .lean();

    const userScoresQuery = userId ? { userId } : {};
    const userScores = await UserScore.find(userScoresQuery).lean();

    const validProgressList = userProgressList.filter(
      (p) => p.userId && p.courseId
    );

    const mergedData = validProgressList.map(progress => {
      const matchingScore = userScores.find(score =>
        String(score.userId) === String(progress.userId._id) &&
        String(score.courseId) === String(progress.courseId._id)
      );

      return {
        user: progress.userId,
        course: progress.courseId,
        completedSections: progress.completedSections,
        currentSection: progress.currentSection,
        medal: matchingScore?.medal || 'none',
        quizScores: matchingScore?.quizScores || [],
      };
    });

    res.status(200).json(mergedData);
  } catch (err) {
    console.error("Admin progress fetch error:", err);
    res.status(500).json({ error: "Failed to fetch student progress" });
  }
};

// CREATE course
exports.createCourse = async (req, res) => {
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
};

// UPDATE course
exports.updateCourse = async (req, res) => {
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
};
