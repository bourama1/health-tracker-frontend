import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;

if (!API_BASE_URL) {
  console.error(
    'REACT_APP_API_URL is not set! API calls will fail in production.'
  );
}

const api = axios.create({
  baseURL: API_BASE_URL || 'http://localhost:5000',
  withCredentials: true,
});

export default api;
