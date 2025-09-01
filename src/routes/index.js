const express = require('express');
const router = express.Router();

const authRoutes = require('./auth/authRoutes');
const adminContentRoutes = require('./adminContent.route');
const coursesRoutes = require('./course.routes');
const speechPracticeRoutes = require('./speech.route');
const voicePractiseRoututes = require('./voice.route');
const courseCommentRoutes = require('./courseComment.route');
const userRoutes = require('./manageUser.route')

router.use('/auth', authRoutes);
router.use('/admin', adminContentRoutes);
router.use('/courses', coursesRoutes);
router.use('/user', userRoutes)
router.use('/speechPractise', speechPracticeRoutes);
router.use('/voicePractise', voicePractiseRoututes);
router.use('/courseComments', courseCommentRoutes);
module.exports = router;

    


// app.use('/api/auth', authRoutes);
// app.use('/api/admin', adminContentRoutes);
// app.use('/api/admin/courses',coursesRoutes);
// app.use('/api/vocabulary', require('./routes/vocabulary'));
// app.use('/api/stories', require('./routes/stories'));
// app.use('/api/pronunciation', require('./routes/pronunciation'));

// // admin auth
// const adminAuthRoutes = require('./routes/adminAuth');
// app.use('/api/adminAuth', adminAuthRoutes);