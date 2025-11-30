import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, completeOnboarding as completeOnboardingApi } from '../services/apiClient';
import { router } from 'expo-router';
import { Gender, FeedGenderPreference } from '../types';

type User = { 
  id: string; 
  email: string; 
  nickname: string; 
  avatarUrl?: string; 
  avatarKey?: string; 
  completedExchangesCount?: number;
  age?: number;
  gender?: Gender;
  feedPreferences?: {
    showGender: FeedGenderPreference | null;
  };
  onboarding?: {
    completed: boolean;
    completedAt?: string;
  };
};
type ApiUser = { 
  _id: string; 
  email: string; 
  nickname: string; 
  avatarUrl?: string; 
  avatarKey?: string; 
  completedExchangesCount?: number;
  age?: number;
  gender?: Gender;
  feedPreferences?: {
    showGender: FeedGenderPreference | null;
  };
  onboarding?: {
    completed: boolean;
    completedAt?: string;
  };
};

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  onboardingCompleted: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  completeOnboarding: (data: { age: number; gender: Gender; feedPreference: FeedGenderPreference }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeUser(u: ApiUser): User {
  return { 
    id: u._id, 
    email: u.email, 
    nickname: u.nickname, 
    avatarUrl: u.avatarUrl, 
    avatarKey: u.avatarKey, 
    completedExchangesCount: u.completedExchangesCount,
    age: u.age,
    gender: u.gender,
    feedPreferences: u.feedPreferences,
    onboarding: u.onboarding
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStoredSession = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        const me = await api.get('/auth/me');
        setUser(normalizeUser(me.data));
      }
    } catch {
      await AsyncStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStoredSession(); }, [loadStoredSession]);

  const completeAuth = async (token: string) => {
    await AsyncStorage.setItem('auth_token', token);
    const me = await api.get('/auth/me');
    setUser(normalizeUser(me.data));
  };

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    await completeAuth(data.token);
  };

  const register = async (email: string, password: string, nickname: string) => {
    const { data } = await api.post('/auth/register', { email, password, nickname });
    await completeAuth(data.token);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('auth_token');
    setUser(null);
    router.replace('/login');
  };

  const refreshMe = async () => {
    if (!user) return;
    const { data } = await api.get('/auth/me');
    setUser(normalizeUser(data));
  };

  const completeOnboarding = async (data: { age: number; gender: Gender; feedPreference: FeedGenderPreference }) => {
    const result = await completeOnboardingApi(data);
    setUser(normalizeUser(result.user));
  };

  const onboardingCompleted = user?.onboarding?.completed ?? false;

  return <AuthContext.Provider value={{ user, loading, onboardingCompleted, login, register, logout, refreshMe, completeOnboarding }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};