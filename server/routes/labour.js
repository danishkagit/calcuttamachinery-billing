const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Labour = require('../models/Labour');
const { protect } = require('../middleware/auth');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }
  next();
};

router.post('/', protect, [
  body('name').notEmpty().withMessage('Labour name is required'),
], validate, async (req, res) => {
  try {
    const labour = await Labour.create({ ...req.body, userId: req.user.id });
    res.status(201).json({ success: true, data: labour });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/import', protect, async (req, res) => {
  try {
    const records = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid data format. Expected an array.' });
    }

    const processed = records.map(r => ({
      ...r,
      userId: req.user.id
    }));

    const imported = await Labour.insertMany(processed);
    res.status(201).json({ success: true, count: imported.length, data: imported });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }

    const labour = await Labour.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: labour, count: labour.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const labour = await Labour.findById(req.params.id);
    if (!labour) {
      return res.status(404).json({ success: false, error: 'Labour not found' });
    }
    res.json({ success: true, data: labour });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const labour = await Labour.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!labour) {
      return res.status(404).json({ success: false, error: 'Labour not found' });
    }

    res.json({ success: true, data: labour });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const labour = await Labour.findByIdAndDelete(req.params.id);

    if (!labour) {
      return res.status(404).json({ success: false, error: 'Labour not found' });
    }

    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
