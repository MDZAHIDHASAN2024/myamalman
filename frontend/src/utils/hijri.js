// Hijri date utility — Bangladesh timezone + Maghrib-aware + Real-time
// Islamic দিন শুরু হয় Maghrib এ (~18:00 BD time)
// Intl API midnight এ change করে, তাই Maghrib এর আগে 1 দিন পিছিয়ে দেখাতে হয়

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
      month: 'short',
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
    return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: TZ,
    }).format(new Date(dateStr + 'T12:00:00'));
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
// প্রতি মিনিটে check করে, Maghrib হলে auto update
import { useState, useEffect } from 'react';

export function useHijriDisplay() {
  const [hijri, setHijri] = useState(() => getCurrentHijriDisplay());

  useEffect(() => {
    // প্রতি মিনিটে check
    const interval = setInterval(() => {
      setHijri(getCurrentHijriDisplay());
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return hijri;
}
