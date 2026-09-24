'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; studentIdNumber?: string; phoneNumber?: string }) => Promise<void>;
  logout: () => void;
  switchPersona: (email: string, roleDescription: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('cr_token');
    const savedUser = localStorage.getItem('cr_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Refresh me from backend to ensure active session
        api.get<User>('/auth/me')
          .then((res) => {
            setUser(res.data);
            localStorage.setItem('cr_user', JSON.stringify(res.data));
          })
          .catch(() => {
            // Token expired or invalid
            logout();
          })
          .finally(() => setLoading(false));
      } catch (e) {
        logout();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post<{ user: User; token: string }>('/auth/login', {
        email: email.trim(),
        password
      });

      const { user: loggedInUser, token: authToken } = res.data;
      setToken(authToken);
      setUser(loggedInUser);
      localStorage.setItem('cr_token', authToken);
      localStorage.setItem('cr_user', JSON.stringify(loggedInUser));
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    studentIdNumber?: string;
    phoneNumber?: string;
  }) => {
    setLoading(true);
    try {
      const res = await api.post<{ user: User; token: string }>('/auth/register', data);
      const { user: registeredUser, token: authToken } = res.data;
      setToken(authToken);
      setUser(registeredUser);
      localStorage.setItem('cr_token', authToken);
      localStorage.setItem('cr_user', JSON.stringify(registeredUser));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('cr_token');
    localStorage.removeItem('cr_user');
  };

  const switchPersona = async (email: string, roleDescription: string) => {
    let password = 'Student@123';
    if (email.includes('admin')) {
      password = 'Admin@123';
    } else if (email.includes('staff')) {
      password = 'Staff@123';
    }
    await login(email, password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        switchPersona
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
