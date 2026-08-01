// Hijri date utility — Bangladesh timezone + Maghrib-aware + Real-time

const TZ = 'Asia/Dhaka';
const MAGHRIB_HOUR = 18;

function getBDHour() {
  return parseInt(
    new Intl.DateTimeFormat('en', {
      hour: 'numeric',
      hour12: false,
      timeZone: TZ,
    }).format(new Date()),
  );
}

function getHijriDisplayDate() {
  const now = new Date();
  const bdHour = getBDHour();
  return bdHour < MAGHRIB_HOUR ? new Date(now.getTime() - 86400000) : now;
}

export function getCurrentHijriDisplay() {
  const d = getHijriDisplayDate();
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: TZ,
    }).formatToParts(d);
    const get = (t) => parts.find((p) => p.type === t)?.value || '';
    return `${get('month')} ${get('day')}, ${get('year')} AH`;
  } catch {
    return '';
  }
}

export function getTodayHijriDay() {
  const d = getHijriDisplayDate();
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      timeZone: TZ,
    }).formatToParts(d);
    return parseInt(parts.find((p) => p.type === 'day')?.value || '0');
  } catch {
    return 0;
  }
}

export function getBDWeekday() {
  const name = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    timeZone: TZ,
  }).format(new Date());
  return [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ].indexOf(name);
}

export function getTodayStr() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

// Amal posting জন্য সর্বোচ্চ অনুমোদিত তারিখ।
// সন্ধ্যা ৬টার (Maghrib) আগে: আজকের তারিখ পর্যন্তই পোস্ট করা যাবে।
// সন্ধ্যা ৬টার পর: আগামীকালের আমলও পোস্ট করা যাবে।
export function getAmalMaxDate() {
  const bdHour = getBDHour();
  const todayStr = getTodayStr();
  if (bdHour < MAGHRIB_HOUR) return todayStr;
  const [y, m, d] = todayStr.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return next.toISOString().split('T')[0];
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function toHijri(dateStr) {
  try {
    return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: TZ,
    }).format(new Date(dateStr + 'T12:00:00'));
  } catch {
    return '';
  }
}

export function toHijriShort(dateStr) {
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: TZ,
    }).formatToParts(new Date(dateStr + 'T12:00:00'));
    const get = (t) => parts.find((p) => p.type === t)?.value || '';
    return `${get('month')} ${get('day')}, ${get('year')} AH`;
  } catch {
    return '';
  }
}

export function getHijriDay(dateStr) {
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      timeZone: TZ,
    }).formatToParts(new Date(dateStr + 'T12:00:00'));
    return parseInt(parts.find((p) => p.type === 'day')?.value || '0');
  } catch {
    return null;
  }
}

export function isAyyamBeed(dateStr) {
  return [13, 14, 15].includes(getHijriDay(dateStr));
}

export function isSunnahFastingDay(dateStr) {
  try {
    const name = new Intl.DateTimeFormat('en', {
      weekday: 'long',
      timeZone: TZ,
    }).format(new Date(dateStr + 'T12:00:00'));
    return name === 'Monday' || name === 'Thursday';
  } catch {
    return false;
  }
}

// ── Real-time Hijri hook ──
import { useState, useEffect } from 'react';

export function useHijriDisplay() {
  const [hijri, setHijri] = useState(() => getCurrentHijriDisplay());

  useEffect(() => {
    const interval = setInterval(() => {
      setHijri(getCurrentHijriDisplay());
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return hijri;
}
