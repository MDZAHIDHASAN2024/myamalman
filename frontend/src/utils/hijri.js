// Hijri date utility - Bangladesh time aware
// Hijri date changes at Maghrib (approx 6pm BD time)

export function getBDHijriDate() {
  const now = new Date();
  const bdHour = (now.getUTCHours() + 6) % 24;
  const useDate = bdHour >= 18 ? new Date(now.getTime() + 86400000) : now;
  return useDate;
}

export function toHijri(date) {
  const d = new Date(date);
  try {
    return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(d);
  } catch { return ''; }
}

export function toHijriShort(date) {
  const d = new Date(date);
  try {
    return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric', month: 'short', year: 'numeric'
    }).format(d);
  } catch { return ''; }
}

export function getHijriDay(date) {
  const d = new Date(date);
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric' }).formatToParts(d);
    return parseInt(parts.find(p => p.type === 'day')?.value || '0');
  } catch { return null; }
}

export function isAyyamBeed(date) {
  return [13, 14, 15].includes(getHijriDay(date));
}

export function isSunnahFastingDay(date) {
  const d = new Date(date);
  return d.getDay() === 1 || d.getDay() === 4;
}

// Format: 15/03/2026
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

export function getTodayStr() {
  const now = new Date();
  const bdOffset = 6 * 60;
  const bd = new Date(now.getTime() + bdOffset * 60000);
  return bd.toISOString().split('T')[0];
}

export function getCurrentHijriDisplay() {
  const dateToUse = getBDHijriDate();
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric', month: 'short', year: 'numeric'
    }).formatToParts(dateToUse);
    const get = (t) => parts.find(p => p.type === t)?.value || '';
    return `${get('month')} ${get('day')}, ${get('year')} AH`;
  } catch { return ''; }
}
