import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { getToken, setToken, setUser, getUser, clearAuth } from '../utils/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState]    = useState(getUser);
  const [token, setTokenState]  = useState(getToken);
  const [loading, setLoading]   = useState(!!getToken()); // loading only if token exists

  // On mount: verify token is still valid
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.get('/api/auth/me')
      .then(res => { setUserState(res.data.data.user); setUser(res.data.data.user); })
      .catch(() => { clearAuth(); setUserState(null); setTokenState(null); })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    const { token: t, user: u } = res.data.data;
    setToken(t); setUser(u);
    setTokenState(t); setUserState(u);
    return u;
  }, []);

  const register = useCallback(async (data) => {
    const res = await api.post('/api/auth/register', data);
    const { token: t, user: u } = res.data.data;
    setToken(t); setUser(u);
    setTokenState(t); setUserState(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUserState(null);
    setTokenState(null);
  }, []);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be inside AuthProvider');
  return ctx;
}
