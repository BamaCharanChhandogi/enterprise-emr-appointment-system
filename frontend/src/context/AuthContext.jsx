import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('emr_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('emr_access_token');
    if (token) {
      api.get('/auth/me')
        .then(res => {
          if (res.data?.success && res.data?.data?.user) {
            setUser(res.data.data.user);
            localStorage.setItem('emr_user', JSON.stringify(res.data.data.user));
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.success) {
      const { user: userData, accessToken, refreshToken } = res.data.data;
      setUser(userData);
      localStorage.setItem('emr_user', JSON.stringify(userData));
      localStorage.setItem('emr_access_token', accessToken);
      localStorage.setItem('emr_refresh_token', refreshToken);
      return userData;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('emr_refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (e) {
      // Continue client cleanup even if network fails
    } finally {
      setUser(null);
      localStorage.removeItem('emr_user');
      localStorage.removeItem('emr_access_token');
      localStorage.removeItem('emr_refresh_token');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
