import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/common/Layout';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  formatDate,
  getTodayStr,
  useHijriDisplay, // ← real-time hook
  getBDWeekday,
  getTodayHijriDay,
} from '../utils/hijri';
import toast from 'react-hot-toast';

function getTodayAlerts() {
  const alerts = [];
  const weekday = getBDWeekday();
  const hijriDay = getTodayHijriDay();

  if (weekday === 0)
    alerts.push({
      type: 'monday_sunnah',
      label: 'Monday Sunnah',
      message: 'আগামীকাল সোমবার — সুন্নাহ রোজা',
    });
  if (weekday === 3)
    alerts.push({
      type: 'thursday_sunnah',
      label: 'Thursday Sunnah',
      message: 'আগামীকাল বৃহস্পতিবার — সুন্নাহ রোজা',
    });
  if (hijriDay === 12)
    alerts.push({
      type: 'ayyam_13',
      label: 'আইয়্যামুল বীয ১৩',
      message: 'আগামীকাল হিজরী ১৩ তারিখ — আইয়্যামুল বীয রোজা',
    });
  if (hijriDay === 13)
    alerts.push({
      type: 'ayyam_14',
      label: 'আইয়্যামুল বীয ১৪',
      message: 'আগামীকাল হিজরী ১৪ তারিখ — আইয়্যামুল বীয রোজা',
    });
  if (hijriDay === 14)
    alerts.push({
      type: 'ayyam_15',
      label: 'আইয়্যামুল বীয ১৫',
      message: 'আগামীকাল হিজরী ১৫ তারিখ — আইয়্যামুল বীয রোজা',
    });

  return alerts;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState([]); // in-memory: refresh এ reset

  const hijri = useHijriDisplay(); // ← real-time, Maghrib এ auto update
  const todayStr = getTodayStr();
  const todayFormatted = formatDate(todayStr);

  const todayAlerts = getTodayAlerts();
  const visibleAlerts = todayAlerts.filter((a) => !dismissed.includes(a.type));

  const dismissAlert = (type) => setDismissed((prev) => [...prev, type]);

  const loadData = useCallback(() => {
    setLoading(true);
    setStats(null);
    API.get('/amal/dashboard')
      .then((res) => setStats(res.data.data))
      .catch(() => toast.error('Data load failed'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading)
    return (
      <Layout title="Dashboard">
        <div style={{ textAlign: 'center', padding: 80 }}>
          <div style={{ fontSize: 48 }}>☪️</div>
          <div
            style={{
              color: 'var(--text-muted)',
              marginTop: 12,
              fontWeight: 600,
            }}
          >
            Loading...
          </div>
        </div>
      </Layout>
    );

  const salahList = [
    { key: 'fajr', label: 'ফজর', emoji: '🌅' },
    { key: 'dhuhr', label: 'যোহর', emoji: '☀️' },
    { key: 'asr', label: 'আসর', emoji: '🌤️' },
    { key: 'maghrib', label: 'মাগরিব', emoji: '🌇' },
    { key: 'isha', label: 'ইশা', emoji: '🌙' },
  ];

  return (
    <Layout title="Dashboard">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div>
            <h2
              style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px' }}
            >
              আস-সালামু আলাইকুম, {user?.name?.split(' ')[0]} 👋
            </h2>
            <p
              style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}
            >
              {todayFormatted} • {hijri}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {stats?.streak > 0 && (
              <span className="streak-badge">
                🔥 {stats.streak} Day Streak!
              </span>
            )}
            <button
              onClick={loadData}
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '7px 12px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Fasting Alerts */}
      {visibleAlerts.map((a) => (
        <div
          key={a.type}
          style={{
            position: 'relative',
            background: 'var(--accent-bg)',
            border: '1.5px solid var(--accent)',
            borderRadius: 12,
            padding: '12px 40px 12px 14px',
            marginBottom: 10,
          }}
        >
          <button
            onClick={() => dismissAlert(a.type)}
            style={{
              position: 'absolute',
              top: 8,
              right: 10,
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: 'var(--text-muted)',
              lineHeight: 1,
              padding: '2px 6px',
            }}
          >
            ×
          </button>
          <div
            style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 14 }}
          >
            🔔 আগামীকাল রোজা! — {a.label}
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              marginTop: 4,
            }}
          >
            {a.message} — আগামীকালের নিয়ত করুন ইনশাআল্লাহ 🤲
          </div>
        </div>
      ))}

      {/* Stats Grid */}
      <div className="stats-grid mb-3">
        {[
          { icon: '📅', value: stats?.totalDays || 0, label: 'মোট দিন' },
          {
            icon: '🔥',
            value: stats?.streak || 0,
            label: 'Streak',
            color: '#f59e0b',
          },
          {
            icon: '📈',
            value: `${stats?.avgProgress || 0}%`,
            label: 'গড় Score',
          },
          { icon: '🌙', value: stats?.totalFasting || 0, label: 'রোজা' },
          {
            icon: '📖',
            value: stats?.totalQuranPages || 0,
            label: 'কুরআন পৃষ্ঠা',
          },
          {
            icon: '💝',
            value: `৳${stats?.totalSadaqah || 0}`,
            label: 'সাদাকাহ',
          },
        ].map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon">{s.icon}</div>
            <div
              className="stat-value"
              style={{ color: s.color || 'var(--accent)' }}
            >
              {s.value}
            </div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2 mb-3">
        <div className="card">
          <div className="card-header">
            <span className="title">🕌 আজকের নামাজ</span>
            {stats?.todayAmal ? (
              <span className="badge badge-success">✓ সেভ</span>
            ) : (
              <span className="badge badge-warning">সেভ হয়নি</span>
            )}
          </div>
          <div className="card-body">
            <div className="salah-grid">
              {salahList.map((s) => {
                const done = stats?.todayAmal?.[s.key];
                return (
                  <div
                    key={s.key}
                    style={{
                      textAlign: 'center',
                      padding: '10px 4px',
                      borderRadius: 10,
                      background: done
                        ? 'var(--accent-bg)'
                        : 'var(--bg-tertiary)',
                      border: `2px solid ${done ? 'var(--accent)' : 'var(--border)'}`,
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontSize: 20 }}>{s.emoji}</div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: done ? 'var(--accent)' : 'var(--text-muted)',
                        marginTop: 3,
                      }}
                    >
                      {s.label}
                    </div>
                    <div style={{ fontSize: 16, marginTop: 2 }}>
                      {done ? '✅' : '⬜'}
                    </div>
                  </div>
                );
              })}
            </div>
            {!stats?.todayAmal && (
              <a
                href="/amal-post"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  marginTop: 14,
                  padding: 11,
                  background: 'var(--accent-grad)',
                  color: 'white',
                  borderRadius: 9,
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: 14,
                  boxShadow: '0 2px 8px rgba(26,122,74,0.3)',
                }}
              >
                ✏️ আজকের আমল পোস্ট করুন
              </a>
            )}
            {stats?.todayAmal && (
              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>
                    আজকের Score
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
                    {stats.todayAmal.progressScore}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${stats.todayAmal.progressScore}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="title">📊 নামাজের ধারাবাহিকতা</span>
          </div>
          <div className="card-body">
            {salahList.map((s) => {
              const pct = stats?.salahStats?.[s.key]?.pct || 0;
              const color =
                pct >= 80
                  ? 'var(--accent)'
                  : pct >= 50
                    ? 'var(--warning)'
                    : 'var(--danger)';
              return (
                <div key={s.key} style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>
                      {s.emoji} {s.label}
                    </span>
                    <span style={{ fontWeight: 700, color }}>{pct}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${color}, ${color}99)`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {stats?.bestDay && (
        <div className="card">
          <div className="card-header">
            <span className="title">🏆 সেরা দিন</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 44 }}>🌟</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17 }}>
                  {formatDate(stats.bestDay.date)}
                </div>
                <div
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: 13,
                    marginTop: 2,
                  }}
                >
                  Score:{' '}
                  <span
                    style={{
                      color: 'var(--accent)',
                      fontWeight: 800,
                      fontSize: 16,
                    }}
                  >
                    {stats.bestDay.progressScore}%
                  </span>
                </div>
                {stats.bestDay.notes && (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      marginTop: 6,
                      fontStyle: 'italic',
                      background: 'var(--bg-tertiary)',
                      padding: '6px 10px',
                      borderRadius: 7,
                      maxWidth: 300,
                    }}
                  >
                    "{stats.bestDay.notes.slice(0, 80)}
                    {stats.bestDay.notes.length > 80 ? '...' : ''}"
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
