const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { INDIAN_STATES } = require('../utils/constants');

router.get('/:gstin', protect, async (req, res) => {
  try {
    const { gstin } = req.params;

    if (!gstin || gstin.length !== 15) {
      return res.status(400).json({ success: false, error: 'Invalid GSTIN format' });
    }

    const stateCode = Number(gstin.substring(0, 2));
    const panNumber = gstin.substring(2, 12);
    const state = INDIAN_STATES.find(s => s.code === stateCode);

    res.json({
      success: true,
      data: {
        gstin,
        stateCode,
        panNumber,
        stateName: state ? state.name : 'Unknown',
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to parse GSTIN' });
  }
});

module.exports = router;
