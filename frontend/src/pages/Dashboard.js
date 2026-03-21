import React, { useEffect, useState } from 'react';
import Layout from '../components/common/Layout';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  formatDate,
  getTodayStr,
  getCurrentHijriDisplay,
  isAyyamBeed,
  isSunnahFastingDay,
} from '../utils/hijri';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [fastingAlerts, setFastingAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dismissed_fasting') || '[]');
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const today = getTodayStr();

  useEffect(() => {
    Promise.all([
      API.get('/amal/dashboard'),
      API.get('/reminder/fasting-upcoming'),
    ])
      .then(([dashRes, fastRes]) => {
        setStats(dashRes.data.data);
        // Only show alerts for today + 1 day ahead (the "1 day before" warning)
        const all = fastRes.data.data || [];
        const alertWorthy = all.filter(
          (f) => f.daysUntil >= 0 && f.daysUntil <= 1,
        );
        setFastingAlerts(alertWorthy);
      })
      .catch(() => toast.error('Data load failed'))
      .finally(() => setLoading(false));
  }, []);

  const dismissAlert = (key) => {
    const updated = [...dismissedAlerts, key];
    setDismissedAlerts(updated);
    localStorage.setItem('dismissed_fasting', JSON.stringify(updated));
  };

  const visibleAlerts = fastingAlerts.filter(
    (a) => !dismissedAlerts.includes(`${a.date}_${a.type}`),
  );

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

  const todayIsAyyam = isAyyamBeed(today);
  const todayIsSunnah = isSunnahFastingDay(today);
  const hijri = getCurrentHijriDisplay();
  const todayFormatted = formatDate(today);

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
              onClick={() => {
                setLoading(true);
                setStats(null);
                setFastingAlerts([]);
                Promise.all([
                  API.get('/amal/dashboard'),
                  API.get('/reminder/fasting-upcoming'),
                ])
                  .then(([d, f]) => {
                    setStats(d.data.data);
                    setFastingAlerts(
                      (f.data.data || []).filter(
                        (x) => x.daysUntil >= 0 && x.daysUntil <= 1,
                      ),
                    );
                  })
                  .catch(() => toast.error('Refresh failed'))
                  .finally(() => setLoading(false));
              }}
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

      {/* Fasting notification alerts - shown 1 day before */}
      {visibleAlerts.map((f) => (
        <div
          key={`${f.date}_${f.type}`}
          className="fasting-alert mb-2"
          style={{ position: 'relative' }}
        >
          <button
            className="alert-close"
            onClick={() => dismissAlert(`${f.date}_${f.type}`)}
          >
            ×
          </button>
          <div
            style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 14 }}
          >
            {f.daysUntil === 0 ? '📌 আজ রোজার দিন!' : '🔔 আগামীকাল রোজা!'} —{' '}
            {f.type}
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              marginTop: 4,
            }}
          >
            📅 {formatDate(f.date)} —{' '}
            {f.daysUntil === 0
              ? 'আজ রোজা রাখুন ইনশাআল্লাহ 🤲'
              : 'আগামীকালের রোজার নিয়ত করুন ইনশাআল্লাহ 🤲'}
          </div>
        </div>
      ))}

      {/* Today special alert */}
      {(todayIsAyyam || todayIsSunnah) &&
        !visibleAlerts.find((a) => a.daysUntil === 0) && (
          <div className="fasting-alert mb-2">
            <div
              style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 14 }}
            >
              {todayIsAyyam
                ? '🌙 আজ আইয়্যামুল বীযের রোজা (১৩/১৪/১৫ হিজরী)!'
                : '✨ আজ সুন্নাহ রোজার দিন (সোম/বৃহস্পতি)!'}
            </div>
            <div
              style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}
            >
              রোজা রাখুন ইনশাআল্লাহ 🤲
            </div>
          </div>
        )}

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
        {/* Today Salah */}
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

        {/* Salah Consistency */}
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

      {/* Best Day */}
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
