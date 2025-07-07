const express = require('express');
const router = express.Router();
const Story = require('../models/Story');

router.get('/', async (req, res) => {
  const stories = await Story.find();
  res.json(stories);
});

router.post('/', async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });

  const newStory = new Story({ title, content });
  await newStory.save();
  res.status(201).json(newStory);
});

router.delete('/:id', async (req, res) => {
  await Story.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

module.exports = router;
