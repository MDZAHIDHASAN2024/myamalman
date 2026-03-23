import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function validate(form, isLogin) {
  const errors = {};

  if (!isLogin) {
    const name = form.name.trim();
    if (!name) {
      errors.name = 'নাম দিন';
    } else if (name.length < 2) {
      errors.name = 'নাম কমপক্ষে ২ অক্ষর হতে হবে';
    } else if (/^[0-9]+$/.test(name)) {
      errors.name = 'নাম শুধু সংখ্যা দিয়ে হবে না';
    } else if (!/[a-zA-Z\u0980-\u09FF]/.test(name)) {
      errors.name = 'নাম এ অন্তত একটি অক্ষর থাকতে হবে';
    }
  }

  if (!form.email.trim()) {
    errors.email = 'Email দিন';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'সঠিক Email দিন (example@mail.com)';
  }

  if (!form.password) {
    errors.password = 'Password দিন';
  } else if (!isLogin) {
    if (form.password.length < 6) {
      errors.password = 'Password কমপক্ষে ৬ অক্ষর হতে হবে';
    }
  }

  if (!isLogin && form.confirmPassword !== undefined) {
    if (!form.confirmPassword) {
      errors.confirmPassword = 'Password নিশ্চিত করুন';
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Password মিলছে না';
    }
  }

  return errors;
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const setF = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    // Clear error on change
    if (errors[k]) setErrors((p) => ({ ...p, [k]: '' }));
    // Live confirm password check
    if (k === 'confirmPassword' || k === 'password') {
      setErrors((p) => ({ ...p, confirmPassword: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form, isLogin);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form.name.trim(), form.email.trim(), form.password);
      }
      toast.success(isLogin ? 'স্বাগতম! 🌙' : 'Account তৈরি হয়েছে! ✅');
      // Small delay to ensure user state is set before navigate
      setTimeout(() => navigate('/dashboard'), 100);
    } catch (err) {
      const msg = err.response?.data?.message || 'Error occurred';
      if (
        msg.toLowerCase().includes('email') ||
        msg.toLowerCase().includes('exist')
      ) {
        setErrors({ email: 'এই Email ইতিমধ্যে registered' });
      } else if (
        msg.toLowerCase().includes('password') ||
        msg.toLowerCase().includes('credential')
      ) {
        setErrors({ password: 'Email বা Password ভুল' });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (toLogin) => {
    setIsLogin(toLogin);
    setErrors({});
    setForm({ name: '', email: '', password: '', confirmPassword: '' });
    setShowPw(false);
    setShowConfirmPw(false);
  };

  const ErrorMsg = ({ field }) =>
    errors[field] ? (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 12,
          color: 'var(--danger)',
          marginTop: 6,
          fontWeight: 600,
          padding: '5px 8px',
          background: 'var(--danger-bg)',
          borderRadius: 6,
        }}
      >
        <span>⚠</span> {errors[field]}
      </div>
    ) : null;

  const PwStrength = ({ password }) => {
    if (!password || isLogin) return null;
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const isLong = password.length >= 8;
    const strength = [hasLetter, hasNumber, isLong].filter(Boolean).length;
    const labels = ['', 'দুর্বল', 'মোটামুটি', 'শক্তিশালী'];
    const colors = ['', 'var(--danger)', 'var(--warning)', 'var(--accent)'];
    if (password.length < 1) return null;
    return (
      <div style={{ marginTop: 6 }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 3 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background: i <= strength ? colors[strength] : 'var(--border)',
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: 10, color: colors[strength], fontWeight: 600 }}>
          {labels[strength]}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        padding: '20px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 22,
              background: 'linear-gradient(135deg,#0d4f2e,#1a7a4a)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 38,
              marginBottom: 14,
              boxShadow: '0 8px 24px rgba(26,122,74,0.35)',
            }}
          >
            <img
              src="/icon-96x96.png"
              alt="My Amal"
              style={{ width: 80, height: 80, borderRadius: 22 }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.textContent = '☪️';
              }}
            />
          </div>
          <h1
            style={{
              fontSize: 30,
              fontWeight: 900,
              color: 'var(--accent)',
              letterSpacing: '-0.5px',
            }}
          >
            My Amal
          </h1>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: 14,
              marginTop: 4,
              fontWeight: 500,
            }}
          >
            আমার আমল ট্র্যাকার
          </p>
        </div>

        <div className="card" style={{ boxShadow: 'var(--shadow-lg)' }}>
          <div className="card-body" style={{ padding: 28 }}>
            {/* Tab */}
            <div
              style={{
                display: 'flex',
                background: 'var(--bg-tertiary)',
                borderRadius: 10,
                padding: 4,
                marginBottom: 24,
              }}
            >
              {[
                ['Login', true],
                ['Register', false],
              ].map(([label, val]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => switchTab(val)}
                  style={{
                    flex: 1,
                    padding: '9px',
                    borderRadius: 7,
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 14,
                    fontFamily: 'Inter,sans-serif',
                    transition: 'all 0.2s',
                    background:
                      isLogin === val ? 'var(--bg-card)' : 'transparent',
                    color:
                      isLogin === val ? 'var(--accent)' : 'var(--text-muted)',
                    boxShadow: isLogin === val ? 'var(--shadow)' : 'none',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* Name — Register only */}
              {!isLogin && (
                <div className="form-group">
                  <label className="form-label">আপনার নাম</label>
                  <input
                    className={`form-control${errors.name ? ' error' : ''}`}
                    type="text"
                    placeholder="Your Name"
                    value={form.name}
                    onChange={(e) => setF('name', e.target.value)}
                    autoComplete="name"
                  />
                  <ErrorMsg field="name" />
                  {!errors.name && form.name.length > 0 && (
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--accent)',
                        marginTop: 5,
                      }}
                    >
                      ✓ নাম ঠিক আছে
                    </div>
                  )}
                </div>
              )}

              {/* Email */}
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  className={`form-control${errors.email ? ' error' : ''}`}
                  type="email"
                  placeholder="Your Email"
                  value={form.email}
                  onChange={(e) => setF('email', e.target.value)}
                  autoComplete={isLogin ? 'username' : 'email'}
                />
                <ErrorMsg field="email" />
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className={`form-control${errors.password ? ' error' : ''}`}
                    type={showPw ? 'text' : 'password'}
                    placeholder="Your Password"
                    value={form.password}
                    onChange={(e) => setF('password', e.target.value)}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
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
                <ErrorMsg field="password" />
                {!isLogin && !errors.password && (
                  <>
                    <PwStrength password={form.password} />
                    {form.password.length === 0 && (
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          marginTop: 5,
                        }}
                      >
                        কমপক্ষে ৬ অক্ষর হতে হবে
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Confirm Password — Register only */}
              {!isLogin && (
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label className="form-label">Password নিশ্চিত করুন</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className={`form-control${errors.confirmPassword ? ' error' : form.confirmPassword && form.password === form.confirmPassword ? ' success' : ''}`}
                      type={showConfirmPw ? 'text' : 'password'}
                      placeholder="Confirm Password"
                      value={form.confirmPassword}
                      onChange={(e) => setF('confirmPassword', e.target.value)}
                      autoComplete="new-password"
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
                  <ErrorMsg field="confirmPassword" />
                  {!errors.confirmPassword &&
                    form.confirmPassword &&
                    form.password === form.confirmPassword && (
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--accent)',
                          marginTop: 6,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        ✅ Password মিলেছে
                      </div>
                    )}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  marginTop: isLogin ? 8 : 0,
                }}
                disabled={loading}
              >
                {loading
                  ? '⏳ Loading...'
                  : isLogin
                    ? '🔐 Login'
                    : '✅ Account তৈরি করুন'}
              </button>
            </form>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {isLogin ? 'Account নেই? ' : 'Account আছে? '}
            <button
              onClick={() => switchTab(!isLogin)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              {isLogin ? 'Register করুন' : 'Login করুন'}
            </button>
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            Developed by Zahid Hasan • v0.1.0
          </p>
        </div>
      </div>

      <style>{`
        .form-control.error { border-color: var(--danger) !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important; }
        .form-control.success { border-color: var(--accent) !important; box-shadow: 0 0 0 3px rgba(26,122,74,0.1) !important; }
      `}</style>
    </div>
  );
}
