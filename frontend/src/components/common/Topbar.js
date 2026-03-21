import React, { useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  getCurrentHijriDisplay,
  getTodayStr,
  formatDate,
} from '../../utils/hijri';

export default function Topbar({ onMenuClick, title }) {
  const { theme, toggleTheme } = useTheme();
  const today = getTodayStr();
  const hijri = getCurrentHijriDisplay();

  // Dynamic browser tab title
  useEffect(() => {
    document.title = `${title} | My Amal`;
  }, [title]);

  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onMenuClick}
          className="hide-desktop"
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          ☰
        </button>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: 15,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {formatDate(today)}
            </span>
            {hijri && (
              <span className="hijri-chip hide-mobile">🌙 {hijri}</span>
            )}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {hijri && (
          <span
            className="hijri-chip hide-desktop"
            style={{ fontSize: 10, padding: '2px 8px' }}
          >
            🌙 {hijri}
          </span>
        )}
        <button
          onClick={toggleTheme}
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 16,
          }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </div>
  );
}
