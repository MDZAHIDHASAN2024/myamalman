import { useState, useEffect } from 'react';
import API from '../utils/api';

export function useFastingAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('amal_dismissed') || '[]');
      const week = Date.now() - 7 * 24 * 3600 * 1000;
      return saved.filter(d => d.ts > week);
    } catch { return []; }
  });

  const load = async () => {
    try {
      const res = await API.get('/reminder/fasting-upcoming');
      const all = res.data.data || [];
      setAlerts(all.filter(f => f.daysUntil >= 0 && f.daysUntil <= 1));
    } catch {}
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 3 * 60 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  const dismiss = (key) => {
    const updated = [...dismissed, { key, ts: Date.now() }];
    setDismissed(updated);
    localStorage.setItem('amal_dismissed', JSON.stringify(updated));
  };

  const dismissedKeys = dismissed.map(d => d.key);
  const visible = alerts.filter(a => !dismissedKeys.includes(`${a.date}_${a.type}`));

  return { visible, dismiss };
}
