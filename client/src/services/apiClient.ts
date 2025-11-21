import axios, { AxiosHeaders } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Recupera base URL dalle extra (app.config.ts)
const BASE_URL = (Constants.expoConfig?.extra as { API_BASE_URL?: string })?.API_BASE_URL
  || (Constants as any)?.manifest2?.extra?.API_BASE_URL
  || undefined;

if (!BASE_URL) {
  console.warn('[API] Nessuna API_BASE_URL definita. Imposta EXPO_PUBLIC_API_BASE_URL o extra.API_BASE_URL.');
}

export const api = axios.create({
  baseURL: BASE_URL ? `${BASE_URL}/api` : undefined,
  timeout: 10000,
});

if (__DEV__) {
  console.log('[API] Base URL attiva:', BASE_URL);
}

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');

  // Convert headers to AxiosHeaders if not already
  if (!config.headers || !(config.headers instanceof AxiosHeaders)) {
    config.headers = new AxiosHeaders(config.headers);
  }

  // Manage Authorization header based on token
  if (token) {
    (config.headers as AxiosHeaders).set('Authorization', `Bearer ${token}`);
  } else {
    (config.headers as AxiosHeaders).delete('Authorization');
  }

  // Set default headers
  (config.headers as AxiosHeaders).set('Accept', 'application/json');

  return config;
});

api.interceptors.response.use(
  response => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('auth_token');
      if (__DEV__) console.log('[API] 401 → token rimosso');
      // TODO: redirect a login se necessario
    } else if (!error.response) {
      console.warn('[API] Errore rete/timeout:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;