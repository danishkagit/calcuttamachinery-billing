const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  businessName: {
    type: String,
    required: [true, 'Please provide business name'],
    trim: true
  },
  gstin: {
    type: String,
    trim: true,
    maxlength: 15
  },
  pan: {
    type: String,
    trim: true,
    maxlength: 10
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    trim: true,
    maxlength: 10
  },
  mobile: {
    type: String,
    trim: true,
    maxlength: 15
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  bankName: {
    type: String,
    trim: true
  },
  accountNo: {
    type: String,
    trim: true
  },
  ifscCode: {
    type: String,
    trim: true
  },
  signature: {
    type: String,
    trim: true
  },
  logo: {
    type: String,
    trim: true
  },
  invoicePrefix: {
    type: String,
    trim: true,
    default: 'INV-'
  },
  defaultTemplate: {
    type: String,
    trim: true,
    default: 'classic'
  },
  templateSettings: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  lastInvoiceNo: {
    type: Number,
    default: 0
  },
  stateCode: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Company', companySchema);
