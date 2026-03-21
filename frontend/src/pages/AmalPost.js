import React, { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import API from '../utils/api';
import { getTodayStr, toHijriShort, formatDate } from '../utils/hijri';
import toast from 'react-hot-toast';

const INITIAL = {
  date: getTodayStr(),
  fajr: false,
  dhuhr: false,
  asr: false,
  maghrib: false,
  isha: false,
  tahajjud: false,
  morningDua: false,
  daytimeTawbah: false,
  eveningDua: false,
  quranPages: '',
  fasting: false,
  fastingType: '',
  sadaqah: false,
  sadaqahAmount: '',
  foodPlates: '',
  sleepMinutes: '',
  notes: '',
};

const CheckBox = ({ label, emoji, checked, onChange, sublabel }) => (
  <div
    className={`check-item${checked ? ' checked' : ''}`}
    onClick={() => onChange(!checked)}
  >
    <div className="check-box">{checked && '✓'}</div>
    <span style={{ fontSize: 17 }}>{emoji}</span>
    <div style={{ flex: 1 }}>
      <div className="check-label">{label}</div>
      {sublabel && (
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          {sublabel}
        </div>
      )}
    </div>
  </div>
);

export default function AmalPost() {
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [dateExists, setDateExists] = useState(false);
  const [existingId, setExistingId] = useState(null);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  useEffect(() => {
    if (!form.date) return;
    setChecking(true);
    API.get(`/amal/check/${form.date}`)
      .then((res) => {
        if (res.data.exists) {
          setDateExists(true);
          setExistingId(res.data.data._id);
          const d = res.data.data;
          setForm({
            ...INITIAL,
            ...d,
            quranPages: d.quranPages || '',
            sadaqahAmount: d.sadaqahAmount || '',
            foodPlates: d.foodPlates || '',
            sleepMinutes: d.sleepMinutes || '',
            date: form.date,
          });
        } else {
          setDateExists(false);
          setExistingId(null);
          setForm({ ...INITIAL, date: form.date });
        }
      })
      .finally(() => setChecking(false));
  }, [form.date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        quranPages: Number(form.quranPages) || 0,
        sadaqahAmount: Number(form.sadaqahAmount) || 0,
        foodPlates: Number(form.foodPlates) || 0,
        sleepMinutes: Number(form.sleepMinutes) || 0,
      };
      if (dateExists && existingId) {
        await API.put(`/amal/${existingId}`, payload);
        toast.success('✅ আমল আপডেট হয়েছে!');
      } else {
        await API.post('/amal', payload);
        toast.success('✅ আমল সেভ হয়েছে!');
        setDateExists(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const hijri = toHijriShort(form.date);

  return (
    <Layout title="Amal Post">
      <form onSubmit={handleSubmit}>
        {/* Date selector */}
        <div className="card mb-2">
          <div className="card-body">
            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                alignItems: 'flex-end',
              }}
            >
              <div style={{ flex: '1 1 180px' }}>
                <label className="form-label">📅 তারিখ</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.date}
                  onChange={(e) => set('date', e.target.value)}
                  max={getTodayStr()}
                />
                {hijri && (
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--accent)',
                      marginTop: 5,
                      fontWeight: 600,
                    }}
                  >
                    🌙 {hijri}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {checking && (
                  <span className="badge badge-info">⏳ Checking...</span>
                )}
                {!checking && dateExists && (
                  <span className="badge badge-warning">📝 আপডেট মোড</span>
                )}
                {!checking && !dateExists && (
                  <span className="badge badge-success">✨ নতুন এন্ট্রি</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Fard Salah */}
        <div className="card mb-2">
          <div className="card-header">
            <span className="title">🕌 ফরয নামাজ</span>
          </div>
          <div className="card-body">
            <div className="salah-grid">
              {[
                { key: 'fajr', label: 'ফজর', emoji: '🌅' },
                { key: 'dhuhr', label: 'যোহর', emoji: '☀️' },
                { key: 'asr', label: 'আসর', emoji: '🌤️' },
                { key: 'maghrib', label: 'মাগরিব', emoji: '🌇' },
                { key: 'isha', label: 'ইশা', emoji: '🌙' },
              ].map((s) => (
                <div
                  key={s.key}
                  onClick={() => set(s.key, !form[s.key])}
                  style={{
                    textAlign: 'center',
                    padding: '12px 6px',
                    borderRadius: 10,
                    background: form[s.key]
                      ? 'var(--accent-bg)'
                      : 'var(--bg-tertiary)',
                    border: `2px solid ${form[s.key] ? 'var(--accent)' : 'var(--border)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: 22 }}>{s.emoji}</div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      marginTop: 4,
                      color: form[s.key]
                        ? 'var(--accent)'
                        : 'var(--text-secondary)',
                    }}
                  >
                    {s.label}
                  </div>
                  <div style={{ fontSize: 18, marginTop: 2 }}>
                    {form[s.key] ? '✅' : '⬜'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Extra ibadah */}
        <div className="card mb-2">
          <div className="card-header">
            <span className="title">📿 নফল ইবাদত</span>
          </div>
          <div className="card-body">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))',
                gap: 8,
              }}
            >
              <CheckBox
                label="তাহাজ্জুদ"
                emoji="🌌"
                checked={form.tahajjud}
                onChange={(v) => set('tahajjud', v)}
              />
              <CheckBox
                label="সকালের দোয়া"
                emoji="🌄"
                checked={form.morningDua}
                onChange={(v) => set('morningDua', v)}
              />
              <CheckBox
                label="তওবা"
                emoji="🤲"
                checked={form.daytimeTawbah}
                onChange={(v) => set('daytimeTawbah', v)}
              />
              <CheckBox
                label="সন্ধ্যার দোয়া"
                emoji="🌆"
                checked={form.eveningDua}
                onChange={(v) => set('eveningDua', v)}
              />
            </div>
          </div>
        </div>

        {/* Quran only - pages */}
        <div className="card mb-2">
          <div className="card-header">
            <span className="title">📖 কুরআন তেলাওয়াত</span>
          </div>
          <div className="card-body">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">📖 কুরআন (পৃষ্ঠা)</label>
              <input
                type="number"
                className="form-control"
                min="0"
                max="604"
                value={form.quranPages}
                onChange={(e) => set('quranPages', e.target.value)}
                placeholder="আজ কত পৃষ্ঠা পড়েছেন?"
              />
            </div>
          </div>
        </div>

        {/* Fasting */}
        <div className="card mb-2">
          <div className="card-header">
            <span className="title">🌙 রোজা</span>
          </div>
          <div className="card-body">
            <CheckBox
              label="আজ রোজা রেখেছি"
              emoji="🌙"
              checked={form.fasting}
              onChange={(v) => set('fasting', v)}
            />
            {form.fasting && (
              <div className="form-group mt-1" style={{ marginBottom: 0 }}>
                <label className="form-label">রোজার ধরন</label>
                <select
                  className="form-control"
                  value={form.fastingType}
                  onChange={(e) => set('fastingType', e.target.value)}
                >
                  <option value="">নির্বাচন করুন</option>
                  <option value="fard">Fard / ফরজ (রমজান)</option>
                  <option value="monday">Monday / সোমবার</option>
                  <option value="thursday">Thursday / বৃহস্পতিবার</option>
                  <option value="ayyam_beed">
                    Ayyam al-Beed / আইয়্যামুল বীয (১৩/১৪/১৫)
                  </option>
                  <option value="other">Other / অন্যান্য সুন্নাহ</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Sadaqah */}
        <div className="card mb-2">
          <div className="card-header">
            <span className="title">💝 সাদাকাহ</span>
          </div>
          <div className="card-body">
            <CheckBox
              label="আজ সাদাকাহ দিয়েছি"
              emoji="💝"
              checked={form.sadaqah}
              onChange={(v) => set('sadaqah', v)}
            />
            {form.sadaqah && (
              <div className="form-group mt-1" style={{ marginBottom: 0 }}>
                <label className="form-label">পরিমাণ (৳ টাকা)</label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  value={form.sadaqahAmount}
                  onChange={(e) => set('sadaqahAmount', e.target.value)}
                  placeholder="পরিমাণ লিখুন"
                />
              </div>
            )}
          </div>
        </div>

        {/* Lifestyle */}
        <div className="card mb-2">
          <div className="card-header">
            <span className="title">🍽️ জীবনযাপন</span>
          </div>
          <div className="card-body">
            <div className="grid-2">
              {/* Food Plates */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">🍽️ খাবার (কত প্লেট)</label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  max="20"
                  step="0.5"
                  value={form.foodPlates}
                  onChange={(e) => set('foodPlates', e.target.value)}
                  placeholder="যেমন: 3 বা 2.5"
                />
                {form.foodPlates > 0 && (
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--info)',
                      marginTop: 4,
                      fontWeight: 600,
                    }}
                  >
                    = {form.foodPlates} প্লেট খেয়েছেন
                  </div>
                )}
              </div>
              {/* Sleep */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">😴 ঘুম (মিনিট)</label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  max="1440"
                  value={form.sleepMinutes}
                  onChange={(e) => set('sleepMinutes', e.target.value)}
                  placeholder="যেমন: 480 = 8 ঘণ্টা"
                />
                {form.sleepMinutes > 0 && (
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--accent)',
                      marginTop: 4,
                      fontWeight: 600,
                    }}
                  >
                    = {(form.sleepMinutes / 60).toFixed(1)} ঘণ্টা
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card mb-3">
          <div className="card-header">
            <span className="title">📝 নোট</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {(form.notes || '').length} chars
            </span>
          </div>
          <div className="card-body">
            <textarea
              className="form-control"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="আজকের অনুভূতি, দোয়া, লক্ষ্য, কৃতজ্ঞতা... যেকোনো কিছু লিখুন (সীমাহীন)"
              style={{ minHeight: 120 }}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg w-full"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          disabled={loading}
        >
          {loading
            ? '⏳ সেভ হচ্ছে...'
            : dateExists
              ? '🔄 আমল আপডেট করুন'
              : '✅ আমল সেভ করুন'}
        </button>
      </form>
    </Layout>
  );
}
