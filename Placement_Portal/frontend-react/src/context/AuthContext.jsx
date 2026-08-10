/**
 * src/context/AuthContext.jsx
 *
 * Authentication Context Provider managing login state, user profiles, and JWT persistence.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await client.get('/auth/me');
        setUser(res.data.data.user);
      } catch (err) {
        console.error('Failed to load authenticated user profile:', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  const login = async (email, password) => {
    const res = await client.post('/auth/login', { email, password });
    const { user: userData, token } = res.data.data;
    localStorage.setItem('token', token);
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password) => {
    const res = await client.post('/auth/register', { name, email, password });
    const { user: userData, token } = res.data.data;
    localStorage.setItem('token', token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
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
