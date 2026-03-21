import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/common/Layout';
import API from '../utils/api';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import { toHijriShort, formatDate } from '../utils/hijri';
import toast from 'react-hot-toast';

const MONTHS = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const MONTH_BN = [
  '',
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

const FASTING_LABELS = {
  fard: 'ফরজ',
  monday: 'সোমবার',
  thursday: 'বৃহস্পতি',
  ayyam_beed: 'আইয়্যামুল বীয',
  other: 'অন্যান্য',
  '': '',
};

// ── Delete Confirmation Modal ──
function DeleteModal({ target, onConfirm, onCancel, loading }) {
  if (!target) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal"
        style={{ maxWidth: 400 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="card-header"
          style={{
            background: 'var(--danger-bg)',
            borderBottom: '2px solid var(--danger)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              🗑️
            </div>
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 15,
                  color: 'var(--danger)',
                }}
              >
                Record মুছুন
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  marginTop: 2,
                }}
              >
                {formatDate(target.date)} তারিখের আমল
              </div>
            </div>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 22,
              color: 'var(--text-muted)',
            }}
          >
            ×
          </button>
        </div>
        <div className="card-body">
          <div
            style={{
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger)',
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 18,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: 'var(--danger)',
                fontSize: 13,
                marginBottom: 6,
              }}
            >
              ⚠️ এই কাজ undo করা যাবে না!
            </div>
            <ul
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                paddingLeft: 16,
                lineHeight: 2,
              }}
            >
              <li>
                <strong>{formatDate(target.date)}</strong> তারিখের সব আমল data
                মুছবে
              </li>
              <li>Score, নামাজ, রোজা, নোট সব হারাবে</li>
            </ul>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              background: 'var(--bg-tertiary)',
              borderRadius: 10,
              marginBottom: 20,
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ fontSize: 28 }}>📋</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {formatDate(target.date)}
              </div>
              <div
                style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2 }}
              >
                Score: {target.progressScore}% • এই record মুছবে
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => onConfirm(target)}
              disabled={loading}
              className="btn btn-danger"
              style={{
                flex: 1,
                justifyContent: 'center',
                padding: '11px',
                fontSize: 14,
              }}
            >
              {loading ? '⏳ Deleting...' : '🗑️ হ্যাঁ, Delete করুন'}
            </button>
            <button
              onClick={onCancel}
              className="btn btn-secondary"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              বাতিল
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Score Circle ──
const ScoreBadge = ({ score }) => {
  const color =
    score >= 70
      ? 'var(--accent)'
      : score >= 40
        ? 'var(--warning)'
        : 'var(--danger)';
  return (
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: '50%',
        background: `${color}18`,
        border: `2px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 800,
        color,
        flexShrink: 0,
      }}
    >
      {score}%
    </div>
  );
};

const tick = (v) =>
  v ? (
    <span style={{ color: 'var(--accent)', fontSize: 14 }}>✅</span>
  ) : (
    <span style={{ color: 'var(--border)', fontSize: 13 }}>❌</span>
  );

function groupByMonth(rows) {
  const map = {};
  rows.forEach((r) => {
    const ym = r.date.slice(0, 7);
    if (!map[ym]) map[ym] = [];
    map[ym].push(r);
  });
  return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
}

function sumRows(rows) {
  return {
    days: rows.length,
    fajr: rows.filter((r) => r.fajr).length,
    dhuhr: rows.filter((r) => r.dhuhr).length,
    asr: rows.filter((r) => r.asr).length,
    maghrib: rows.filter((r) => r.maghrib).length,
    isha: rows.filter((r) => r.isha).length,
    tahajjud: rows.filter((r) => r.tahajjud).length,
    morningDua: rows.filter((r) => r.morningDua).length,
    daytimeTawbah: rows.filter((r) => r.daytimeTawbah).length,
    eveningDua: rows.filter((r) => r.eveningDua).length,
    quranPages: rows.reduce((s, r) => s + (r.quranPages || 0), 0),
    fasting: rows.filter((r) => r.fasting).length,
    sadaqah: rows.filter((r) => r.sadaqah).length,
    sadaqahAmount: rows.reduce((s, r) => s + (r.sadaqahAmount || 0), 0),
    foodPlatesTotal: rows.reduce((s, r) => s + (r.foodPlates || 0), 0),
    sleepAvg: rows.filter((r) => r.sleepMinutes > 0).length
      ? Math.round(
          rows
            .filter((r) => r.sleepMinutes > 0)
            .reduce((s, r) => s + (r.sleepMinutes || 0), 0) /
            rows.filter((r) => r.sleepMinutes > 0).length,
        )
      : 0,
    avgScore: rows.length
      ? Math.round(
          rows.reduce((s, r) => s + (r.progressScore || 0), 0) / rows.length,
        )
      : 0,
  };
}

const SumRow = ({ s, label, labelColor, isGrand }) => {
  const scoreColor =
    s.avgScore >= 70
      ? 'var(--accent)'
      : s.avgScore >= 40
        ? 'var(--warning)'
        : 'var(--danger)';
  const pct = (n) => (s.days ? `(${Math.round((n / s.days) * 100)}%)` : '');
  const bg = isGrand ? 'var(--accent-bg)' : 'var(--bg-tertiary)';
  const fw = isGrand ? 800 : 700;
  const bt = `2px solid ${isGrand ? 'var(--accent)' : 'var(--border)'}`;
  const td = (content, extra = {}) => (
    <td
      style={{
        fontWeight: fw,
        borderTop: bt,
        textAlign: 'center',
        padding: '8px 4px',
        fontSize: 11,
        ...extra,
      }}
    >
      {content}
    </td>
  );
  return (
    <tr style={{ background: bg }}>
      <td
        style={{
          fontWeight: fw,
          fontSize: 11,
          color: labelColor || 'var(--text-primary)',
          borderTop: bt,
          padding: '8px 8px',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
        <br />
        <span
          style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 400 }}
        >
          {s.days} দিন
        </span>
      </td>
      {td(
        <>
          {s.fajr}
          <br />
          <span
            style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 400 }}
          >
            {pct(s.fajr)}
          </span>
        </>,
      )}
      {td(
        <>
          {s.dhuhr}
          <br />
          <span
            style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 400 }}
          >
            {pct(s.dhuhr)}
          </span>
        </>,
      )}
      {td(
        <>
          {s.asr}
          <br />
          <span
            style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 400 }}
          >
            {pct(s.asr)}
          </span>
        </>,
      )}
      {td(
        <>
          {s.maghrib}
          <br />
          <span
            style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 400 }}
          >
            {pct(s.maghrib)}
          </span>
        </>,
      )}
      {td(
        <>
          {s.isha}
          <br />
          <span
            style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 400 }}
          >
            {pct(s.isha)}
          </span>
        </>,
      )}
      {td(s.tahajjud, { color: 'var(--purple)' })}
      {td(s.morningDua, { color: 'var(--purple)' })}
      {td(s.daytimeTawbah, { color: 'var(--purple)' })}
      {td(s.eveningDua, { color: 'var(--purple)' })}
      {td(`${s.quranPages}p`, { color: 'var(--info)' })}
      {td(s.fasting)}
      {td(`৳${s.sadaqahAmount}`, { color: 'var(--accent)' })}
      {td(s.foodPlatesTotal > 0 ? `${s.foodPlatesTotal}p` : '—', {
        color: 'var(--info)',
      })}
      {td(s.sleepAvg > 0 ? `${(s.sleepAvg / 60).toFixed(1)}h` : '—')}
      {td(`${s.avgScore}%`, {
        color: scoreColor,
        fontSize: 13,
        fontWeight: 800,
      })}
      {td('')}
    </tr>
  );
};

const AmalCard = ({ row, onView, onDelete }) => (
  <div className="amal-card-mobile">
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
      }}
    >
      <div>
        <div style={{ fontWeight: 800, fontSize: 15 }}>
          {formatDate(row.date)}
        </div>
        <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 2 }}>
          🌙 {toHijriShort(row.date)}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <ScoreBadge score={row.progressScore} />
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onView(row)}
        >
          👁
        </button>
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(row)}>
          🗑
        </button>
      </div>
    </div>
    <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
      {[
        ['🌅', 'ফজর', row.fajr],
        ['☀️', 'যোহর', row.dhuhr],
        ['🌤️', 'আসর', row.asr],
        ['🌇', 'মাগরিব', row.maghrib],
        ['🌙', 'ইশা', row.isha],
      ].map(([em, label, val]) => (
        <div
          key={label}
          style={{
            fontSize: 10,
            padding: '3px 7px',
            borderRadius: 6,
            fontWeight: 600,
            background: val ? 'var(--accent-bg)' : 'var(--bg-tertiary)',
            color: val ? 'var(--accent)' : 'var(--text-muted)',
            border: `1px solid ${val ? 'var(--accent)' : 'var(--border)'}`,
          }}
        >
          {em} {label}
        </div>
      ))}
    </div>
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
      {row.fasting && (
        <span className="badge badge-info" style={{ fontSize: 10 }}>
          🌙 {FASTING_LABELS[row.fastingType] || 'রোজা'}
        </span>
      )}
      {row.quranPages > 0 && (
        <span className="badge badge-success" style={{ fontSize: 10 }}>
          📖 {row.quranPages}p
        </span>
      )}
      {row.sadaqah && (
        <span className="badge badge-purple" style={{ fontSize: 10 }}>
          💝 ৳{row.sadaqahAmount}
        </span>
      )}
      {row.sleepMinutes > 0 && (
        <span
          className="badge"
          style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            fontSize: 10,
          }}
        >
          😴 {(row.sleepMinutes / 60).toFixed(1)}h
        </span>
      )}
      {row.foodPlates > 0 && (
        <span className="badge badge-info" style={{ fontSize: 10 }}>
          🍽️ {row.foodPlates}p
        </span>
      )}
    </div>
    {row.notes && (
      <div
        style={{
          marginTop: 7,
          fontSize: 11,
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          lineHeight: 1.5,
          borderTop: '1px solid var(--border-light)',
          paddingTop: 6,
        }}
      >
        "{row.notes.slice(0, 80)}
        {row.notes.length > 80 ? '...' : ''}"
      </div>
    )}
  </div>
);

const MobileMonthCard = ({ ym, rows }) => {
  const [y, mn] = ym.split('-');
  const s = sumRows(rows);
  const scoreColor =
    s.avgScore >= 70
      ? 'var(--accent)'
      : s.avgScore >= 40
        ? 'var(--warning)'
        : 'var(--danger)';
  return (
    <div className="card mb-2" style={{ border: `1px solid var(--accent)` }}>
      <div className="card-header" style={{ background: 'var(--accent-bg)' }}>
        <div>
          <span
            style={{ fontWeight: 800, fontSize: 14, color: 'var(--accent)' }}
          >
            {MONTH_BN[parseInt(mn)]} {y}
          </span>
          <span
            style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}
          >
            {s.days} দিন
          </span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontWeight: 900, fontSize: 18, color: scoreColor }}>
            {s.avgScore}%
          </span>
          <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
            গড় score
          </div>
        </div>
      </div>
      <div className="card-body" style={{ padding: '10px 12px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 6,
          }}
        >
          {[
            ['🌅 ফজর', `${s.fajr}/${s.days}`, 'var(--warning)'],
            ['☀️ যোহর', `${s.dhuhr}/${s.days}`, 'var(--info)'],
            ['🌤️ আসর', `${s.asr}/${s.days}`, 'var(--accent)'],
            ['🌇 মাগরিব', `${s.maghrib}/${s.days}`, 'var(--warning)'],
            ['🌙 ইশা', `${s.isha}/${s.days}`, 'var(--purple)'],
            ['🌌 তাহাজ্জুদ', `${s.tahajjud}`, 'var(--purple)'],
            ['📖 কুরআন', `${s.quranPages}p`, 'var(--info)'],
            ['🌙 রোজা', `${s.fasting}`, 'var(--info)'],
            [
              '🍽️ খাবার',
              s.foodPlatesTotal > 0 ? `${s.foodPlatesTotal}p` : '—',
              'var(--info)',
            ],
            ['💝 সাদাকাহ', `৳${s.sadaqahAmount}`, 'var(--accent)'],
          ].map(([label, val, color]) => (
            <div
              key={label}
              style={{
                background: 'var(--bg-tertiary)',
                borderRadius: 7,
                padding: '7px 5px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  marginBottom: 2,
                }}
              >
                {label}
              </div>
              <div style={{ fontWeight: 800, fontSize: 12, color }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function AmalView() {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    search: '',
  });
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const LIMIT = parseInt(localStorage.getItem('amal_rows_per_page') || '31');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 1000 });
      if (filters.startDate && filters.endDate) {
        params.set('startDate', filters.startDate);
        params.set('endDate', filters.endDate);
      } else if (filters.month) {
        params.set('month', filters.month);
        params.set('year', filters.year);
      } else if (filters.year) {
        params.set('year', filters.year);
      }
      if (filters.search) params.set('search', filters.search);
      const res = await API.get(`/amal?${params}`);
      setAllData(res.data.data || []);
    } catch {
      toast.error('Load failed');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const setF = (k, v) => setFilters((p) => ({ ...p, [k]: v }));

  const handleDeleteConfirm = async (record) => {
    setDeleteLoading(true);
    try {
      await API.delete(`/amal/${record._id}`);
      toast.success('Deleted ✓');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExportAll = async (type) => {
    try {
      if (type === 'pdf') exportToPDF(allData);
      else exportToExcel(allData);
      toast.success('Export সম্পন্ন!');
    } catch {
      toast.error('Export failed');
    }
  };

  const grouped = groupByMonth(allData);
  const grandTotal = sumRows(allData);

  const filterLabel =
    filters.startDate && filters.endDate
      ? `${formatDate(filters.startDate)} — ${formatDate(filters.endDate)}`
      : filters.month
        ? `${MONTH_BN[parseInt(filters.month)]} ${filters.year}`
        : `সব মাস ${filters.year}`;

  return (
    <Layout title="Amal View">
      {/* Filters */}
      <div className="card mb-2">
        <div className="card-body" style={{ padding: 12 }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              alignItems: 'flex-end',
            }}
          >
            <div style={{ flex: '2 1 150px' }}>
              <label className="form-label">🔍 Search</label>
              <input
                className="form-control"
                placeholder="তারিখ বা নোট..."
                value={filters.search}
                onChange={(e) => setF('search', e.target.value)}
              />
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <label className="form-label">From</label>
              <input
                type="date"
                className="form-control"
                value={filters.startDate}
                onChange={(e) => setF('startDate', e.target.value)}
              />
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <label className="form-label">To</label>
              <input
                type="date"
                className="form-control"
                value={filters.endDate}
                onChange={(e) => setF('endDate', e.target.value)}
              />
            </div>
            <div style={{ flex: '1 1 100px' }}>
              <label className="form-label">মাস</label>
              <select
                className="form-control"
                value={filters.month}
                onChange={(e) => setF('month', e.target.value)}
              >
                <option value="">All Months</option>
                {MONTHS.slice(1).map((m, i) => (
                  <option key={i + 1} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: '1 1 70px' }}>
              <label className="form-label">বছর</label>
              <select
                className="form-control"
                value={filters.year}
                onChange={(e) => setF('year', e.target.value)}
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              style={{ flexShrink: 0 }}
              onClick={() =>
                setFilters({
                  startDate: '',
                  endDate: '',
                  month: new Date().getMonth() + 1,
                  year: new Date().getFullYear(),
                  search: '',
                })
              }
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      {/* Actions bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: 'var(--text-secondary)',
              fontSize: 13,
            }}
          >
            মোট{' '}
            <strong style={{ color: 'var(--accent)' }}>{allData.length}</strong>{' '}
            টি রেকর্ড
            <span
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                marginLeft: 8,
              }}
            >
              • {filterLabel}
            </span>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={load}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          >
            🔄 Refresh
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleExportAll('pdf')}
          >
            📄 PDF
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleExportAll('excel')}
          >
            📊 Excel
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="card desktop-table" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table
            style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}
          >
            <colgroup>
              <col style={{ width: 105 }} />
              <col style={{ width: 46 }} />
              <col style={{ width: 46 }} />
              <col style={{ width: 46 }} />
              <col style={{ width: 54 }} />
              <col style={{ width: 46 }} />
              <col style={{ width: 60 }} />
              <col style={{ width: 50 }} />
              <col style={{ width: 50 }} />
              <col style={{ width: 54 }} />
              <col style={{ width: 56 }} />
              <col style={{ width: 64 }} />
              <col style={{ width: 68 }} />
              <col style={{ width: 56 }} />
              <col style={{ width: 48 }} />
              <col style={{ width: 52 }} />
              <col style={{ width: 70 }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ fontSize: 11, padding: '9px 8px' }}>তারিখ</th>
                <th
                  style={{
                    fontSize: 11,
                    padding: '9px 4px',
                    textAlign: 'center',
                  }}
                >
                  🌅
                  <br />
                  ফজর
                </th>
                <th
                  style={{
                    fontSize: 11,
                    padding: '9px 4px',
                    textAlign: 'center',
                  }}
                >
                  ☀️
                  <br />
                  যোহর
                </th>
                <th
                  style={{
                    fontSize: 11,
                    padding: '9px 4px',
                    textAlign: 'center',
                  }}
                >
                  🌤️
                  <br />
                  আসর
                </th>
                <th
                  style={{
                    fontSize: 11,
                    padding: '9px 4px',
                    textAlign: 'center',
                  }}
                >
                  🌇
                  <br />
                  মাগরিব
                </th>
                <th
                  style={{
                    fontSize: 11,
                    padding: '9px 4px',
                    textAlign: 'center',
                  }}
                >
                  🌙
                  <br />
                  ইশা
                </th>
                <th
                  style={{
                    fontSize: 11,
                    padding: '9px 4px',
                    textAlign: 'center',
                  }}
                >
                  🌌
                  <br />
                  তাহাজ্জুদ
                </th>
                <th
                  style={{
                    fontSize: 11,
                    padding: '9px 4px',
                    textAlign: 'center',
                  }}
                >
                  🌄
                  <br />
                  সকাল
                </th>
                <th
                  style={{
                    fontSize: 11,
                    padding: '9px 4px',
                    textAlign: 'center',
                  }}
                >
                  🤲
                  <br />
                  তওবা
                </th>
                <th
                  style={{
                    fontSize: 11,
                    padding: '9px 4px',
                    textAlign: 'center',
                  }}
                >
                  🌆
                  <br />
                  সন্ধ্যা
                </th>
                <th
                  style={{
                    fontSize: 11,
                    padding: '9px 4px',
                    textAlign: 'center',
                  }}
                >
                  📖
                  <br />
                  কুরআন
                </th>
                <th
                  style={{
                    fontSize: 11,
                    padding: '9px 4px',
                    textAlign: 'center',
                  }}
                >
                  🌙
                  <br />
                  রোজা
                </th>
                <th
                  style={{
                    fontSize: 11,
                    padding: '9px 4px',
                    textAlign: 'center',
                  }}
                >
                  💝
                  <br />
                  সাদাকাহ
                </th>
                <th
                  style={{
                    fontSize: 11,
                    padding: '9px 4px',
                    textAlign: 'center',
                  }}
                >
                  🍽️
                  <br />
                  প্লেট
                </th>
                <th
                  style={{
                    fontSize: 11,
                    padding: '9px 4px',
                    textAlign: 'center',
                  }}
                >
                  😴
                  <br />
                  ঘুম
                </th>
                <th
                  style={{
                    fontSize: 11,
                    padding: '9px 4px',
                    textAlign: 'center',
                  }}
                >
                  Score
                </th>
                <th
                  style={{
                    fontSize: 11,
                    padding: '9px 6px',
                    textAlign: 'center',
                  }}
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={17}
                    style={{
                      textAlign: 'center',
                      padding: 50,
                      color: 'var(--text-muted)',
                    }}
                  >
                    ⏳ Loading...
                  </td>
                </tr>
              ) : allData.length === 0 ? (
                <tr>
                  <td colSpan={17} style={{ textAlign: 'center', padding: 50 }}>
                    <div style={{ fontSize: 36 }}>📭</div>
                    <div style={{ color: 'var(--text-muted)', marginTop: 8 }}>
                      কোনো রেকর্ড নেই
                    </div>
                  </td>
                </tr>
              ) : (
                allData.map((row) => (
                  <tr key={row._id}>
                    <td style={{ padding: '9px 8px' }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 12,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatDate(row.date)}
                      </div>
                      <div
                        style={{
                          fontSize: 9,
                          color: 'var(--accent)',
                          marginTop: 1,
                        }}
                      >
                        🌙 {toHijriShort(row.date)}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '9px 4px' }}>
                      {tick(row.fajr)}
                    </td>
                    <td style={{ textAlign: 'center', padding: '9px 4px' }}>
                      {tick(row.dhuhr)}
                    </td>
                    <td style={{ textAlign: 'center', padding: '9px 4px' }}>
                      {tick(row.asr)}
                    </td>
                    <td style={{ textAlign: 'center', padding: '9px 4px' }}>
                      {tick(row.maghrib)}
                    </td>
                    <td style={{ textAlign: 'center', padding: '9px 4px' }}>
                      {tick(row.isha)}
                    </td>
                    <td style={{ textAlign: 'center', padding: '9px 4px' }}>
                      {tick(row.tahajjud)}
                    </td>
                    <td style={{ textAlign: 'center', padding: '9px 4px' }}>
                      {tick(row.morningDua)}
                    </td>
                    <td style={{ textAlign: 'center', padding: '9px 4px' }}>
                      {tick(row.daytimeTawbah)}
                    </td>
                    <td style={{ textAlign: 'center', padding: '9px 4px' }}>
                      {tick(row.eveningDua)}
                    </td>
                    <td
                      style={{
                        textAlign: 'center',
                        padding: '9px 4px',
                        fontWeight: 700,
                        color: 'var(--info)',
                        fontSize: 12,
                      }}
                    >
                      {row.quranPages || 0}
                    </td>
                    <td style={{ textAlign: 'center', padding: '9px 4px' }}>
                      {row.fasting ? (
                        <span
                          className="badge badge-info"
                          style={{ fontSize: 9, whiteSpace: 'nowrap' }}
                        >
                          {FASTING_LABELS[row.fastingType] || '✓'}
                        </span>
                      ) : (
                        tick(false)
                      )}
                    </td>
                    <td style={{ textAlign: 'center', padding: '9px 4px' }}>
                      {row.sadaqah ? (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: 'var(--accent)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          ৳{row.sadaqahAmount}
                        </span>
                      ) : (
                        tick(false)
                      )}
                    </td>
                    <td
                      style={{
                        textAlign: 'center',
                        padding: '9px 4px',
                        fontSize: 11,
                        fontWeight: row.foodPlates > 0 ? 700 : 400,
                        color:
                          row.foodPlates > 0 ? 'var(--info)' : 'var(--border)',
                      }}
                    >
                      {row.foodPlates > 0 ? `${row.foodPlates}p` : '—'}
                    </td>
                    <td
                      style={{
                        textAlign: 'center',
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '9px 4px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {row.sleepMinutes
                        ? `${(row.sleepMinutes / 60).toFixed(1)}h`
                        : '—'}
                    </td>
                    <td style={{ textAlign: 'center', padding: '9px 4px' }}>
                      <ScoreBadge score={row.progressScore} />
                    </td>
                    <td style={{ padding: '9px 6px' }}>
                      <div
                        style={{
                          display: 'flex',
                          gap: 3,
                          justifyContent: 'center',
                        }}
                      >
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 6px' }}
                          onClick={() => setSelected(row)}
                        >
                          👁
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ padding: '4px 6px' }}
                          onClick={() => setDeleteTarget(row)}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {allData.length > 0 && (
              <tfoot>
                <SumRow
                  s={grandTotal}
                  label="🏆 সর্বমোট"
                  labelColor="var(--accent)"
                  isGrand={true}
                />
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="mobile-cards">
        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: 50,
              color: 'var(--text-muted)',
            }}
          >
            ⏳ Loading...
          </div>
        ) : allData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 50 }}>
            <div style={{ fontSize: 40 }}>📭</div>
            <div style={{ color: 'var(--text-muted)', marginTop: 8 }}>
              কোনো রেকর্ড নেই
            </div>
          </div>
        ) : (
          <>
            {grouped.map(([ym, rows]) => (
              <React.Fragment key={ym}>
                <MobileMonthCard ym={ym} rows={rows} />
                {rows.map((row) => (
                  <AmalCard
                    key={row._id}
                    row={row}
                    onView={setSelected}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </React.Fragment>
            ))}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>
                  📋 {formatDate(selected.date)}
                </div>
                <div
                  style={{ fontSize: 11, color: 'var(--accent)', marginTop: 2 }}
                >
                  🌙 {toHijriShort(selected.date)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <ScoreBadge score={selected.progressScore} />
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 22,
                    color: 'var(--text-muted)',
                  }}
                >
                  ×
                </button>
              </div>
            </div>
            <div className="card-body">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 6,
                  marginBottom: 12,
                }}
              >
                {[
                  ['🌅 ফজর', selected.fajr],
                  ['☀️ যোহর', selected.dhuhr],
                  ['🌤️ আসর', selected.asr],
                  ['🌇 মাগরিব', selected.maghrib],
                  ['🌙 ইশা', selected.isha],
                  ['🌌 তাহাজ্জুদ', selected.tahajjud],
                  ['🌄 সকালের দোয়া', selected.morningDua],
                  ['🤲 তওবা', selected.daytimeTawbah],
                  ['🌆 সন্ধ্যার দোয়া', selected.eveningDua],
                  ['🌙 রোজা', selected.fasting],
                ].map(([label, val]) => (
                  <div
                    key={label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: 7,
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 500 }}>
                      {label}
                    </span>
                    <span>{val ? '✅' : '❌'}</span>
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3,1fr)',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                {[
                  ['📖', selected.quranPages || 0, 'কুরআন পৃষ্ঠা'],
                  [
                    '😴',
                    selected.sleepMinutes
                      ? (selected.sleepMinutes / 60).toFixed(1) + 'h'
                      : '—',
                    'ঘুম',
                  ],
                  [
                    '💝',
                    selected.sadaqah ? `৳${selected.sadaqahAmount}` : '—',
                    'সাদাকাহ',
                  ],
                ].map(([em, v, l]) => (
                  <div
                    key={l}
                    style={{
                      textAlign: 'center',
                      padding: '10px 6px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontSize: 22 }}>{em}</div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: 'var(--accent)',
                        marginTop: 4,
                      }}
                    >
                      {v}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--text-muted)',
                        marginTop: 2,
                      }}
                    >
                      {l}
                    </div>
                  </div>
                ))}
              </div>
              {selected.fastingType && (
                <div style={{ marginBottom: 8 }}>
                  <span className="badge badge-info">
                    🌙{' '}
                    {FASTING_LABELS[selected.fastingType] ||
                      selected.fastingType}
                  </span>
                </div>
              )}
              {selected.foodPlates > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <span className="badge badge-info">
                    🍽️ {selected.foodPlates} প্লেট
                  </span>
                </div>
              )}
              {selected.notes && (
                <div
                  style={{
                    padding: '10px 12px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 8,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      marginBottom: 5,
                    }}
                  >
                    📝 নোট
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {selected.notes}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => exportToPDF([selected])}
                >
                  📄 PDF
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => exportToExcel([selected])}
                >
                  📊 Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <DeleteModal
        target={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </Layout>
  );
}
