import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { adminLogin, adminLogout, adminMe } from '../services/endpoints.js';
import { getToken, setToken } from '../services/api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(getToken()));

  // Restore the session from the stored token
  useEffect(() => {
    if (!getToken()) return;
    let alive = true;
    adminMe()
      .then((res) => alive && setUser(res.user))
      .catch(() => setToken(null))
      .finally(() => alive && setChecking(false));
    return () => {
      alive = false;
    };
  }, []);

  // Any 401 from the API signs the user out everywhere
  useEffect(() => {
    const onUnauthorized = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener('moraqqa:unauthorized', onUnauthorized);
    return () => window.removeEventListener('moraqqa:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await adminLogin(email, password);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminLogout();
    } catch {
      /* the local session is cleared regardless */
    }
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, checking, login, logout, isAuthenticated: Boolean(user) }), [user, checking, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
