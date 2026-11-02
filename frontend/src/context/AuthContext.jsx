import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('fraudshield_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('fraudshield_token');
      if (token) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('fraudshield_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('Session expired or invalid token:', err.message);
          localStorage.removeItem('fraudshield_token');
          localStorage.removeItem('fraudshield_user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.success && res.token) {
      localStorage.setItem('fraudshield_token', res.token);
      localStorage.setItem('fraudshield_user', JSON.stringify(res.user));
      setUser(res.user);
      return res.user;
    }
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    if (res.success && res.token) {
      localStorage.setItem('fraudshield_token', res.token);
      localStorage.setItem('fraudshield_user', JSON.stringify(res.user));
      setUser(res.user);
      return res.user;
    }
  };

  const logout = () => {
    localStorage.removeItem('fraudshield_token');
    localStorage.removeItem('fraudshield_user');
    setUser(null);
    window.location.href = '/login';
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
