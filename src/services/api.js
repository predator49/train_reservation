import axios from 'axios';

const API_URL = 'http://localhost:3001/api'; // Update this with your backend URL

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
};

export const seatAPI = {
  getAllSeats: () => api.get('/seats'),
  bookSeats: (seatIds) => api.post('/seats/book', { seatIds }),
  cancelBooking: (seatIds) => api.post('/seats/cancel', { seatIds }),
};

export default api; 