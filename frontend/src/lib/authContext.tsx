'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: number;
  email: string;
  full_name?: string | null;
  is_active: boolean;
  is_superuser: boolean;
  created_at?: string;
}

export interface UserStats {
  total_scans: number;
  most_frequent_disease: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  stats: UserStats | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUserProfile = async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setStats(data.stats);
      } else {
        // Token expired or invalid
        localStorage.removeItem('plant_auth_token');
        setToken(null);
        setUser(null);
        setStats(null);
      }
    } catch {
      // Network error, keep stored token for now
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('plant_auth_token');
    if (savedToken) {
      setToken(savedToken);
      fetchUserProfile(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.detail || 'Login failed. Check your email and password.' };
      }

      localStorage.setItem('plant_auth_token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      await fetchUserProfile(data.access_token);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Could not connect to authentication server.' };
    }
  };

  const register = async (
    email: string,
    password: string,
    fullName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.detail || 'Registration failed. Email may already be registered.' };
      }

      localStorage.setItem('plant_auth_token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      await fetchUserProfile(data.access_token);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Could not connect to authentication server.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('plant_auth_token');
    setToken(null);
    setUser(null);
    setStats(null);
  };

  const refreshUser = async () => {
    if (token) {
      await fetchUserProfile(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        stats,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
