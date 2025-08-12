const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const userRoutes = require('./routes/users');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const coursesRoutes = require('./routes/cources');
const adminContentRoutes = require('./routes/adminContent');
const speechPracticeRoutes = require('./routes/SpeechPratise');
const voicePractiseRoututes = require('./routes/voiceCourseRoute');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/user', userRoutes)
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminContentRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/speechPractise', speechPracticeRoutes);
app.use('/api/voicePractise', voicePractiseRoututes)

app.use('/api/courseComments', require('./routes/CourseComments'));
app.use('/api/vocabulary', require('./routes/vocabulary'));
app.use('/api/stories', require('./routes/stories'));
app.use('/api/pronunciation', require('./routes/pronunciation'));

// admin auth
const adminAuthRoutes = require('./routes/adminAuth');
app.use('/api/adminAuth', adminAuthRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch(err => console.log(err));
