import React, { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import API from '../utils/api';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const chartOpts = (dark) => ({
  responsive: true,
  plugins: { legend: { labels: { color: dark ? '#94a3b8' : '#475569', font: { size: 12 } } } },
  scales: {
    x: { ticks: { color: dark ? '#64748b' : '#94a3b8' }, grid: { color: dark ? '#1e2d3d' : '#f1f5f9' } },
    y: { ticks: { color: dark ? '#64748b' : '#94a3b8' }, grid: { color: dark ? '#1e2d3d' : '#f1f5f9' } }
  }
});

export default function Analytics() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('month');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';

  useEffect(() => {
    setLoading(true);
    API.get(`/amal/analytics?period=${period}&year=${year}&month=${month}`)
      .then(res => setData(res.data.data))
      .catch(() => toast.error('Analytics load failed'))
      .finally(() => setLoading(false));
  }, [period, year, month]);

  const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const accentColor = dark ? '#22c55e' : '#1a7a4a';

  // Progress line chart
  const lineData = data ? {
    labels: data.weeklyData.map(d => d.date.slice(5)),
    datasets: [{
      label: 'Progress Score %',
      data: data.weeklyData.map(d => d.progress),
      borderColor: accentColor,
      backgroundColor: dark ? 'rgba(34,197,94,0.1)' : 'rgba(26,122,74,0.1)',
      fill: true, tension: 0.4, pointRadius: 3,
    }, {
      label: 'Salah Count (×20)',
      data: data.weeklyData.map(d => d.salahCount * 20),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.05)',
      fill: false, tension: 0.4, pointRadius: 3,
    }]
  } : null;

  // Sleep line chart
  const sleepData = data ? {
    labels: data.weeklyData.map(d => d.date.slice(5)),
    datasets: [{
      label: 'ঘুম (মিনিট)',
      data: data.weeklyData.map(d => d.sleep),
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139,92,246,0.1)',
      fill: true, tension: 0.4,
    }]
  } : null;

  // Namaz pie
  const namazData = data ? {
    labels: ['ফজর', 'যোহর', 'আসর', 'মাগরিব', 'ইশা'],
    datasets: [{
      data: [data.namaz.fajr, data.namaz.dhuhr, data.namaz.asr, data.namaz.maghrib, data.namaz.isha],
      backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#f97316', '#8b5cf6'],
      borderWidth: 2, borderColor: dark ? '#141d2e' : '#ffffff'
    }]
  } : null;

  // Quran bar
  const quranData = data ? {
    labels: data.weeklyData.map(d => d.date.slice(5)),
    datasets: [{
      label: 'কুরআন পৃষ্ঠা',
      data: data.weeklyData.map(d => d.quranPages),
      backgroundColor: dark ? 'rgba(34,197,94,0.7)' : 'rgba(26,122,74,0.7)',
      borderRadius: 6,
    }]
  } : null;

  // Heatmap
  const HeatMap = ({ heatmap }) => {
    if (!heatmap || heatmap.length === 0) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>কোনো data নেই</div>;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {heatmap.map(({ date, value }) => {
          const bg = value >= 80 ? '#166534' : value >= 60 ? '#16a34a' : value >= 40 ? '#4ade80' : value >= 20 ? '#bbf7d0' : '#e2e8f0';
          return (
            <div key={date} title={`${date}: ${value}%`}
              style={{ width: 16, height: 16, borderRadius: 3, background: bg, cursor: 'default' }} />
          );
        })}
        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', width: '100%', fontSize: 11, color: 'var(--text-muted)' }}>
          <span>কম</span>
          {['#e2e8f0', '#bbf7d0', '#4ade80', '#16a34a', '#166534'].map(c => (
            <div key={c} style={{ width: 12, height: 12, borderRadius: 2, background: c }} />
          ))}
          <span>বেশি</span>
        </div>
      </div>
    );
  };

  const pieOpts = { responsive: true, plugins: { legend: { position: 'right', labels: { color: dark ? '#94a3b8' : '#475569', font: { size: 11 } } } } };

  return (
    <Layout title="Amal Analytics">
      {/* Period selector */}
      <div className="card mb-3">
        <div className="card-body">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
            <div>
              <label className="form-label">সময়কাল</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {['week', 'month', 'year'].map(p => (
                  <button key={p} onClick={() => setPeriod(p)} className="btn btn-sm"
                    style={{ background: period === p ? 'var(--accent)' : 'var(--bg-tertiary)', color: period === p ? 'white' : 'var(--text-secondary)', border: 'none' }}>
                    {p === 'week' ? '৭ দিন' : p === 'month' ? 'মাস' : 'বছর'}
                  </button>
                ))}
              </div>
            </div>
            {period === 'month' && (
              <div>
                <label className="form-label">মাস</label>
                <select className="form-control" value={month} onChange={e => setMonth(e.target.value)}>
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="form-label">বছর</label>
              <select className="form-control" value={year} onChange={e => setYear(e.target.value)}>
                {[2024, 2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            {data && <div style={{ marginLeft: 'auto', padding: '8px 14px', background: 'var(--accent-bg)', borderRadius: 8, fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>📊 {data.total} দিনের data</div>}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>⏳ Analytics লোড হচ্ছে...</div>
      ) : !data || data.total === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48 }}>📊</div>
          <div style={{ color: 'var(--text-muted)', marginTop: 12 }}>এই সময়কালে কোনো data নেই</div>
        </div>
      ) : (
        <>
          {/* Progress Chart */}
          <div className="card mb-3">
            <div className="card-header"><span style={{ fontWeight: 700 }}>📈 দৈনিক অগ্রগতি</span></div>
            <div className="card-body">{lineData && <Line data={lineData} options={chartOpts(dark)} />}</div>
          </div>

          {/* Namaz + Heatmap */}
          <div className="grid-2 mb-3">
            <div className="card">
              <div className="card-header"><span style={{ fontWeight: 700 }}>🕌 নামাজের ধারাবাহিকতা</span></div>
              <div className="card-body" style={{ maxHeight: 280 }}>{namazData && <Doughnut data={namazData} options={pieOpts} />}</div>
            </div>
            <div className="card">
              <div className="card-header"><span style={{ fontWeight: 700 }}>🗓️ Heatmap (আমলের ঘনত্ব)</span></div>
              <div className="card-body"><HeatMap heatmap={data.heatmap} /></div>
            </div>
          </div>

          {/* Quran + Sleep */}
          <div className="grid-2 mb-3">
            <div className="card">
              <div className="card-header"><span style={{ fontWeight: 700 }}>📖 কুরআন তেলাওয়াত</span></div>
              <div className="card-body">{quranData && <Bar data={quranData} options={chartOpts(dark)} />}</div>
            </div>
            <div className="card">
              <div className="card-header"><span style={{ fontWeight: 700 }}>😴 ঘুমের প্যাটার্ন</span></div>
              <div className="card-body">{sleepData && <Line data={sleepData} options={chartOpts(dark)} />}</div>
            </div>
          </div>

          {/* Namaz bar */}
          <div className="card mb-3">
            <div className="card-header"><span style={{ fontWeight: 700 }}>📊 নামাজের সংখ্যা তুলনা</span></div>
            <div className="card-body">
              <Bar data={{
                labels: ['ফজর', 'যোহর', 'আসর', 'মাগরিব', 'ইশা'],
                datasets: [{
                  label: 'আদায় হয়েছে',
                  data: [data.namaz.fajr, data.namaz.dhuhr, data.namaz.asr, data.namaz.maghrib, data.namaz.isha],
                  backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#f97316', '#8b5cf6'],
                  borderRadius: 8,
                }]
              }} options={{ ...chartOpts(dark), plugins: { legend: { display: false } } }} />
            </div>
          </div>

          {/* Monthly trend */}
          {data.monthlyData?.length > 1 && (
            <div className="card mb-3">
              <div className="card-header"><span style={{ fontWeight: 700 }}>📅 মাসিক ট্রেন্ড</span></div>
              <div className="card-body">
                <Bar data={{
                  labels: data.monthlyData.map(m => m.month),
                  datasets: [{
                    label: 'গড় Score %',
                    data: data.monthlyData.map(m => m.avgProgress),
                    backgroundColor: accentColor,
                    borderRadius: 6,
                  }, {
                    label: 'রোজার দিন',
                    data: data.monthlyData.map(m => m.fasting),
                    backgroundColor: '#f59e0b',
                    borderRadius: 6,
                  }]
                }} options={chartOpts(dark)} />
              </div>
            </div>
          )}

          {/* Fasting stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div style={{ fontSize: 24 }}>🌙</div>
              <div className="stat-value">{data.weeklyData.filter(d => d.fasting).length}</div>
              <div className="stat-label">রোজার দিন</div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: 24 }}>📖</div>
              <div className="stat-value">{data.weeklyData.reduce((s, d) => s + d.quranPages, 0)}</div>
              <div className="stat-label">মোট কুরআন পৃষ্ঠা</div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: 24 }}>📊</div>
              <div className="stat-value">
                {data.total ? Math.round(data.weeklyData.reduce((s, d) => s + d.progress, 0) / data.weeklyData.length) : 0}%
              </div>
              <div className="stat-label">গড় অগ্রগতি</div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: 24 }}>🕌</div>
              <div className="stat-value">
                {data.total ? Math.round(Object.values(data.namaz).reduce((s, v) => s + v, 0) / (data.total * 5) * 100) : 0}%
              </div>
              <div className="stat-label">নামাজ গড় %</div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
