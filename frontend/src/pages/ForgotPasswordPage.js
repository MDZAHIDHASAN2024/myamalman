import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../utils/api';

// Password strength helper
function PwStrength({ password }) {
  if (!password) return null;
  let strength = 0;
  if (password.length >= 6) strength++;
  if (password.length >= 10) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  const labels = [
    '',
    'দুর্বল',
    'মোটামুটি',
    'ভালো',
    'শক্তিশালী',
    'খুব শক্তিশালী',
  ];
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];
  const widths = ['0%', '20%', '40%', '60%', '80%', '100%'];

  return (
    <div style={{ marginTop: 6 }}>
      <div
        style={{
          height: 4,
          background: 'var(--border)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: widths[strength],
            background: colors[strength],
            borderRadius: 4,
            transition: 'width 0.3s, background 0.3s',
          }}
        />
      </div>
      {strength > 0 && (
        <div
          style={{
            fontSize: 11,
            color: colors[strength],
            marginTop: 4,
            fontWeight: 600,
          }}
        >
          {labels[strength]}
        </div>
      )}
    </div>
  );
}

// OTP Input component
function OTPInput({ value, onChange }) {
  const inputs = useRef([]);
  const digits = (value || '').split('').concat(Array(6).fill('')).slice(0, 6);

  const handleChange = (index, val) => {
    const clean = val.replace(/\D/g, '');
    const newDigits = [...digits];
    newDigits[index] = clean.slice(-1);
    const newValue = newDigits.join('');
    onChange(newValue);
    if (clean && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6).replace(/\s/g, ''));
    if (pasted.length > 0) {
      inputs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        justifyContent: 'center',
        margin: '20px 0',
      }}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          style={{
            width: 46,
            height: 54,
            textAlign: 'center',
            fontSize: 22,
            fontWeight: 700,
            border: `2px solid ${digit ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 10,
            background: digit
              ? 'var(--accent-light, rgba(26,122,74,0.08))'
              : 'var(--input-bg, var(--surface))',
            color: 'var(--text)',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
        />
      ))}
    </div>
  );
}

// Countdown timer component
function Countdown({ seconds, onEnd }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
    if (seconds <= 0) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onEnd?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <span
      style={{
        color: remaining < 60 ? '#ef4444' : 'var(--text-muted)',
        fontWeight: 600,
      }}
    >
      {mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`}
    </span>
  );
}

const STEPS = {
  EMAIL: 'email',
  OTP: 'otp',
  NEW_PASSWORD: 'new_password',
  SUCCESS: 'success',
};

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [otp, setOTP] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [canResend, setCanResend] = useState(false);
  const [countdownKey, setCountdownKey] = useState(0);

  const clearErr = (field) => setErrors((p) => ({ ...p, [field]: '' }));

  // Step 1: Email submit
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!email.trim()) errs.email = 'Email দিন';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = 'সঠিক Email দিন';
    if (Object.keys(errs).length) return setErrors(errs);

    setLoading(true);
    try {
      await API.post('/auth/forgot-password', { email: email.trim() });
      toast.success('OTP পাঠানো হয়েছে! Email চেক করুন 📧');
      setStep(STEPS.OTP);
      setCanResend(false);
      setCountdownKey((k) => k + 1);
    } catch (err) {
      const msg = err.response?.data?.message || 'কিছু সমস্যা হয়েছে';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: OTP verify
  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    const cleanOTP = otp.replace(/\D/g, '');
    if (cleanOTP.length !== 6) {
      return setErrors({ otp: '৬ সংখ্যার OTP দিন' });
    }

    setLoading(true);
    try {
      const res = await API.post('/auth/verify-otp', {
        email: email.trim(),
        otp: cleanOTP,
      });
      setResetToken(res.data.resetToken);
      toast.success('OTP সঠিক! নতুন password দিন ✅');
      setStep(STEPS.NEW_PASSWORD);
    } catch (err) {
      const msg = err.response?.data?.message || 'OTP ভুল';
      setErrors({ otp: msg });
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (!canResend) return;
    setLoading(true);
    try {
      await API.post('/auth/forgot-password', { email: email.trim() });
      toast.success('নতুন OTP পাঠানো হয়েছে!');
      setOTP('');
      setCanResend(false);
      setCountdownKey((k) => k + 1);
    } catch (err) {
      toast.error('OTP পাঠাতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: New password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!newPassword) errs.newPassword = 'নতুন password দিন';
    else if (newPassword.length < 6)
      errs.newPassword = 'কমপক্ষে ৬ অক্ষর হতে হবে';
    if (!confirmPassword) errs.confirmPassword = 'Password নিশ্চিত করুন';
    else if (newPassword !== confirmPassword)
      errs.confirmPassword = 'Password মিলছে না';
    if (Object.keys(errs).length) return setErrors(errs);

    setLoading(true);
    try {
      await API.post('/auth/reset-password', {
        resetToken,
        newPassword,
        confirmPassword,
      });
      setStep(STEPS.SUCCESS);
    } catch (err) {
      const msg = err.response?.data?.message || 'Password পরিবর্তন করা যায়নি';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = {
    [STEPS.EMAIL]: {
      icon: '🔑',
      title: 'Password ভুলে গেছেন?',
      sub: 'Email দিন, OTP পাঠাব',
    },
    [STEPS.OTP]: {
      icon: '📧',
      title: 'OTP দিন',
      sub: `${email} তে OTP পাঠানো হয়েছে`,
    },
    [STEPS.NEW_PASSWORD]: {
      icon: '🔒',
      title: 'নতুন Password',
      sub: 'নিরাপদ password বেছে নিন',
    },
    [STEPS.SUCCESS]: {
      icon: '🎉',
      title: 'সফল হয়েছে!',
      sub: 'Password পরিবর্তন হয়ে গেছে',
    },
  };

  const current = stepTitles[step];

  // Progress bar steps
  const progressSteps = [
    STEPS.EMAIL,
    STEPS.OTP,
    STEPS.NEW_PASSWORD,
    STEPS.SUCCESS,
  ];
  const currentStepIndex = progressSteps.indexOf(step);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: '20px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Card */}
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 20,
            padding: '36px 32px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>{current.icon}</div>
            <h2
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--text)',
              }}
            >
              {current.title}
            </h2>
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 13,
                color: 'var(--text-muted)',
              }}
            >
              {current.sub}
            </p>
          </div>

          {/* Progress Steps */}
          {step !== STEPS.SUCCESS && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 28,
                gap: 0,
              }}
            >
              {[1, 2, 3].map((num, idx) => (
                <React.Fragment key={num}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                      background:
                        currentStepIndex >= idx
                          ? 'var(--accent)'
                          : 'var(--border)',
                      color:
                        currentStepIndex >= idx ? 'white' : 'var(--text-muted)',
                      transition: 'all 0.3s',
                    }}
                  >
                    {currentStepIndex > idx ? '✓' : num}
                  </div>
                  {idx < 2 && (
                    <div
                      style={{
                        flex: 1,
                        height: 3,
                        maxWidth: 60,
                        background:
                          currentStepIndex > idx
                            ? 'var(--accent)'
                            : 'var(--border)',
                        transition: 'background 0.3s',
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* ===== STEP 1: Email ===== */}
          {step === STEPS.EMAIL && (
            <form onSubmit={handleEmailSubmit}>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">আপনার Email</label>
                <input
                  className={`form-control${errors.email ? ' error' : ''}`}
                  type="email"
                  placeholder="Your Register Email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearErr('email');
                  }}
                  autoFocus
                />
                {errors.email && (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--danger)',
                      marginTop: 5,
                    }}
                  >
                    ⚠️ {errors.email}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={loading}
              >
                {loading ? '⏳ পাঠানো হচ্ছে...' : '📧 OTP পাঠান'}
              </button>
            </form>
          )}

          {/* ===== STEP 2: OTP ===== */}
          {step === STEPS.OTP && (
            <form onSubmit={handleOTPSubmit}>
              <OTPInput
                value={otp}
                onChange={(v) => {
                  setOTP(v);
                  clearErr('otp');
                }}
              />
              {errors.otp && (
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--danger)',
                    textAlign: 'center',
                    marginTop: -10,
                    marginBottom: 12,
                  }}
                >
                  ⚠️ {errors.otp}
                </div>
              )}

              {/* Timer & Resend */}
              <div
                style={{
                  textAlign: 'center',
                  marginBottom: 20,
                  fontSize: 13,
                  color: 'var(--text-muted)',
                }}
              >
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    🔄 আবার OTP পাঠান
                  </button>
                ) : (
                  <span>
                    OTP মেয়াদ শেষ হবে:{' '}
                    <Countdown
                      key={countdownKey}
                      seconds={600}
                      onEnd={() => setCanResend(true)}
                    />
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={loading || otp.replace(/\D/g, '').length !== 6}
              >
                {loading ? '⏳ যাচাই করা হচ্ছে...' : '✅ OTP যাচাই করুন'}
              </button>

              <button
                type="button"
                onClick={() => setStep(STEPS.EMAIL)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: 13,
                  marginTop: 12,
                  cursor: 'pointer',
                }}
              >
                ← ফিরে যান
              </button>
            </form>
          )}

          {/* ===== STEP 3: New Password ===== */}
          {step === STEPS.NEW_PASSWORD && (
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label className="form-label">নতুন Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className={`form-control${errors.newPassword ? ' error' : ''}`}
                    type={showPw ? 'text' : 'password'}
                    placeholder="নতুন password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      clearErr('newPassword');
                    }}
                    autoFocus
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => !p)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 16,
                      color: 'var(--text-muted)',
                    }}
                  >
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
                {errors.newPassword && (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--danger)',
                      marginTop: 5,
                    }}
                  >
                    ⚠️ {errors.newPassword}
                  </div>
                )}
                {!errors.newPassword && <PwStrength password={newPassword} />}
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Password নিশ্চিত করুন</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className={`form-control${errors.confirmPassword ? ' error' : confirmPassword && newPassword === confirmPassword ? ' success' : ''}`}
                    type={showConfirmPw ? 'text' : 'password'}
                    placeholder="আবার password দিন"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearErr('confirmPassword');
                    }}
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw((p) => !p)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 16,
                      color: 'var(--text-muted)',
                    }}
                  >
                    {showConfirmPw ? '🙈' : '👁'}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--danger)',
                      marginTop: 5,
                    }}
                  >
                    ⚠️ {errors.confirmPassword}
                  </div>
                )}
                {!errors.confirmPassword &&
                  confirmPassword &&
                  newPassword === confirmPassword && (
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--accent)',
                        marginTop: 5,
                        fontWeight: 600,
                      }}
                    >
                      ✅ Password মিলেছে
                    </div>
                  )}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={loading}
              >
                {loading ? '⏳ পরিবর্তন হচ্ছে...' : '🔒 Password পরিবর্তন করুন'}
              </button>
            </form>
          )}

          {/* ===== STEP 4: Success ===== */}
          {step === STEPS.SUCCESS && (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1a7a4a, #22c55e)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 36,
                  margin: '0 auto 20px',
                  boxShadow: '0 8px 24px rgba(26,122,74,0.3)',
                }}
              >
                ✓
              </div>
              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: 14,
                  marginBottom: 24,
                }}
              >
                আপনার password সফলভাবে পরিবর্তন হয়েছে। এখন নতুন password দিয়ে
                login করুন।
              </p>
              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => navigate('/login')}
              >
                🔐 Login করুন
              </button>
            </div>
          )}
        </div>

        {/* Back to login link */}
        {step !== STEPS.SUCCESS && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              ← Login এ ফিরে যান
            </button>
          </div>
        )}
      </div>

      <style>{`
        .form-control.error { border-color: var(--danger) !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important; }
        .form-control.success { border-color: var(--accent) !important; box-shadow: 0 0 0 3px rgba(26,122,74,0.1) !important; }
      `}</style>
    </div>
  );
}
