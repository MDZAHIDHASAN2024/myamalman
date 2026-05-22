const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

// ✅ Resend দিয়ে Email পাঠানো
const sendEmailViaResend = async ({ to, subject, html }) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'My Amal App <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Email পাঠানো যায়নি');
  }

  return data;
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists)
      return res
        .status(400)
        .json({ success: false, message: 'Email already registered' });

    const count = await User.countDocuments();
    const role = count === 0 ? 'admin' : 'user';

    const user = await User.create({ name, email, password, role });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        theme: user.theme,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials' });
    if (user.status === 'banned')
      return res
        .status(403)
        .json({ success: false, message: `Banned: ${user.bannedReason}` });

    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials' });

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        theme: user.theme,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: 'Current password is wrong' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTheme = async (req, res) => {
  try {
    const { theme } = req.body;
    await User.findByIdAndUpdate(req.user._id, { theme });
    res.json({ success: true, message: 'Theme updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ FORGOT PASSWORD — Step 1: OTP পাঠানো
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email দিন' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Security: user না থাকলেও same response
    if (!user) {
      return res.json({
        success: true,
        message: 'যদি এই Email registered থাকে, তাহলে OTP পাঠানো হয়েছে',
      });
    }

    if (user.status === 'banned') {
      return res
        .status(403)
        .json({ success: false, message: 'এই account টি banned' });
    }

    const { otp, token } = user.generateResetOTP();
    await user.save({ validateBeforeSave: false });

    // ✅ Resend দিয়ে OTP Email পাঠাও
    try {
      await sendEmailViaResend({
        to: user.email,
        subject: 'Password Reset OTP - My Amal 🌙',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f9fafb; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
            <div style="background: linear-gradient(135deg, #1a7a4a, #22c55e); padding: 28px 24px; text-align: center;">
              <h2 style="color: white; margin: 0; font-size: 24px;">🌙 My Amal</h2>
              <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">Password Reset OTP</p>
            </div>
            <div style="padding: 32px 24px;">
              <p style="color: #374151; font-size: 15px; margin: 0 0 8px;">আস-সালামু আলাইকুম <strong>${user.name}</strong>,</p>
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">আপনার password reset করার জন্য নিচের OTP কোডটি ব্যবহার করুন:</p>

              <div style="text-align: center; margin: 0 0 24px;">
                <div style="display: inline-block; background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 14px; padding: 20px 48px;">
                  <span style="font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #1a7a4a; font-family: monospace;">${otp}</span>
                </div>
              </div>

              <p style="color: #ef4444; font-size: 13px; text-align: center; margin: 0 0 24px;">
                ⏰ এই OTP <strong>10 মিনিট</strong> পর্যন্ত valid
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0 0 20px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                আপনি যদি এই request না করে থাকেন, তাহলে এই email টি ignore করুন। আপনার account নিরাপদ আছে।
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Developed by Zahid Hasan | 01745940065
              </p>
            </div>
          </div>
        `,
      });

      console.log(`✅ OTP Email sent to ${user.email}`);
    } catch (emailErr) {
      console.error('❌ Resend email error:', emailErr.message);
      // Email fail হলে OTP clear করে error দাও
      user.resetPasswordOTP = null;
      user.resetPasswordOTPExpire = null;
      user.resetPasswordToken = null;
      user.resetPasswordTokenExpire = null;
      await user.save({ validateBeforeSave: false });
      return res
        .status(500)
        .json({
          success: false,
          message: 'OTP Email পাঠাতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।',
        });
    }

    res.json({
      success: true,
      message: 'যদি এই Email registered থাকে, তাহলে OTP পাঠানো হয়েছে',
    });
  } catch (err) {
    console.error('forgotPassword error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ FORGOT PASSWORD — Step 2: OTP verify করা
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: 'Email এবং OTP দিন' });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordOTP: otp.trim(),
      resetPasswordOTPExpire: { $gt: new Date() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: 'OTP ভুল অথবা মেয়াদ শেষ হয়ে গেছে' });
    }

    // OTP সঠিক — OTP clear করি, token রাখি
    user.resetPasswordOTP = null;
    user.resetPasswordOTPExpire = null;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'OTP verified! এখন নতুন password দিন',
      resetToken: user.resetPasswordToken,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ FORGOT PASSWORD — Step 3: নতুন password সেট করা
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: 'Token এবং নতুন password দিন' });
    }

    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: 'Password দুটি মিলছে না' });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ success: false, message: 'Password কমপক্ষে ৬ অক্ষর হতে হবে' });
    }

    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordTokenExpire: { $gt: new Date() },
    });

    if (!user) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'Reset token invalid অথবা মেয়াদ শেষ',
        });
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpire = null;
    user.resetPasswordOTP = null;
    user.resetPasswordOTPExpire = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password সফলভাবে পরিবর্তন হয়েছে! এখন login করুন 🎉',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
