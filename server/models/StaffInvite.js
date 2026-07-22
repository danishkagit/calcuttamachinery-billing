const mongoose = require('mongoose');

const staffInviteSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Inviting user is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  name: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['owner', 'accountant', 'salesperson', 'viewer'],
    default: 'salesperson'
  },
  permissions: {
    canCreateInvoice:  { type: Boolean, default: false },
    canEditInvoice:    { type: Boolean, default: false },
    canDeleteInvoice:  { type: Boolean, default: false },
    canViewReports:    { type: Boolean, default: false },
    canManageParties:  { type: Boolean, default: false },
    canManageProducts: { type: Boolean, default: false },
    canManageExpenses: { type: Boolean, default: false },
    canManageStaff:    { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  token: {
    type: String,
    unique: true,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for fast token lookups and auto-expiry queries
staffInviteSchema.index({ token: 1 });
staffInviteSchema.index({ companyId: 1, status: 1 });
staffInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL: Mongo removes docs after expiresAt

module.exports = mongoose.model('StaffInvite', staffInviteSchema);
