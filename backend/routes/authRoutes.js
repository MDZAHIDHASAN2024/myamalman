const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  changePassword,
  updateTheme,
  forgotPassword,
  verifyOTP,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.put('/theme', protect, updateTheme);

// ✅ Forgot Password Routes
router.post('/forgot-password', forgotPassword); // Step 1: Email দিয়ে OTP নেওয়া
router.post('/verify-otp', verifyOTP); // Step 2: OTP verify করা
router.post('/reset-password', resetPassword); // Step 3: নতুন password সেট করা

module.exports = router;
