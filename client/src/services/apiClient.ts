import axios, { AxiosHeaders } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// URL di produzione Railway
const PRODUCTION_URL = 'https://swesh-production.up.railway.app';

// Rileva automaticamente il base URL
const getBaseUrl = (): string => {
  // 1. Se definito in config/env, usa quello (override manuale)
  const configUrl = (Constants.expoConfig?.extra as { API_BASE_URL?: string })?.API_BASE_URL
    || (Constants as unknown as { manifest2?: { extra?: { API_BASE_URL?: string } } })?.manifest2?.extra?.API_BASE_URL;
  
  if (configUrl && configUrl !== 'https://swesh-production.up.railway.app') {
    return configUrl;
  }

  // 2. In sviluppo (__DEV__), usa l'IP del server Expo
  if (__DEV__) {
    const debuggerHost = Constants.expoConfig?.hostUri 
      || (Constants as unknown as { manifest?: { debuggerHost?: string } })?.manifest?.debuggerHost
      || (Constants as unknown as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } })?.manifest2?.extra?.expoGo?.debuggerHost;
    
    if (debuggerHost) {
      const ip = debuggerHost.split(':')[0];
      console.log(`[API] Dev mode - IP rilevato: ${ip}`);
      return `http://${ip}:3000`;
    }
    
    console.warn('[API] Impossibile rilevare IP, uso localhost');
    return 'http://localhost:3000';
  }

  // 3. In produzione, usa Railway
  return PRODUCTION_URL;
};

const BASE_URL = getBaseUrl();

console.log(`[API] Ambiente: ${__DEV__ ? 'DEVELOPMENT' : 'PRODUCTION'}`);
console.log(`[API] Base URL: ${BASE_URL}`);

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
});

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
    } else if (!error.response) {
      console.error('[API] Network Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;