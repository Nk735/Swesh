// API Client Configuration
const DEVELOPMENT_URL = 'http://localhost:3000';
const PRODUCTION_URL = 'https://swesh-backend.onrender.com';

const API_BASE_URL = process.env.NODE_ENV === 'production' ? PRODUCTION_URL : DEVELOPMENT_URL;

export default API_BASE_URL;