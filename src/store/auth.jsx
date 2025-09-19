// src/store/auth.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

// Safe JSON parser: chịu được body rỗng/HTML
async function parseJSONSafe(res) {
  const text = await res.text();
  if (!text) return {};
  try { return JSON.parse(text); }
  catch { return { __raw: text }; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const fetchMe = async () => {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    const data = await parseJSONSafe(res);
    setUser(data.user || null);
  };
  useEffect(() => { fetchMe(); }, []);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await parseJSONSafe(res);
    if (!res.ok) throw new Error(data.error || data.__raw || 'Login failed');
    setUser(data.user);
  };

  const register = async (payload) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await parseJSONSafe(res);
    if (!res.ok) throw new Error(data.error || data.__raw || 'Register failed');
    setUser(data.user);
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
