import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/common/Layout';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/hijri';
import toast from 'react-hot-toast';

// ── Delete Confirmation Modal ──
function DeleteModal({ target, onConfirm, onCancel, loading }) {
  const [typed, setTyped] = useState('');
  const inputRef = useRef();

  useEffect(() => {
    setTyped('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [target]);

  if (!target) return null;

  const isMyData = target.type === 'mydata';
  const isUser = target.type === 'user';
  const confirmed = typed.trim().toUpperCase() === 'DELETE';

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal"
        style={{ maxWidth: 440 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
                {isMyData
                  ? 'নিজের সব Data মুছুন'
                  : `"${target.user?.name}" Delete করুন`}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  marginTop: 2,
                }}
              >
                {isMyData
                  ? 'Account থাকবে, শুধু Amal data যাবে'
                  : 'User + সব Amal data চিরতরে মুছবে'}
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
          {/* Warning box */}
          <div
            style={{
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger)',
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 20,
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
            {isMyData ? (
              <ul
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  paddingLeft: 16,
                  lineHeight: 2,
                }}
              >
                <li>আপনার সব Amal record মুছে যাবে</li>
                <li>Analytics, dashboard data সব হারাবে</li>
                <li>আপনার Account ও Login থাকবে</li>
              </ul>
            ) : (
              <ul
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  paddingLeft: 16,
                  lineHeight: 2,
                }}
              >
                <li>
                  <strong>{target.user?.name}</strong> এর account মুছে যাবে
                </li>
                <li>তাদের সব Amal record মুছে যাবে</li>
                <li>তারা আর login করতে পারবে না</li>
              </ul>
            )}
          </div>

          {/* User info card */}
          {isUser && target.user && (
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
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'var(--accent-grad)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 900,
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                {target.user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {target.user.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {target.user.email}
                </div>
                <div
                  style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2 }}
                >
                  {target.user.amalCount || 0} টি Amal record মুছবে
                </div>
              </div>
            </div>
          )}

          {/* Type DELETE */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: 8,
              }}
            >
              নিশ্চিত করতে নিচের বক্সে{' '}
              <span
                style={{
                  background: 'var(--danger)',
                  color: 'white',
                  padding: '1px 7px',
                  borderRadius: 4,
                  fontFamily: 'monospace',
                  fontWeight: 800,
                }}
              >
                DELETE
              </span>{' '}
              টাইপ করুন:
            </label>
            <input
              ref={inputRef}
              type="text"
              className="form-control"
              placeholder="DELETE"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              style={{
                fontFamily: 'monospace',
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: 2,
                borderColor: confirmed ? 'var(--danger)' : 'var(--border)',
                textTransform: 'uppercase',
                boxShadow: confirmed
                  ? '0 0 0 3px rgba(239,68,68,0.15)'
                  : 'none',
              }}
            />
            {typed.length > 0 && !confirmed && (
              <div
                style={{ fontSize: 11, color: 'var(--warning)', marginTop: 5 }}
              >
                ⚠️ "DELETE" লিখুন (সব capital letter)
              </div>
            )}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => confirmed && onConfirm(target)}
              disabled={!confirmed || loading}
              style={{
                flex: 1,
                padding: '11px 16px',
                borderRadius: 9,
                border: 'none',
                cursor: confirmed && !loading ? 'pointer' : 'not-allowed',
                fontWeight: 700,
                fontSize: 14,
                fontFamily: 'Inter, sans-serif',
                background: confirmed ? 'var(--danger)' : 'var(--bg-tertiary)',
                color: confirmed ? 'white' : 'var(--text-muted)',
                transition: 'all 0.2s',
                boxShadow: confirmed ? '0 2px 8px rgba(239,68,68,0.3)' : 'none',
              }}
            >
              {loading
                ? '⏳ Deleting...'
                : confirmed
                  ? '🗑️ হ্যাঁ, Delete করুন'
                  : '🔒 DELETE টাইপ করুন'}
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

// ── Main Admin Page ──
export default function Admin() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(null); // { type: 'user'|'mydata', user: {...} }
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [banModal, setBanModal] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [userDataModal, setUserDataModal] = useState(null);
  const [userData, setUserData] = useState(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [uRes, sRes] = await Promise.all([
        API.get('/admin/users'),
        API.get('/admin/stats'),
      ]);
      setUsers(uRes.data.data);
      setStats(sRes.data.data);
    } catch {
      toast.error('Load failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleBan = async () => {
    try {
      await API.put(`/admin/users/${banModal._id}/ban`, { reason: banReason });
      toast.success('User banned ✓');
      setBanModal(null);
      setBanReason('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ban failed');
    }
  };

  const handleUnban = async (id) => {
    try {
      await API.put(`/admin/users/${id}/unban`);
      toast.success('Unbanned ✓');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unban failed');
    }
  };

  const handleDeleteConfirm = async (target) => {
    setDeleteLoading(true);
    try {
      if (target.type === 'mydata') {
        const res = await API.delete('/admin/my-data');
        toast.success(`✅ ${res.data.message}`);
      } else {
        const res = await API.delete(`/admin/users/${target.user._id}`);
        toast.success(`✅ ${target.user.name} deleted`);
      }
      setDeleteModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const viewUserData = async (u) => {
    setUserDataModal(u);
    setUserData(null);
    try {
      const res = await API.get(`/admin/users/${u._id}`);
      setUserData(res.data.data);
    } catch {
      toast.error('Error loading data');
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const isMe = (u) => u._id === currentUser?.id || u._id === currentUser?._id;

  return (
    <Layout title="Admin Panel">
      {/* Stats */}
      {stats && (
        <div className="stats-grid mb-3">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">মোট Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-value" style={{ color: 'var(--accent)' }}>
              {stats.activeUsers}
            </div>
            <div className="stat-label">Active</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🚫</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>
              {stats.bannedUsers}
            </div>
            <div className="stat-label">Banned</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-value">{stats.totalAmals}</div>
            <div className="stat-label">Amal Records</div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card">
        <div className="card-header">
          <span className="title">👥 সকল Users</span>
          <div style={{ width: 200 }}>
            <input
              className="form-control"
              style={{ padding: '6px 10px', fontSize: 12 }}
              placeholder="Search user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="desktop-table">
          <div className="table-wrap">
            <table style={{ minWidth: 780 }}>
              <thead>
                <tr>
                  <th>নাম</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Amal</th>
                  <th>Last Login</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        textAlign: 'center',
                        padding: 40,
                        color: 'var(--text-muted)',
                      }}
                    >
                      ⏳ Loading...
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 7,
                              background: 'var(--accent-grad)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 800,
                              fontSize: 12,
                              flexShrink: 0,
                            }}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>
                              {u.name}
                            </div>
                            {isMe(u) && (
                              <div
                                style={{
                                  fontSize: 9,
                                  color: 'var(--accent)',
                                  fontWeight: 700,
                                }}
                              >
                                👑 YOU
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {u.email}
                      </td>
                      <td>
                        <span
                          className={`badge ${u.role === 'admin' ? 'badge-warning' : 'badge-info'}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}`}
                        >
                          {u.status}
                        </span>
                        {u.status === 'banned' && u.bannedReason && (
                          <div
                            style={{
                              fontSize: 9,
                              color: 'var(--danger)',
                              marginTop: 2,
                            }}
                          >
                            {u.bannedReason.slice(0, 24)}...
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--accent)' }}>
                        {u.amalCount}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {u.lastLogin
                          ? new Date(u.lastLogin).toLocaleString('en-BD', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Never'}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {formatDate(u.createdAt?.split('T')[0])}
                      </td>
                      <td>
                        <div
                          style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}
                        >
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => viewUserData(u)}
                            title="Data দেখুন"
                          >
                            👁
                          </button>
                          {!isMe(u) && (
                            <>
                              {u.status === 'active' ? (
                                <button
                                  className="btn btn-warning btn-sm"
                                  onClick={() => setBanModal(u)}
                                  title="Ban করুন"
                                >
                                  🚫
                                </button>
                              ) : (
                                <button
                                  className="btn btn-info btn-sm"
                                  onClick={() => handleUnban(u._id)}
                                  title="Unban করুন"
                                >
                                  ✅
                                </button>
                              )}
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() =>
                                  setDeleteModal({ type: 'user', user: u })
                                }
                                title="Delete করুন"
                              >
                                🗑
                              </button>
                            </>
                          )}
                          {isMe(u) && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() =>
                                setDeleteModal({ type: 'mydata', user: u })
                              }
                              title="নিজের সব Amal data মুছুন"
                            >
                              🗑 My Data
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="mobile-cards" style={{ padding: 12 }}>
          {loading ? (
            <div
              style={{
                textAlign: 'center',
                padding: 30,
                color: 'var(--text-muted)',
              }}
            >
              ⏳ Loading...
            </div>
          ) : (
            filtered.map((u) => (
              <div
                key={u._id}
                style={{
                  background: 'var(--bg-tertiary)',
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 10,
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 9,
                        background: 'var(--accent-grad)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: 14,
                        flexShrink: 0,
                      }}
                    >
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>
                        {u.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {u.email}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 4,
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                    }}
                  >
                    <span
                      className={`badge ${u.role === 'admin' ? 'badge-warning' : 'badge-info'}`}
                    >
                      {u.role}
                    </span>
                    <span
                      className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}`}
                    >
                      {u.status}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    marginBottom: 8,
                  }}
                >
                  📋 {u.amalCount} records • Login:{' '}
                  {u.lastLogin
                    ? new Date(u.lastLogin).toLocaleDateString()
                    : 'Never'}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => viewUserData(u)}
                  >
                    👁 Data
                  </button>
                  {!isMe(u) && (
                    <>
                      {u.status === 'active' ? (
                        <button
                          className="btn btn-warning btn-sm"
                          onClick={() => setBanModal(u)}
                        >
                          🚫 Ban
                        </button>
                      ) : (
                        <button
                          className="btn btn-info btn-sm"
                          onClick={() => handleUnban(u._id)}
                        >
                          ✅ Unban
                        </button>
                      )}
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() =>
                          setDeleteModal({ type: 'user', user: u })
                        }
                      >
                        🗑 Delete
                      </button>
                    </>
                  )}
                  {isMe(u) && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() =>
                        setDeleteModal({ type: 'mydata', user: u })
                      }
                    >
                      🗑 My Data
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      <DeleteModal
        target={deleteModal}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal(null)}
        loading={deleteLoading}
      />

      {/* ── Ban Modal ── */}
      {banModal && (
        <div className="modal-overlay" onClick={() => setBanModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <span className="title">🚫 Ban: {banModal.name}</span>
              <button
                onClick={() => setBanModal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 20,
                }}
              >
                ×
              </button>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Ban এর কারণ (Optional)</label>
                <textarea
                  className="form-control"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="কারণ লিখুন..."
                  style={{ minHeight: 80 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-danger" onClick={handleBan}>
                  🚫 Ban করুন
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setBanModal(null)}
                >
                  বাতিল
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── User Data Modal ── */}
      {userDataModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setUserDataModal(null);
            setUserData(null);
          }}
        >
          <div
            className="modal"
            style={{ maxWidth: 680 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header">
              <div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>
                  📋 {userDataModal.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {userDataModal.email}
                </div>
              </div>
              <button
                onClick={() => {
                  setUserDataModal(null);
                  setUserData(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 20,
                  color: 'var(--text-muted)',
                }}
              >
                ×
              </button>
            </div>
            <div className="card-body">
              {!userData ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: 30,
                    color: 'var(--text-muted)',
                  }}
                >
                  ⏳ Loading...
                </div>
              ) : (
                <>
                  <div
                    className="stats-grid mb-2"
                    style={{ gridTemplateColumns: 'repeat(3,1fr)' }}
                  >
                    <div className="stat-card">
                      <div className="stat-value">{userData.amals.length}</div>
                      <div className="stat-label">Total Amals</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">
                        {userData.amals.filter((a) => a.fasting).length}
                      </div>
                      <div className="stat-label">Fasting Days</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">
                        {userData.amals.length
                          ? Math.round(
                              userData.amals.reduce(
                                (s, a) => s + a.progressScore,
                                0,
                              ) / userData.amals.length,
                            )
                          : 0}
                        %
                      </div>
                      <div className="stat-label">Avg Score</div>
                    </div>
                  </div>
                  <div
                    className="table-wrap"
                    style={{ maxHeight: 280, overflowY: 'auto' }}
                  >
                    <table>
                      <thead>
                        <tr>
                          <th>তারিখ</th>
                          <th>ফজর</th>
                          <th>যোহর</th>
                          <th>আসর</th>
                          <th>মাগরিব</th>
                          <th>ইশা</th>
                          <th>Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userData.amals.slice(0, 30).map((a) => (
                          <tr key={a._id}>
                            <td style={{ fontWeight: 600, fontSize: 12 }}>
                              {formatDate(a.date)}
                            </td>
                            {[a.fajr, a.dhuhr, a.asr, a.maghrib, a.isha].map(
                              (v, i) => (
                                <td key={i}>{v ? '✅' : '❌'}</td>
                              ),
                            )}
                            <td
                              style={{
                                fontWeight: 700,
                                color: 'var(--accent)',
                              }}
                            >
                              {a.progressScore}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
