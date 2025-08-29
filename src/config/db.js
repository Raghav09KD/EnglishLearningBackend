// src/config/db.js
const mongoose = require('mongoose');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1); // stop app if DB fails
  }
};

module.exports = connectDB;
