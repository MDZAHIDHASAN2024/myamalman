const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true }, // fajr, dhuhr, etc.
  time: { type: String, required: true }, // HH:MM
  enabled: { type: Boolean, default: true },
  label: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Reminder', reminderSchema);
