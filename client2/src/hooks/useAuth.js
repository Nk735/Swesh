import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authService from '../services/auth';

// Create context
const AuthContext = createContext({});

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const currentUser = await authService.getMe(token);
          setUser(currentUser);
        }
      } catch (e) {
        console.error('Error loading user', e);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // Login
  const login = async (email, password) => {
    const data = await authService.login(email, password);
    await AsyncStorage.setItem('token', data.token);
    setUser({ id: data._id, email: data.email, nickname: data.nickname });
  };

  // Register
  const register = async (email, password, nickname) => {
    const data = await authService.register(email, password, nickname);
    await AsyncStorage.setItem('token', data.token);
    setUser({ id: data._id, email: data.email, nickname: data.nickname });
  };

  // Logout
  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  return useContext(AuthContext);
};