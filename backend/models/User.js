const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    status: { type: String, enum: ['active', 'banned'], default: 'active' },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    bannedReason: { type: String, default: '' },
    lastLogin: { type: Date, default: null },

    // ✅ Forgot Password fields
    resetPasswordOTP: { type: String, default: null },
    resetPasswordOTPExpire: { type: Date, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordTokenExpire: { type: Date, default: null },
  },
  { timestamps: true },
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

// OTP generate করার method
userSchema.methods.generateResetOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  this.resetPasswordOTP = otp;
  this.resetPasswordOTPExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 মিনিট

  // Secure token (OTP verify করার পরে password reset এর জন্য)
  const token = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = token;
  this.resetPasswordTokenExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 মিনিট

  return { otp, token };
};

module.exports = mongoose.model('User', userSchema);
