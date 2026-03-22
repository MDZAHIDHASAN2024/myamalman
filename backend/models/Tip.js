const mongoose = require('mongoose');

const tipItemSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
});

const tipSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ['tips', 'sunnah'], required: true },
    items: [tipItemSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Tip', tipSchema);
