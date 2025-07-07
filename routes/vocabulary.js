const express = require('express');
const router = express.Router();
const Vocabulary = require('../models/Vocabulary');

// Get all
router.get('/', async (req, res) => {
  const words = await Vocabulary.find();
  res.json(words);
});

// Create
router.post('/', async (req, res) => {
  const { word, meaning } = req.body;
  if (!word || !meaning) return res.status(400).json({ error: 'Word and meaning required' });

  const newWord = new Vocabulary({ word, meaning });
  await newWord.save();
  res.status(201).json(newWord);
});

// Delete
router.delete('/:id', async (req, res) => {
  await Vocabulary.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

module.exports = router;
