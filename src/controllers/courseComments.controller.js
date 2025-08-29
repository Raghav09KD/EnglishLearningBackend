const CourseComments = require('../models/CourseComments');

// Add a comment
exports.addComment = async (req, res) => {
  const { courseId, comment } = req.body;

  if (!courseId || !comment) {
    return res.status(400).json({ error: 'Course ID and comment are required' });
  }

  try {
    const newComment = new CourseComments({
      courseId,
      userId: req.user.id,
      comment,
    });

    await newComment.save();
    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get comments for a course
exports.getCommentsByCourse = async (req, res) => {
  try {
    const comments = await CourseComments.find({ courseId: req.params.courseId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
