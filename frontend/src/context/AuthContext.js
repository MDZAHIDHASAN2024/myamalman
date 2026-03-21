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
const SESSION_FLAG = 'amal_session'; // sessionStorage — tab-specific
const LS_SESSION_KEY = 'amal_ls_session'; // localStorage  — shared across tabs

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
  [TOKEN_KEY, USER_KEY, LAST_ACTIVE_KEY, LS_SESSION_KEY].forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {}
  });
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const cleanupRef = useRef(null);
  const tabRegistered = useRef(false);

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

  // ── Startup: browser-close vs new-tab সঠিকভাবে আলাদা করা ──
  useEffect(() => {
    const token = ls.get(TOKEN_KEY);
    const lsSession = ls.get(LS_SESSION_KEY); // localStorage — সব tab share করে
    const ssSession = ss.get(SESSION_FLAG); // sessionStorage — শুধু এই tab এর

    if (!token) {
      setLoading(false);
      return;
    }

    // token আছে কিন্তু lsSession নেই
    // → browser সত্যিই বন্ধ হয়েছিল (সব tab বন্ধ হলে ls clear হয়)
    if (!lsSession) {
      clearAuth();
      setUser(null);
      setLoading(false);
      return;
    }

    // lsSession আছে → হয় নতুন tab, নয়তো page refresh
    // দুই ক্ষেত্রেই token verify করে login ধরে রাখো
    API.get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        ls.set(USER_KEY, JSON.stringify(res.data.user));
        ss.set(SESSION_FLAG, '1'); // এই tab এর নিজস্ব flag সেট
      })
      .catch(() => {
        clearAuth();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── user set হলে উভয় storage এ flag রাখো ──
  useEffect(() => {
    if (user) {
      ss.set(SESSION_FLAG, '1');
      ls.set(LS_SESSION_KEY, '1');
    }
  }, [user]);

  // ── beforeunload: lsSession মুছি না (অন্য tab চলতে পারে) ──
  // ── browser সত্যিই বন্ধ হলে explicit logout এ lsSession মুছবে ──
  useEffect(() => {
    if (tabRegistered.current) return;
    tabRegistered.current = true;

    const handleUnload = () => {
      // sessionStorage এমনিতেই tab বন্ধে মুছে যায়
      // lsSession ইচ্ছাকৃত logout ছাড়া মুছবো না
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

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

  // ── Cross-tab logout sync ──
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === TOKEN_KEY && !e.newValue && e.oldValue) {
        setUser(null);
        window.location.href = '/login';
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    const userData = res.data.user;
    ls.set(TOKEN_KEY, res.data.token);
    ls.set(USER_KEY, JSON.stringify(userData));
    ls.set(LAST_ACTIVE_KEY, Date.now().toString());
    ls.set(LS_SESSION_KEY, '1'); // localStorage — সব নতুন tab দেখতে পাবে
    ss.set(SESSION_FLAG, '1'); // sessionStorage — শুধু এই tab
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password) => {
    const res = await API.post('/auth/register', { name, email, password });
    const userData = res.data.user;
    ls.set(TOKEN_KEY, res.data.token);
    ls.set(USER_KEY, JSON.stringify(userData));
    ls.set(LAST_ACTIVE_KEY, Date.now().toString());
    ls.set(LS_SESSION_KEY, '1');
    ss.set(SESSION_FLAG, '1');
    setUser(userData);
    return userData;
  };

  const manualLogout = () => {
    clearAuth(); // LS_SESSION_KEY সহ সব মুছে যাবে
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
