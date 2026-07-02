const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  description: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  unit: {
    type: String,
    trim: true
  },
  rate: {
    type: Number,
    required: true,
    default: 0
  },
  taxableValue: {
    type: Number,
    default: 0
  },
  taxRate: {
    type: Number,
    default: 0
  },
  cgst: {
    type: Number,
    default: 0
  },
  sgst: {
    type: Number,
    default: 0
  },
  igst: {
    type: Number,
    default: 0
  },
  cess: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  }
});

const invoiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  invoiceNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date
  },
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  items: [invoiceItemSchema],
  subtotal: {
    type: Number,
    default: 0
  },
  cgstTotal: {
    type: Number,
    default: 0
  },
  sgstTotal: {
    type: Number,
    default: 0
  },
  igstTotal: {
    type: Number,
    default: 0
  },
  cessTotal: {
    type: Number,
    default: 0
  },
  grandTotal: {
    type: Number,
    default: 0
  },
  roundOff: {
    type: Number,
    default: 0
  },
  totalBeforeTax: {
    type: Number,
    default: 0
  },
  totalTax: {
    type: Number,
    default: 0
  },
  amountInWords: {
    type: String,
    trim: true
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Unpaid', 'Partial'],
    default: 'Unpaid'
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    trim: true
  },
  transportMode: {
    type: String,
    trim: true
  },
  vehicleNo: {
    type: String,
    trim: true
  },
  transportName: {
    type: String,
    trim: true
  },
  eWayBillNo: {
    type: String,
    trim: true
  },
  dateOfSupply: {
    type: Date
  },
  placeOfSupply: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  termsAndConditions: {
    type: String,
    trim: true
  },
  invoiceType: {
    type: String,
    enum: ['Tax Invoice', 'Bill of Supply', 'Credit Note', 'Debit Note', 'Proforma Invoice', 'Quotation', 'Delivery Challan', 'Purchase Order'],
    default: 'Tax Invoice'
  },
  irn: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
