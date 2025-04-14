import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const seatAPI = {
  getAllSeats: () => api.get('/seats'),
  bookSeats: (seatIds) => api.post('/seats/book', { seatIds }),
  resetSeats: () => api.post('/seats/reset'),
  unselectSeats: (seatIds) => api.post('/seats/unselect', { seatIds }),
  resetSelectedSeats: (seatIds) => api.post('/seats/reset-selected', { seatIds }),
  resetDatabase: () => api.post('/seats/reset-database')
};

export default api; 