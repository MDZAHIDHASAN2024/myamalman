import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/common/Layout';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'tips', label: '💡 Tips' },
  { key: 'sunnah', label: '🌙 Sunnah' },
];

// ── Delete Confirm Modal ──
function DeleteModal({ tip, onConfirm, onClose, deleting }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 400, textAlign: 'center' }}
      >
        <div style={{ padding: '32px 24px 24px' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🗑️</div>
          <div
            style={{
              fontWeight: 800,
              fontSize: 17,
              color: 'var(--text-primary)',
              marginBottom: 8,
            }}
          >
            Delete করবেন?
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              marginBottom: 6,
              lineHeight: 1.6,
            }}
          >
            এই card টি permanently delete হয়ে যাবে।
          </div>
          <div
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '10px 14px',
              margin: '12px 0 20px',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary)',
              wordBreak: 'break-word',
            }}
          >
            "{tip.title}"
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={onClose}
              className="btn btn-secondary"
              style={{ minWidth: 90 }}
              disabled={deleting}
            >
              বাতিল
            </button>
            <button
              onClick={onConfirm}
              className="btn btn-danger"
              style={{ minWidth: 90 }}
              disabled={deleting}
            >
              {deleting ? '...' : '🗑️ Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add/Edit Modal ──
function TipModal({ initial, type, onClose, onSave }) {
  const [title, setTitle] = useState(initial?.title || '');

  // numbered items: { text }
  const [numberedItems, setNumberedItems] = useState(
    initial?.numberedItems?.map((i) => i.text) || [''],
  );

  // expandable items: { title, detail }
  const [expandableItems, setExpandableItems] = useState(
    initial?.expandableItems?.map((i) => ({
      title: i.title,
      detail: i.detail,
    })) || [{ title: '', detail: '' }],
  );

  const [saving, setSaving] = useState(false);

  // Numbered item handlers
  const updateNumbered = (i, val) => {
    const updated = [...numberedItems];
    updated[i] = val;
    setNumberedItems(updated);
  };
  const addNumbered = () => setNumberedItems((prev) => [...prev, '']);
  const removeNumbered = (i) =>
    setNumberedItems((prev) => prev.filter((_, idx) => idx !== i));

  // Expandable item handlers
  const updateExpandable = (i, field, val) => {
    const updated = [...expandableItems];
    updated[i] = { ...updated[i], [field]: val };
    setExpandableItems(updated);
  };
  const addExpandable = () =>
    setExpandableItems((prev) => [...prev, { title: '', detail: '' }]);
  const removeExpandable = (i) =>
    setExpandableItems((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!title.trim()) return toast.error('Heading দিন');
    const filteredNumbered = numberedItems.filter((t) => t.trim());
    const filteredExpandable = expandableItems.filter((e) => e.title.trim());
    if (!filteredNumbered.length && !filteredExpandable.length)
      return toast.error('কমপক্ষে ১টা item দিন');

    setSaving(true);
    await onSave({
      title: title.trim(),
      type,
      numberedItems: filteredNumbered.map((text) => ({ text })),
      expandableItems: filteredExpandable.map((e) => ({
        title: e.title.trim(),
        detail: e.detail.trim(),
      })),
    });
    setSaving(false);
  };

  const inputStyle = { flex: 1 };
  const removeBtn = (onClick) => (
    <button
      onClick={onClick}
      style={{
        background: 'var(--danger-bg)',
        border: 'none',
        borderRadius: 6,
        padding: '6px 10px',
        cursor: 'pointer',
        color: 'var(--danger)',
        fontSize: 14,
      }}
    >
      ✕
    </button>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 520 }}
      >
        <div className="card-header">
          <span className="title">
            {initial ? '✏️ Edit Card' : '➕ নতুন Card'}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            ×
          </button>
        </div>

        <div
          className="card-body"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            maxHeight: '70vh',
            overflowY: 'auto',
          }}
        >
          {/* Heading */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Heading</label>
            <input
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="হেডিং এড করুন"
            />
          </div>

          {/* Numbered Items */}
          <div>
            <label
              className="form-label"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  background: 'var(--accent)',
                  color: 'white',
                  borderRadius: 6,
                  padding: '1px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                1, 2, 3
              </span>
              Numbered Items
            </label>
            {numberedItems.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 7,
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    minWidth: 22,
                  }}
                >
                  {i + 1}.
                </span>
                <input
                  className="form-control"
                  value={item}
                  onChange={(e) => updateNumbered(i, e.target.value)}
                  placeholder={'Item ' + (i + 1)}
                  style={inputStyle}
                />
                {numberedItems.length > 1 && removeBtn(() => removeNumbered(i))}
              </div>
            ))}
            <button
              onClick={addNumbered}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 2 }}
            >
              + Numbered item যোগ করুন
            </button>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px dashed var(--border)', margin: '0' }} />

          {/* Expandable Items */}
          <div>
            <label
              className="form-label"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  background: 'var(--purple, #7C3AED)',
                  color: 'white',
                  borderRadius: 6,
                  padding: '1px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                ▶
              </span>
              Expandable Items (click করলে detail দেখা যাবে)
            </label>
            {expandableItems.map((item, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      minWidth: 28,
                    }}
                  >
                    Title
                  </span>
                  <input
                    className="form-control"
                    value={item.title}
                    onChange={(e) =>
                      updateExpandable(i, 'title', e.target.value)
                    }
                    placeholder="Item এর title"
                    style={{ flex: 1 }}
                  />
                  {expandableItems.length > 1 &&
                    removeBtn(() => removeExpandable(i))}
                </div>
                <div
                  style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      minWidth: 28,
                      paddingTop: 9,
                    }}
                  >
                    Detail
                  </span>
                  <textarea
                    className="form-control"
                    value={item.detail}
                    onChange={(e) =>
                      updateExpandable(i, 'detail', e.target.value)
                    }
                    placeholder="বিস্তারিত লিখুন (optional)"
                    rows={2}
                    style={{ flex: 1, resize: 'vertical', minHeight: 56 }}
                  />
                </div>
              </div>
            ))}
            <button
              onClick={addExpandable}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 2 }}
            >
              + Expandable item যোগ করুন
            </button>
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
              marginTop: 4,
            }}
          >
            <button onClick={onClose} className="btn btn-secondary">
              বাতিল
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? '...' : 'সেভ করুন'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Expandable Item Row ──
function ExpandableRow({ item, accent }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--border-light)' }}>
      <div
        onClick={() => setOpen((p) => !p)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '9px 16px',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = 'var(--bg-tertiary)')
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: accent,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 13,
            color: 'var(--text-primary)',
            flex: 1,
            lineHeight: 1.55,
            wordBreak: 'break-word',
          }}
        >
          {item.title}
        </span>
        <span
          style={{
            fontSize: 10,
            color: accent,
            transition: 'transform 0.2s',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            flexShrink: 0,
            display: 'inline-block',
          }}
        >
          ▶
        </span>
      </div>
      {open && item.detail && (
        <div
          style={{
            padding: '0 16px 10px 34px',
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.75,
            borderLeft: `3px solid ${accent}`,
            marginLeft: 16,
            marginBottom: 6,
          }}
        >
          {item.detail}
        </div>
      )}
    </div>
  );
}

// ── Tip Card ──
function TipCard({ tip, onEdit, onDelete, isOwner, isAdmin, type }) {
  const accent = type === 'sunnah' ? 'var(--purple)' : 'var(--accent)';
  const accentBg = type === 'sunnah' ? 'var(--purple-bg)' : 'var(--accent-bg)';
  const icon = type === 'sunnah' ? '🌙' : '💡';

  const hasNumbered = tip.numberedItems && tip.numberedItems.length > 0;
  const hasExpandable = tip.expandableItems && tip.expandableItems.length > 0;

  // fallback: support old `items` field if new fields not present
  const legacyItems = !hasNumbered && !hasExpandable && tip.items;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
        marginBottom: 14,
        overflow: 'hidden',
        transition: 'var(--transition)',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: accentBg,
          borderBottom: '1px solid var(--border)',
          padding: '13px 16px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 9,
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              flexShrink: 0,
              marginTop: 1,
            }}
          >
            {icon}
          </div>
          <span
            style={{
              fontWeight: 800,
              fontSize: 14,
              color: 'var(--text-primary)',
              flex: 1,
              minWidth: 0,
              wordBreak: 'break-word',
              lineHeight: 1.5,
            }}
          >
            {tip.title}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 5,
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: accent,
              background: accentBg,
              border: '1px solid ' + accent,
              borderRadius: 999,
              padding: '2px 7px',
              whiteSpace: 'nowrap',
            }}
          >
            {tip.createdBy && tip.createdBy.name}
          </span>
          {isOwner && (
            <button
              onClick={() => onEdit(tip)}
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: 7,
                padding: '5px 8px',
                cursor: 'pointer',
                fontSize: 12,
                color: 'var(--text-secondary)',
              }}
            >
              ✏️
            </button>
          )}
          {(isOwner || isAdmin) && (
            <button
              onClick={() => onDelete(tip)}
              style={{
                background: 'var(--danger-bg)',
                border: 'none',
                borderRadius: 7,
                padding: '5px 8px',
                cursor: 'pointer',
                fontSize: 12,
                color: 'var(--danger)',
              }}
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Legacy items fallback */}
      {legacyItems && (
        <div
          style={{
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
        >
          {tip.items.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                padding: '9px 0',
                borderBottom:
                  i < tip.items.length - 1
                    ? '1px solid var(--border-light)'
                    : 'none',
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 7,
                  background: accent,
                  color: 'white',
                  fontWeight: 800,
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {i + 1}
              </div>
              <span
                style={{
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  lineHeight: 1.65,
                  flex: 1,
                  wordBreak: 'break-word',
                }}
              >
                {item.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Numbered Items Section */}
      {hasNumbered && (
        <>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '8px 16px 4px',
              borderBottom: '1px solid var(--border-light)',
            }}
          ></div>
          <div style={{ padding: '6px 0' }}>
            {tip.numberedItems.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  padding: '8px 16px',
                  borderBottom:
                    i < tip.numberedItems.length - 1
                      ? '1px solid var(--border-light)'
                      : 'none',
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 7,
                    background: accent,
                    color: 'white',
                    fontWeight: 800,
                    fontSize: 11,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {i + 1}
                </div>
                <span
                  style={{
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    lineHeight: 1.65,
                    flex: 1,
                    wordBreak: 'break-word',
                  }}
                >
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Expandable Items Section */}
      {hasExpandable && (
        <>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '8px 16px 4px',
              borderTop: hasNumbered ? '1px solid var(--border)' : 'none',
              borderBottom: '1px solid var(--border-light)',
            }}
          ></div>
          <div>
            {tip.expandableItems.map((item, i) => (
              <ExpandableRow
                key={i}
                item={item}
                accent={accent}
                isLast={i === tip.expandableItems.length - 1}
              />
            ))}
          </div>
        </>
      )}

      {/* Footer */}
      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-tertiary)',
        }}
      >
        <span
          style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}
        >
          {(hasNumbered ? tip.numberedItems.length : 0) +
            (hasExpandable ? tip.expandableItems.length : 0) ||
            (legacyItems ? tip.items.length : 0)}{' '}
          টি item
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          {new Date(tip.createdAt).toLocaleDateString('bn-BD')}
        </span>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function TipsSunnah() {
  const { user } = useAuth();
  const isAdmin = user && user.role === 'admin';

  const [activeTab, setActiveTab] = useState('tips');
  const [tips, setTips] = useState([]);
  const [counts, setCounts] = useState({ tips: 0, sunnah: 0 });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadCounts = useCallback(async () => {
    try {
      const [tipsRes, sunnahRes] = await Promise.all([
        API.get('/tips?type=tips'),
        API.get('/tips?type=sunnah'),
      ]);
      setCounts({
        tips: (tipsRes.data.data || []).length,
        sunnah: (sunnahRes.data.data || []).length,
      });
    } catch (_) {}
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: activeTab });
      if (search.trim()) params.set('search', search.trim());
      const res = await API.get('/tips?' + params.toString());
      setTips(res.data.data || []);
    } catch (err) {
      toast.error('Load failed');
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleSave = async (data) => {
    try {
      if (editTarget) {
        await API.put('/tips/' + editTarget._id, data);
        toast.success('আপডেট হয়েছে');
      } else {
        await API.post('/tips', data);
        toast.success('Card যোগ হয়েছে');
      }
      setShowModal(false);
      setEditTarget(null);
      load();
      loadCounts();
    } catch (err) {
      toast.error('সেভ failed');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await API.delete('/tips/' + deleteTarget._id);
      toast.success('Delete হয়েছে');
      setDeleteTarget(null);
      load();
      loadCounts();
    } catch (err) {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Layout title="Tips & Sunnah">
      {/* Top bar */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-tertiary)',
              borderRadius: 10,
              padding: 3,
              border: '1px solid var(--border)',
            }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  background:
                    activeTab === tab.key
                      ? 'var(--accent-grad)'
                      : 'transparent',
                  color:
                    activeTab === tab.key ? 'white' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                }}
              >
                {tab.label}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    background:
                      activeTab === tab.key
                        ? 'rgba(255,255,255,0.25)'
                        : 'var(--border)',
                    color:
                      activeTab === tab.key ? 'white' : 'var(--text-muted)',
                    borderRadius: 999,
                    padding: '1px 7px',
                    minWidth: 22,
                    textAlign: 'center',
                  }}
                >
                  {counts[tab.key]}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setEditTarget(null);
              setShowModal(true);
            }}
            className="btn btn-primary"
          >
            ➕ নতুন Card
          </button>
        </div>

        <div style={{ position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 14,
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          >
            🔍
          </span>
          <input
            className="form-control"
            placeholder="Search করুন..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>
            {activeTab === 'tips' ? '💡' : '🌙'}
          </div>
          <div
            style={{
              color: 'var(--text-muted)',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Loading...
          </div>
        </div>
      ) : tips.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>
            {activeTab === 'tips' ? '💡' : '🌙'}
          </div>
          <div
            style={{
              color: 'var(--text-muted)',
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            {search ? 'কোনো result পাওয়া যায়নি' : 'এখনো কোনো card নেই'}
          </div>
          {!search && (
            <button
              onClick={() => {
                setEditTarget(null);
                setShowModal(true);
              }}
              className="btn btn-primary"
              style={{ marginTop: 8 }}
            >
              ➕ প্রথম Card যোগ করুন
            </button>
          )}
        </div>
      ) : (
        tips.map((tip) => {
          const ownerId = tip.createdBy && (tip.createdBy._id || tip.createdBy);
          const userId = user && user._id;
          return (
            <TipCard
              key={tip._id}
              tip={tip}
              type={activeTab}
              isOwner={ownerId === userId}
              isAdmin={isAdmin}
              onEdit={(t) => {
                setEditTarget(t);
                setShowModal(true);
              }}
              onDelete={(t) => setDeleteTarget(t)}
            />
          );
        })
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <TipModal
          initial={editTarget}
          type={activeTab}
          onClose={() => {
            setShowModal(false);
            setEditTarget(null);
          }}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <DeleteModal
          tip={deleteTarget}
          deleting={deleting}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </Layout>
  );
}
