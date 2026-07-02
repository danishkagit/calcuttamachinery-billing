const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Party = require('../models/Party');
const { protect } = require('../middleware/auth');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }
  next();
};

router.post('/', protect, [
  body('partyType').isIn(['Customer', 'Supplier']).withMessage('Invalid party type'),
  body('name').notEmpty().withMessage('Name is required'),
  body('mobile').notEmpty().withMessage('Mobile is required'),
], validate, async (req, res) => {
  try {
    const party = await Party.create(req.body);
    res.status(201).json({ success: true, data: party });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/import', protect, async (req, res) => {
  try {
    const parties = req.body;
    if (!Array.isArray(parties) || parties.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid data format. Expected an array of parties.' });
    }

    // Add user ID to each party if missing, assuming single-user auth or we use req.user.id
    const processedParties = parties.map(p => ({
      ...p,
      userId: req.user.id
    }));

    const imported = await Party.insertMany(processedParties);
    res.status(201).json({ success: true, count: imported.length, data: imported });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) {
      filter.partyType = req.query.type;
    }

    const parties = await Party.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: parties, count: parties.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const party = await Party.findById(req.params.id);
    if (!party) {
      return res.status(404).json({ success: false, error: 'Party not found' });
    }
    res.json({ success: true, data: party });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const party = await Party.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!party) {
      return res.status(404).json({ success: false, error: 'Party not found' });
    }

    res.json({ success: true, data: party });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const party = await Party.findByIdAndDelete(req.params.id);

    if (!party) {
      return res.status(404).json({ success: false, error: 'Party not found' });
    }

    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
