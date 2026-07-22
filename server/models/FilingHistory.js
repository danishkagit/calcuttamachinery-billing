const mongoose = require('mongoose');

const filingHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    returnType: {
      type: String,
      enum: ['GSTR-1', 'GSTR-3B'],
      required: true
    },
    /**
     * Period in "YYYY-MM" format, e.g. "2024-03".
     * Stored as a plain string so it can be filtered / sorted lexicographically.
     */
    period: {
      type: String,
      required: true,
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'Period must be in YYYY-MM format']
    },
    status: {
      type: String,
      enum: ['filed', 'saved', 'submitted'],
      default: 'filed'
    },
    filedAt: {
      type: Date,
      default: Date.now
    },
    acknowledgmentNo: {
      type: String,
      trim: true,
      default: ''
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null
    }
  },
  {
    timestamps: false // filedAt is the canonical timestamp
  }
);

// Index for fast per-user queries sorted by most recent first
filingHistorySchema.index({ userId: 1, filedAt: -1 });
filingHistorySchema.index({ userId: 1, returnType: 1, period: 1 });

module.exports = mongoose.model('FilingHistory', filingHistorySchema);
