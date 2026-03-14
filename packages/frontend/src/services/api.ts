import axios, { type AxiosError, type AxiosInstance } from 'axios';
import { showToastGlobal } from '../contexts/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api/v1' : 'http://localhost:5000/api/v1');

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - Add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle errors
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<{ error?: { message?: string } }>) => {
        if (error.response?.status === 401) {
          // Only redirect if user had a token (session expired), not on login failures
          const hadToken = localStorage.getItem('accessToken');
          if (hadToken) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
          }
        } else if (error.response) {
          const message = error.response.data?.error?.message || 'Something went wrong';
          showToastGlobal(message);
        } else if (error.request) {
          showToastGlobal('Network error. Please check your connection.');
        }
        return Promise.reject(error);
      }
    );
  }

  getInstance() {
    return this.api;
  }
}

const apiService = new ApiService();
export default apiService.getInstance();
