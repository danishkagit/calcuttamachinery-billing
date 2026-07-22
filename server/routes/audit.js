const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');

/**
 * GET /api/audit
 *
 * Query params:
 *   page        {number}  – page number, default 1
 *   limit       {number}  – records per page, max 100, default 20
 *   resource    {string}  – filter by resource name (case-insensitive)
 *   startDate   {string}  – ISO date, inclusive lower bound on createdAt
 *   endDate     {string}  – ISO date, inclusive upper bound on createdAt
 *   action      {string}  – CREATE | UPDATE | DELETE
 *   resourceId  {string}  – filter by specific document ObjectId
 *
 * Returns logs for the authenticated user, sorted newest-first.
 */
router.get('/', protect, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const filter = { userId: req.user._id };

    // Resource name filter (e.g. 'Invoice', 'Party', 'Product')
    if (req.query.resource) {
      filter.resource = { $regex: `^${req.query.resource}$`, $options: 'i' };
    }

    // Action filter
    if (req.query.action && ['CREATE', 'UPDATE', 'DELETE'].includes(req.query.action.toUpperCase())) {
      filter.action = req.query.action.toUpperCase();
    }

    // Resource ID filter
    if (req.query.resourceId && mongoose.isValidObjectId(req.query.resourceId)) {
      filter.resourceId = new mongoose.Types.ObjectId(req.query.resourceId);
    }

    // Date range on createdAt
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        // Include the whole end day
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email')
        .lean(),
      AuditLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: logs,
      count: logs.length,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
