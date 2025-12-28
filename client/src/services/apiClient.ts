import axios, { AxiosHeaders } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL di produzione Railway
const PRODUCTION_URL = 'https://swesh-backend.onrender.com';

// Rileva automaticamente il base URL
const getBaseUrl = (): string => {
  // In sviluppo, usa sempre localhost
  if (__DEV__) {
    console.log('[API] Dev mode - uso localhost:3000');
    return 'http://localhost:3000';
    //const LOCAL_IP = '192.168.1.9'; // <-- CAMBIA CON IL TUO IP LOCALE
    //console.log(`[API] Dev mode - uso ${LOCAL_IP}:3000`);
    //return `http://${LOCAL_IP}:3000`;
  }

  // In produzione, usa Railway
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

  if (! config.headers || !(config.headers instanceof AxiosHeaders)) {
    config. headers = new AxiosHeaders(config.headers);
  }

  if (token) {
    (config.headers as AxiosHeaders).set('Authorization', `Bearer ${token}`);
  } else {
    (config.headers as AxiosHeaders).delete('Authorization');
  }

  (config.headers as AxiosHeaders).set('Accept', 'application/json');

  return config;
});

api.interceptors.response.use(
  response => response,
  async (error) => {
    if (error.response?. status === 401) {
      await AsyncStorage.removeItem('auth_token');
      if (__DEV__) console.log('[API] 401 → token rimosso');
    } else if (! error.response) {
      console.error('[API] Network Error:', error. message);
    }
    return Promise. reject(error);
  }
);

// Onboarding API
export async function completeOnboarding(data: {
  age: number;
  gender: 'male' | 'female' | 'prefer_not_to_say';
  feedPreference: 'male' | 'female' | 'all';
}) {
  const response = await api.post('/auth/complete-onboarding', data);
  return response.data;
}

// Feed Preferences API
export async function updateFeedPreferences(showGender: 'male' | 'female' | 'all') {
  const response = await api.patch('/users/me/preferences', { showGender });
  return response.data;
}

export default api;