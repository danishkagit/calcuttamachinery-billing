const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  name: {
    type: String,
    required: [true, 'Please provide product name'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  unit: {
    type: String,
    enum: ['Nos', 'Kgs', 'Ltrs', 'Pcs', 'Box', 'Meter', 'Sqft', 'Dozen', 'Pack', 'Set'],
    required: [true, 'Please select unit'],
    default: 'Nos'
  },
  hsnCode: {
    type: String,
    trim: true
  },
  taxRate: {
    type: Number,
    required: [true, 'Please provide tax rate'],
    default: 18
  },
  cess: {
    type: Number,
    default: 0
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Please provide selling price'],
    default: 0
  },
  purchasePrice: {
    type: Number,
    default: 0
  },
  openingStock: {
    type: Number,
    default: 0
  },
  lowStockAlert: {
    type: Number,
    default: 5
  },
  gstType: {
    type: String,
    enum: ['gst', 'igst'],
    default: 'gst'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);
