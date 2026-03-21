const mongoose = require('mongoose');

const amalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },

    // Salah
    fajr: { type: Boolean, default: false },
    dhuhr: { type: Boolean, default: false },
    asr: { type: Boolean, default: false },
    maghrib: { type: Boolean, default: false },
    isha: { type: Boolean, default: false },

    // Extra
    tahajjud: { type: Boolean, default: false },
    morningDua: { type: Boolean, default: false },
    daytimeTawbah: { type: Boolean, default: false },
    eveningDua: { type: Boolean, default: false },

    // Quran
    quranPages: { type: Number, default: 0 },

    // Fasting - 'fard' added
    fasting: { type: Boolean, default: false },
    fastingType: {
      type: String,
      enum: ['', 'fard', 'monday', 'thursday', 'ayyam_beed', 'other'],
      default: '',
    },

    // Sadaqah
    sadaqah: { type: Boolean, default: false },
    sadaqahAmount: { type: Number, default: 0 },

    // Lifestyle
    foodPlates: { type: Number, default: 0 }, // কত প্লেট খেয়েছেন
    sleepMinutes: { type: Number, default: 0 },

    // Notes
    notes: { type: String, default: '' },

    // Progress Score
    progressScore: { type: Number, default: 0 },
  },
  { timestamps: true },
);

amalSchema.index({ user: 1, date: 1 }, { unique: true });

amalSchema.pre('save', function (next) {
  const checks = [
    this.fajr,
    this.dhuhr,
    this.asr,
    this.maghrib,
    this.isha,
    this.tahajjud,
    this.morningDua,
    this.daytimeTawbah,
    this.eveningDua,
    this.fasting,
    this.sadaqah,
    this.quranPages > 0,
  ];
  const done = checks.filter(Boolean).length;
  this.progressScore = Math.round((done / checks.length) * 100);
  next();
});

module.exports = mongoose.model('Amal', amalSchema);
