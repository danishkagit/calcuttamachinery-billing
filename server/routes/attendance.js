const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const Labour = require('../models/Labour');
const { protect } = require('../middleware/auth');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }
  next();
};

router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    if (req.query.labourId) filter.labourId = req.query.labourId;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.startDate && req.query.endDate) {
      filter.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate + 'T23:59:59.999Z')
      };
    }

    const total = await Attendance.countDocuments(filter);
    const records = await Attendance.find(filter)
      .populate('labourId', 'name hourlyRate dailyRate')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalAmount = records.reduce((s, r) => s + r.amount, 0);

    res.json({
      success: true,
      data: records,
      count: records.length,
      total,
      totalAmount,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/summary', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.startDate && req.query.endDate) {
      filter.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate + 'T23:59:59.999Z')
      };
    }
    if (req.query.labourId) filter.labourId = req.query.labourId;

    const summary = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$labourId',
          totalAmount: { $sum: '$amount' },
          totalHours: { $sum: '$hoursWorked' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'labours',
          localField: '_id',
          foreignField: '_id',
          as: 'labour'
        }
      },
      { $unwind: '$labour' },
      { $sort: { totalAmount: -1 } }
    ]);

    const grandTotal = summary.reduce((s, r) => s + r.totalAmount, 0);

    res.json({ success: true, data: summary, grandTotal });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', protect, [
  body('labourId').notEmpty().withMessage('Labour is required'),
  body('date').notEmpty().withMessage('Date is required'),
  body('type').isIn(['hourly', 'daily']).withMessage('Type must be hourly or daily'),
], validate, async (req, res) => {
  try {
    const labour = await Labour.findById(req.body.labourId);
    if (!labour) {
      return res.status(404).json({ success: false, error: 'Labour not found' });
    }

    const attendanceData = {
      ...req.body,
      userId: req.user.id,
      date: new Date(req.body.date)
    };

    if (req.body.type === 'hourly') {
      attendanceData.hoursWorked = req.body.hoursWorked || 0;
      attendanceData.rateUsed = labour.hourlyRate || 0;
      attendanceData.amount = attendanceData.hoursWorked * attendanceData.rateUsed;
    } else {
      attendanceData.hoursWorked = 0;
      attendanceData.rateUsed = labour.dailyRate || 0;
      attendanceData.amount = attendanceData.rateUsed;
    }

    const record = await Attendance.create(attendanceData);
    const populated = await Attendance.findById(record._id).populate('labourId', 'name hourlyRate dailyRate');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const record = await Attendance.findById(req.params.id).populate('labourId', 'name hourlyRate dailyRate');
    if (!record) {
      return res.status(404).json({ success: false, error: 'Attendance record not found' });
    }
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const existing = await Attendance.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Attendance record not found' });
    }

    const updateData = { ...req.body };
    if (req.body.date) updateData.date = new Date(req.body.date);

    if (req.body.type || (req.body.hoursWorked !== undefined)) {
      const labour = await Labour.findById(existing.labourId);
      if (!labour) {
        return res.status(400).json({ success: false, error: 'Associated labour not found' });
      }
      const type = req.body.type || existing.type;
      const hoursWorked = req.body.hoursWorked !== undefined ? req.body.hoursWorked : existing.hoursWorked;

      if (type === 'hourly') {
        updateData.rateUsed = labour.hourlyRate || 0;
        updateData.amount = hoursWorked * updateData.rateUsed;
      } else {
        updateData.hoursWorked = 0;
        updateData.rateUsed = labour.dailyRate || 0;
        updateData.amount = updateData.rateUsed;
      }
    }

    const record = await Attendance.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
      .populate('labourId', 'name hourlyRate dailyRate');

    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const record = await Attendance.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Attendance record not found' });
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
