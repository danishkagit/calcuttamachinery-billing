const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Party = require('../models/Party');
const { protect } = require('../middleware/auth');
const { logAudit } = require('../middleware/auditLog');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }
  next();
};

/**
 * Middleware: validate GSTIN if provided and non-empty.
 * Placed after express-validator rules so we can share the single validate() call.
 */
const validateGstin = (req, res, next) => {
  const gstin = req.body.gstin;
  if (gstin && gstin.trim() !== '') {
    if (!GSTIN_REGEX.test(gstin.trim().toUpperCase())) {
      return res.status(400).json({ success: false, error: 'Invalid GSTIN format' });
    }
    // Normalise to upper-case before saving
    req.body.gstin = gstin.trim().toUpperCase();
  }
  next();
};

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// POST /api/parties — Create party
router.post('/', protect, [
  body('partyType').isIn(['Customer', 'Supplier']).withMessage('Invalid party type'),
  body('name').notEmpty().withMessage('Name is required'),
  body('mobile').notEmpty().withMessage('Mobile is required'),
], validate, validateGstin, async (req, res) => {
  try {
    const party = await Party.create({ ...req.body, userId: req.user._id });

    logAudit(
      req,
      'CREATE',
      'Party',
      party._id,
      party.name,
      `Created ${party.partyType} party: ${party.name}`,
      null,
      { name: party.name, partyType: party.partyType, gstin: party.gstin }
    );

    res.status(201).json({ success: true, data: party });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/parties/import — Bulk import parties
router.post('/import', protect, async (req, res) => {
  try {
    const parties = req.body;
    if (!Array.isArray(parties) || parties.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid data format. Expected an array of parties.' });
    }

    // Validate GSTINs in the batch — skip invalid rows with an error entry
    const validParties = [];
    const errors = [];

    parties.forEach((p, i) => {
      if (p.gstin && p.gstin.trim() !== '') {
        const normalised = p.gstin.trim().toUpperCase();
        if (!GSTIN_REGEX.test(normalised)) {
          errors.push(`Row ${i + 1}: Invalid GSTIN format for party ${p.name || ''}`);
          return; // skip this record
        }
        p.gstin = normalised;
      }
      validParties.push({ ...p, userId: req.user._id });
    });

    const imported = await Party.insertMany(validParties, { ordered: false });

    res.status(201).json({
      success: true,
      count: imported.length,
      data: imported,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/parties — List parties
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

// GET /api/parties/:id — Get single party
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

// PUT /api/parties/:id — Update party
router.put('/:id', protect, validateGstin, async (req, res) => {
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

// DELETE /api/parties/:id — Delete party
router.delete('/:id', protect, async (req, res) => {
  try {
    const party = await Party.findByIdAndDelete(req.params.id);

    if (!party) {
      return res.status(404).json({ success: false, error: 'Party not found' });
    }

    logAudit(
      req,
      'DELETE',
      'Party',
      party._id,
      party.name,
      `Deleted ${party.partyType} party: ${party.name}`,
      { name: party.name, partyType: party.partyType, gstin: party.gstin },
      null
    );

    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
