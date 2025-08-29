const mongoose = require('mongoose');

const vocabularySchema = new mongoose.Schema({
  word: { type: String, required: true },
  meaning: { type: String, required: true }
});

module.exports = mongoose.model('Vocabulary', vocabularySchema);
