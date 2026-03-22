import React, { useState, useRef, useEffect } from 'react';
import Layout from '../components/common/Layout';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { exportToJSON } from '../utils/exportUtils';
import { formatDate } from '../utils/hijri';
import toast from 'react-hot-toast';

const ROWS_OPTIONS = [10, 31, 62, 100];

// ── Simple Confirm Modal ──
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
          {/* Warning */}
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
          {/* Record info */}
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
          {/* Buttons */}
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

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [pw, setPw] = useState({ current: '', new: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [amalList, setAmalList] = useState([]);
  const [loadingAmals, setLoadingAmals] = useState(true);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const fileRef = useRef();

  const [rowsPerPage, setRowsPerPage] = useState(() =>
    parseInt(localStorage.getItem('amal_rows_per_page') || '31'),
  );

  const handleRowsChange = (val) => {
    setRowsPerPage(val);
    localStorage.setItem('amal_rows_per_page', val);
    toast.success(`✅ প্রতি পাতায় ${val} টি row দেখাবে`);
  };

  useEffect(() => {
    API.get('/amal?limit=500')
      .then((res) => setAmalList(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoadingAmals(false));
  }, []);

  const handlePwChange = async (e) => {
    e.preventDefault();
    if (pw.new !== pw.confirm) return toast.error('নতুন পাসওয়ার্ড মিলছে না');
    if (pw.new.length < 6) return toast.error('কমপক্ষে ৬ অক্ষর দিন');
    setPwLoading(true);
    try {
      await API.put('/auth/change-password', {
        currentPassword: pw.current,
        newPassword: pw.new,
      });
      toast.success('✅ পাসওয়ার্ড পরিবর্তন হয়েছে!');
      setPw({ current: '', new: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteConfirm = async (record) => {
    setDeleteLoading(true);
    try {
      await API.delete(`/amal/${record._id}`);
      setAmalList((prev) => prev.filter((a) => a._id !== record._id));
      toast.success('✅ Record মুছে দেওয়া হয়েছে');
      setDeleteModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExportJSON = async () => {
    try {
      const res = await API.get('/amal/export');
      exportToJSON(res.data.data);
      toast.success('📦 JSON Export হয়েছে!');
    } catch {
      toast.error('Export failed');
    }
  };

  const handleImportJSON = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        const data = json.data || json;
        const res = await API.post('/amal/import', { data });
        toast.success(`✅ ${res.data.message}`);
        const r = await API.get('/amal?limit=500');
        setAmalList(r.data.data || []);
      } catch {
        toast.error('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <Layout title="Settings">
      {/* Display Settings */}
      <div className="card mb-3">
        <div className="card-header">
          <span className="title">🖥️ Display Settings</span>
        </div>
        <div className="card-body">
          <label className="form-label">
            Amal View — প্রতি পাতায় কত row দেখাবে?
          </label>
          <div
            style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}
          >
            {ROWS_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleRowsChange(opt)}
                style={{
                  padding: '10px 22px',
                  borderRadius: 9,
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 14,
                  fontFamily: 'Inter,sans-serif',
                  transition: 'all 0.2s',
                  background:
                    rowsPerPage === opt
                      ? 'var(--accent-grad)'
                      : 'var(--bg-tertiary)',
                  color:
                    rowsPerPage === opt ? 'white' : 'var(--text-secondary)',
                  boxShadow:
                    rowsPerPage === opt
                      ? '0 2px 8px rgba(26,122,74,0.3)'
                      : 'none',
                  border: `2px solid ${rowsPerPage === opt ? 'transparent' : 'var(--border)'}`,
                }}
              >
                {opt}
                {rowsPerPage === opt && (
                  <span style={{ fontSize: 10, marginLeft: 6 }}>✓</span>
                )}
              </button>
            ))}
          </div>
          <p
            style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}
          >
            বর্তমানে:{' '}
            <strong style={{ color: 'var(--accent)' }}>{rowsPerPage}</strong> টি
            row
          </p>
        </div>
      </div>

      {/* Theme */}
      <div className="card mb-3">
        <div className="card-header">
          <span className="title">🎨 থিম পরিবর্তন</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              ['light', '☀️', 'Light Mode'],
              ['dark', '🌙', 'Dark Mode'],
            ].map(([t, em, label]) => (
              <div
                key={t}
                onClick={() => theme !== t && toggleTheme()}
                style={{
                  flex: 1,
                  padding: '18px 12px',
                  borderRadius: 12,
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: `2px solid ${theme === t ? 'var(--accent)' : 'var(--border)'}`,
                  background:
                    theme === t ? 'var(--accent-bg)' : 'var(--bg-tertiary)',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: 32 }}>{em}</div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    marginTop: 8,
                    color:
                      theme === t ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                >
                  {label}
                </div>
                {theme === t && (
                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--accent)',
                      marginTop: 4,
                      fontWeight: 800,
                    }}
                  >
                    ● Active
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Password */}
      <div className="card mb-3">
        <div className="card-header">
          <span className="title">🔐 পাসওয়ার্ড পরিবর্তন</span>
        </div>
        <div className="card-body">
          <form onSubmit={handlePwChange}>
            <div className="form-group">
              <label className="form-label">বর্তমান পাসওয়ার্ড</label>
              <input
                type="password"
                className="form-control"
                value={pw.current}
                onChange={(e) => setPw({ ...pw, current: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)
              </label>
              <input
                type="password"
                className="form-control"
                value={pw.new}
                onChange={(e) => setPw({ ...pw, new: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">নতুন পাসওয়ার্ড নিশ্চিত করুন</label>
              <input
                type="password"
                className="form-control"
                value={pw.confirm}
                onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={pwLoading}
            >
              {pwLoading ? '⏳ পরিবর্তন হচ্ছে...' : '🔐 পরিবর্তন করুন'}
            </button>
          </form>
        </div>
      </div>

      {/* Delete Amal Records */}
      <div className="card mb-3">
        <div className="card-header">
          <span className="title">🗑️ আমল Record মুছুন</span>
          <span className="badge badge-info">{amalList.length} records</span>
        </div>
        <div className="card-body" style={{ padding: '12px 14px' }}>
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              marginBottom: 12,
              lineHeight: 1.5,
            }}
          >
            📌 নির্দিষ্ট তারিখের record মুছতে পারবেন। Account মুছতে Admin এর
            সাথে যোগাযোগ করুন।
          </p>
          {loadingAmals ? (
            <div
              style={{
                textAlign: 'center',
                padding: 20,
                color: 'var(--text-muted)',
              }}
            >
              ⏳ Loading...
            </div>
          ) : amalList.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 20,
                color: 'var(--text-muted)',
              }}
            >
              কোনো record নেই
            </div>
          ) : (
            <div
              style={{
                maxHeight: 320,
                overflowY: 'auto',
                display: 'grid',
                gap: 6,
              }}
            >
              {amalList.map((a) => (
                <div
                  key={a._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 9,
                    border: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      {formatDate(a.date)}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                      <span
                        style={{
                          fontSize: 10,
                          color: 'var(--accent)',
                          fontWeight: 700,
                        }}
                      >
                        Score: {a.progressScore}%
                      </span>
                      {a.fasting && (
                        <span
                          className="badge badge-info"
                          style={{ fontSize: 9 }}
                        >
                          🌙 রোজা
                        </span>
                      )}
                      {a.quranPages > 0 && (
                        <span
                          className="badge badge-success"
                          style={{ fontSize: 9 }}
                        >
                          📖 {a.quranPages}p
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => setDeleteModal(a)}
                  >
                    🗑 Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Import / Export */}
      <div className="card mb-3">
        <div className="card-header">
          <span className="title">💾 Data Backup & Restore</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button className="btn btn-secondary" onClick={handleExportJSON}>
              📦 JSON Export (Backup)
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => fileRef.current?.click()}
            >
              📥 JSON Import (Restore)
            </button>
            <input
              type="file"
              accept=".json"
              ref={fileRef}
              style={{ display: 'none' }}
              onChange={handleImportJSON}
            />
          </div>
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              marginTop: 10,
              lineHeight: 1.6,
            }}
          >
            ⚠️ Import এ duplicate date skip হবে, শুধু নতুন data যোগ হবে।
          </p>
        </div>
      </div>

      {/* App Info */}
      <div className="card">
        <div className="card-header">
          <span className="title">ℹ️ App Information</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
            {[
              ['App Name', 'My Amal — আমার আমল ট্র্যাকার'],
              ['Version', 'v0.1.0'],
              ['Developer', 'Zahid Hasan'],
              ['Contact', '+880 1745-940065'],
              ['Stack', 'MERN + MVC'],
              ['Account', `${user?.name} (${user?.role})`],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 8,
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {k}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    textAlign: 'right',
                  }}
                >
                  {v}
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              textAlign: 'center',
              padding: '14px 16px',
              background: 'var(--accent-bg)',
              borderRadius: 10,
              border: '1px solid var(--accent)',
            }}
          >
            <div
              style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 800 }}
            >
              💚 Developed by Zahid Hasan • +880 1745-940065
            </div>
            <div
              style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}
            >
              My Amal v0.1.0 • Made with ❤️ for the Ummah
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteModal
        target={deleteModal}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal(null)}
        loading={deleteLoading}
      />
    </Layout>
  );
}
