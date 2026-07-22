const mongoose = require('mongoose');

const labourSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name:      { type: String, required: [true, 'Please provide labour name'], trim: true },
  phone:     { type: String, trim: true },
  hourlyRate: { type: Number, default: 0 },
  dailyRate: { type: Number, default: 0 },
  address:   { type: String, trim: true },
  active:    { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Labour', labourSchema);
