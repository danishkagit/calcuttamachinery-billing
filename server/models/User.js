const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const permissionsSchema = new mongoose.Schema({
  canCreateInvoice:   { type: Boolean, default: false },
  canEditInvoice:     { type: Boolean, default: false },
  canDeleteInvoice:   { type: Boolean, default: false },
  canViewReports:     { type: Boolean, default: false },
  canManageParties:   { type: Boolean, default: false },
  canManageProducts:  { type: Boolean, default: false },
  canManageExpenses:  { type: Boolean, default: false },
  canManageStaff:     { type: Boolean, default: false }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    minlength: 6,
    select: false
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  phone: {
    type: String,
    trim: true,
    maxlength: 15
  },
  // ── Staff / multi-user fields ──────────────────────────────────────
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null
  },
  staffRole: {
    type: String,
    enum: ['owner', 'accountant', 'salesperson', 'viewer'],
    default: null
  },
  permissions: {
    type: permissionsSchema,
    default: null
  },
  // true for self-registered users; false for staff added via invite
  isOwner: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET || 'calcutta_machinery_jwt_secret_2024', {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

module.exports = mongoose.model('User', userSchema);
