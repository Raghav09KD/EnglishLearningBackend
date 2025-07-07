const express = require('express');
const router = express.Router();
const Pronunciation = require('../models/Pronunciation');

router.get('/', async (req, res) => {
  const list = await Pronunciation.find();
  res.json(list);
});

router.post('/', async (req, res) => {
  const { word, hint } = req.body;
  if (!word) return res.status(400).json({ error: 'Word required' });

  const newWord = new Pronunciation({ word, hint });
  await newWord.save();
  res.status(201).json(newWord);
});

router.put('/:id', async (req, res) => {
  const { word, hint } = req.body;
  const updated = await Pronunciation.findByIdAndUpdate(
    req.params.id,
    { word, hint },
    { new: true }
  );
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  await Pronunciation.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

module.exports = router;
