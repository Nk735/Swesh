import axios, { AxiosHeaders } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const BASE_URL = (Constants.expoConfig?.extra as { API_BASE_URL?: string })?.API_BASE_URL ?? 'https://swesh-production.up.railway.app';

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 10000, // Timeout configurabile
});
console.log('API Base URL:', BASE_URL);

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
    // Handle 401 globally (e.g., logout)
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('auth_token');
      // Add logic to redirect to login, if needed
    }
    return Promise.reject(error);
  }
);