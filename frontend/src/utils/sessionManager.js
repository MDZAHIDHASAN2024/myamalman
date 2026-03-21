const LAST_ACTIVE_KEY = 'amal_last_active';
const IDLE_TIMEOUT = 20 * 60 * 1000; // 20 minutes

export function initSession(logoutCallback) {
  const updateActive = () => {
    try {
      localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    } catch {}
  };

  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach((e) =>
    document.addEventListener(e, updateActive, { passive: true }),
  );
  updateActive();

  // Idle check every 60s
  const idleInterval = setInterval(() => {
    try {
      const last = parseInt(localStorage.getItem(LAST_ACTIVE_KEY) || '0');
      if (last > 0 && Date.now() - last > IDLE_TIMEOUT) {
        clearInterval(idleInterval);
        logoutCallback('idle');
      }
    } catch {}
  }, 60000);

  // Visibility check — when returning to tab/app
  const handleVisibility = () => {
    if (document.hidden) return;
    const token = localStorage.getItem('amal_token');
    if (!token) {
      logoutCallback('session');
      return;
    }
    const last = parseInt(localStorage.getItem(LAST_ACTIVE_KEY) || '0');
    if (last > 0 && Date.now() - last > IDLE_TIMEOUT) logoutCallback('idle');
  };
  document.addEventListener('visibilitychange', handleVisibility);

  // Storage event — if another tab logs out manually
  const handleStorage = (e) => {
    if (e.key === 'amal_token' && !e.newValue && e.oldValue) {
      logoutCallback('other_tab');
    }
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    clearInterval(idleInterval);
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('storage', handleStorage);
    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach((e) =>
      document.removeEventListener(e, updateActive),
    );
  };
}
