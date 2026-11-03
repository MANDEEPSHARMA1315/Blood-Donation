import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('blood_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [donorProfile, setDonorProfile] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('blood_token'));
  const [loading, setLoading] = useState(true);

  // Check auth on initial mount
  useEffect(() => {
    const fetchMe = async () => {
      const storedToken = localStorage.getItem('blood_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.user);
          setDonorProfile(res.data.donorProfile);
          localStorage.setItem('blood_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.warn('Session expired or invalid:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      setDonorProfile(res.data.donorProfile);
      localStorage.setItem('blood_token', res.data.token);
      localStorage.setItem('blood_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      setDonorProfile(res.data.donorProfile);
      localStorage.setItem('blood_token', res.data.token);
      localStorage.setItem('blood_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setDonorProfile(null);
    localStorage.removeItem('blood_token');
    localStorage.removeItem('blood_user');
  };

  // Quick 1-click demo switcher
  const switchRoleDemo = async (role) => {
    const roleCredentials = {
      admin: { email: 'admin@blooddonation.org', password: 'Password123!' },
      coordinator: { email: 'coordinator@blooddonation.org', password: 'Password123!' },
      volunteer: { email: 'volunteer@blooddonation.org', password: 'Password123!' },
      donor: { email: 'donor@blooddonation.org', password: 'Password123!' },
    };

    const creds = roleCredentials[role];
    if (creds) {
      return await login(creds.email, creds.password);
    }
  };

  const updateProfile = async (formData) => {
    const res = await api.put('/auth/profile', formData);
    if (res.data.success) {
      setUser(res.data.user);
      setDonorProfile(res.data.donorProfile);
      localStorage.setItem('blood_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const value = {
    user,
    donorProfile,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
    switchRoleDemo,
    updateProfile,
    setUser,
    setDonorProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
