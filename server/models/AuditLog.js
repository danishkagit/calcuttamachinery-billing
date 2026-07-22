const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    action: {
      type: String,
      enum: ['CREATE', 'UPDATE', 'DELETE'],
      required: true
    },
    /** Logical resource name, e.g. 'Invoice', 'Party', 'Product' */
    resource: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    /** MongoDB ObjectId of the affected document */
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    /** Human-readable identifier, e.g. invoice number or party name */
    resourceNo: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    /** Client IP extracted from req (supports proxies via X-Forwarded-For) */
    ipAddress: {
      type: String,
      trim: true,
      default: ''
    },
    /** Snapshot of document state before the operation (null for CREATE) */
    oldValues: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    /** Snapshot of document state after the operation (null for DELETE) */
    newValues: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false }
  }
);

// Compound indexes for the most common query patterns
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, resource: 1, createdAt: -1 });
auditLogSchema.index({ resourceId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
