import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import API from '../utils/api';
import { initSession } from '../utils/sessionManager';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const TOKEN_KEY = 'amal_token';
const USER_KEY = 'amal_user';
const LAST_ACTIVE_KEY = 'amal_last_active';
const SESSION_FLAG = 'amal_session'; // sessionStorage — browser বন্ধে auto-clear
const TAB_PING_KEY = 'amal_tab_ping'; // localStorage — নতুন tab ping করে
const TAB_PONG_KEY = 'amal_tab_pong'; // localStorage — active tab pong দেয়

const ls = {
  get: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
  del: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {}
  },
};

const ss = {
  get: (k) => {
    try {
      return sessionStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k, v) => {
    try {
      sessionStorage.setItem(k, v);
    } catch {}
  },
  del: (k) => {
    try {
      sessionStorage.removeItem(k);
    } catch {}
  },
};

function clearAuth() {
  [TOKEN_KEY, USER_KEY, LAST_ACTIVE_KEY, TAB_PING_KEY, TAB_PONG_KEY].forEach(
    (k) => {
      try {
        localStorage.removeItem(k);
      } catch {}
    },
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const cleanupRef = useRef(null);

  const logout = useCallback((reason) => {
    clearAuth();
    ss.del(SESSION_FLAG);
    setUser(null);
    if (reason === 'idle')
      toast('⏰ ২০ মিনিট idle — auto logout', { icon: '🔒', duration: 4000 });
    else if (reason === 'other_tab')
      toast('🔒 অন্য tab এ logout হয়েছে', { duration: 3000 });
    window.location.href = '/login';
  }, []);

  // ── অন্য tab এর ping শুনে pong দাও ──
  // এই listener সবসময় active থাকে
  useEffect(() => {
    const handleStorage = (e) => {
      // নতুন tab ping করেছে, আমি active আছি → pong দাও
      if (e.key === TAB_PING_KEY && e.newValue === 'ping') {
        if (ss.get(SESSION_FLAG)) {
          ls.set(TAB_PONG_KEY, 'pong');
        }
        return;
      }

      // cross-tab logout sync
      if (e.key === TOKEN_KEY && !e.newValue && e.oldValue) {
        ss.del(SESSION_FLAG);
        setUser(null);
        window.location.href = '/login';
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // ── Startup ──
  useEffect(() => {
    const token = ls.get(TOKEN_KEY);
    const ssSession = ss.get(SESSION_FLAG);

    if (!token) {
      setLoading(false);
      return;
    }

    // sessionStorage flag আছে → same tab এ page refresh
    if (ssSession) {
      API.get('/auth/me')
        .then((res) => {
          setUser(res.data.user);
          ls.set(USER_KEY, JSON.stringify(res.data.user));
        })
        .catch(() => {
          clearAuth();
          ss.del(SESSION_FLAG);
          setUser(null);
        })
        .finally(() => setLoading(false));
      return;
    }

    // sessionStorage নেই → নতুন tab নাকি browser close ছিল?
    // actual localStorage.setItem দিয়ে ping করো — অন্য tab এ storage event যাবে
    ls.del(TAB_PONG_KEY);
    ls.set(TAB_PING_KEY, 'ping'); // এটা অন্য tab এ storage event trigger করবে

    const timer = setTimeout(() => {
      const pong = ls.get(TAB_PONG_KEY);
      ls.del(TAB_PING_KEY);
      ls.del(TAB_PONG_KEY);

      if (pong === 'pong') {
        // অন্য active tab আছে → নতুন tab → login রাখো
        ss.set(SESSION_FLAG, '1');

        API.get('/auth/me')
          .then((res) => {
            setUser(res.data.user);
            ls.set(USER_KEY, JSON.stringify(res.data.user));
          })
          .catch(() => {
            clearAuth();
            ss.del(SESSION_FLAG);
            setUser(null);
          })
          .finally(() => setLoading(false));
      } else {
        // কোনো tab respond করেনি → browser বন্ধ ছিল → logout
        clearAuth();
        setUser(null);
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // ── user set হলে sessionStorage এ flag রাখো ──
  useEffect(() => {
    if (user) {
      ss.set(SESSION_FLAG, '1');
    }
  }, [user]);

  // ── Session manager (idle + visibility) ──
  useEffect(() => {
    if (user) {
      if (cleanupRef.current) cleanupRef.current();
      cleanupRef.current = initSession(logout);
    }
    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, [user, logout]);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    const userData = res.data.user;
    ls.set(TOKEN_KEY, res.data.token);
    ls.set(USER_KEY, JSON.stringify(userData));
    ls.set(LAST_ACTIVE_KEY, Date.now().toString());
    ss.set(SESSION_FLAG, '1');
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password) => {
    const res = await API.post('/auth/register', { name, email, password });
    const userData = res.data.user;
    ls.set(TOKEN_KEY, res.data.token);
    ls.set(USER_KEY, JSON.stringify(userData));
    ls.set(LAST_ACTIVE_KEY, Date.now().toString());
    ss.set(SESSION_FLAG, '1');
    setUser(userData);
    return userData;
  };

  const manualLogout = () => {
    clearAuth();
    ss.del(SESSION_FLAG);
    setUser(null);
  };

  const updateUser = (data) => {
    const updated = { ...user, ...data };
    setUser(updated);
    ls.set(USER_KEY, JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout: manualLogout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
