const mongoose = require('mongoose');

const numberedItemSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
});

const expandableItemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  detail: { type: String, default: '', trim: true },
});

const tipSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ['tips', 'sunnah'], required: true },
    color: { type: String, default: 'green' },
    items: [{ text: { type: String, trim: true } }], // legacy — রাখা হয়েছে পুরনো data এর জন্য
    numberedItems: [numberedItemSchema],
    expandableItems: [expandableItemSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Tip', tipSchema);
