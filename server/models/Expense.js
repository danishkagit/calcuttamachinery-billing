const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Office Rent', 'Electricity', 'Salary', 'Transport', 'Raw Material', 'Packaging', 'Maintenance', 'Marketing', 'Insurance', 'Legal', 'Travel', 'Stationery', 'Telephone', 'Other'],
    default: 'Other'
  },
  description: {
    type: String,
    trim: true,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  expenseDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Card', 'Others'],
    default: 'Cash'
  },
  reference: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('Expense', expenseSchema);
