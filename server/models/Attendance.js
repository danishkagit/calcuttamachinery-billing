const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  labourId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Labour', required: true },
  date:      { type: Date, required: true },
  type:      { type: String, enum: ['hourly', 'daily'], required: true },
  hoursWorked: { type: Number, default: 0 },
  rateUsed:  { type: Number, default: 0 },
  amount:    { type: Number, default: 0 },
  notes:     { type: String, trim: true },
  createdAt: { type: Date, default: Date.now }
});

attendanceSchema.index({ userId: 1, date: -1 });
attendanceSchema.index({ labourId: 1, date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
