// frontend/src/services/api.js
import axios from 'axios';
import { auth } from './firebase';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests (except for public endpoints)
api.interceptors.request.use(
  async (config) => {
    // Skip auth for public endpoints
    const publicEndpoints = ['/auth/register', '/auth/login', '/auth/verify-email'];
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      config.url?.includes(endpoint)
    );

    if (!isPublicEndpoint) {
      const user = auth.currentUser;
      if (user) {
        try {
          const token = await user.getIdToken();
          config.headers.Authorization = `Bearer ${token}`;
        } catch (error) {
          console.error('Error getting auth token:', error);
        }
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error cases
    if (error.response) {
      // Server responded with error
      const status = error.response.status;
      const message = error.response.data?.error || error.response.data?.message;

      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          break;
        case 403:
          // Forbidden
          console.error('Access forbidden:', message);
          break;
        case 404:
          // Not found
          console.error('Resource not found:', message);
          break;
        case 500:
          // Server error
          console.error('Server error:', message);
          break;
        default:
          console.error('API error:', message);
      }
    } else if (error.request) {
      // Request made but no response
      console.error('No response from server. Please check your connection.');
    } else {
      // Error in request setup
      console.error('Error setting up request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;