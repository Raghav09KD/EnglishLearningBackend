const mongoose = require('mongoose');

const pronunciationSchema = new mongoose.Schema({
  word: { type: String, required: true },
  hint: { type: String }
});

module.exports = mongoose.model('Pronunciation', pronunciationSchema);
