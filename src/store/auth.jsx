// src/store/auth.jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

// Nếu API cùng origin (khuyên dùng), để trống để gọi '/api/...'
const API = import.meta.env.VITE_API_ORIGIN || '';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  // Rehydrate phiên từ cookie khi load app / reload trang
  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const r = await fetch(`${API}/api/auth/me`, { credentials: 'include' });
        const data = await r.json();
        if (!canceled) setUser(data.user ?? null);
      } catch {
        if (!canceled) setUser(null);
      } finally {
        if (!canceled) setBooting(false);
      }
    })();
    return () => { canceled = true; };
  }, []);

  const login = async (email, password) => {
    const r = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!r.ok) throw new Error('Login failed');
    const data = await r.json();
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const r = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error('Register failed');
    const data = await r.json();
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await fetch(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    setUser(null);
  };

  const value = useMemo(() => ({ user, booting, login, register, logout }), [user, booting]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
