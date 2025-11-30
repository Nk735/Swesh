import React, { createContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, ThemeColors } from './colors';

export type ThemePreference = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = '@swesh_theme_preference';

export interface ThemeContextType {
  theme: ThemePreference;
  effectiveTheme: EffectiveTheme;
  colors: ThemeColors;
  isDark: boolean;
  setTheme: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemePreference>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference from AsyncStorage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeState(savedTheme as ThemePreference);
        }
      } catch (error) {
        console.log('Error loading theme preference:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  // Calculate effective theme based on preference and system setting
  const effectiveTheme: EffectiveTheme = 
    theme === 'system' 
      ? (systemColorScheme === 'dark' ? 'dark' : 'light')
      : theme;

  const isDark = effectiveTheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  // Set theme and persist to AsyncStorage
  const setTheme = useCallback(async (newTheme: ThemePreference) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.log('Error saving theme preference:', error);
    }
  }, []);

  // Don't render until theme is loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, colors, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export { ThemeContext };
