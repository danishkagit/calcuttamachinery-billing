const mongoose = require('mongoose');

const partySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  partyType: {
    type: String,
    enum: ['Customer', 'Supplier'],
    required: [true, 'Please select party type']
  },
  name: {
    type: String,
    required: [true, 'Please provide party name'],
    trim: true
  },
  companyName: {
    type: String,
    trim: true
  },
  gstin: {
    type: String,
    trim: true,
    maxlength: 15
  },
  mobile: {
    type: String,
    trim: true,
    required: [true, 'Please provide mobile number'],
    maxlength: 15
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
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
  openingBalance: {
    type: Number,
    default: 0
  },
  creditLimit: {
    type: Number,
    default: 0
  },
  group: {
    type: String,
    trim: true,
    default: 'General'
  },
  billingAddress: {
    type: String,
    trim: true
  },
  shippingAddress: {
    type: String,
    trim: true
  },
  stateCode: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

partySchema.pre('save', function (next) {
  if (!this.billingAddress) this.billingAddress = this.address;
  if (!this.shippingAddress) this.shippingAddress = this.address;
  next();
});

module.exports = mongoose.model('Party', partySchema);
