import axios from 'axios';

// Get API base URL from env, or default to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default api;
