// src/services/auth.js
import axios from 'axios';

// ⚠️ Inserisci qui l'IP locale del tuo PC (visibile con `ipconfig` o `ifconfig`)
// Non usare "localhost" perché Expo gira sul telefono/emulatore.
const API_URL = "http://192.168.1.100:5000/api/auth";

// Login
export const login = async (email, password) => {
  const res = await axios.post(`${API_URL}/login`, { email, password });
  return res.data;
};

// Register
export const register = async (email, password, nickname) => {
  const res = await axios.post(`${API_URL}/register`, { email, password, nickname });
  return res.data;
};

// Get current user (me)
export const getMe = async (token) => {
  const res = await axios.get(`${API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};
