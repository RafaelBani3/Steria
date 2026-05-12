import { create } from 'zustand';
import api from '../services/api';

const extractErrorMessage = (error, fallback) => {
  if (error.response?.data?.error) {
    const errData = error.response.data.error;
    if (typeof errData === 'object') {
      return String(errData.message || errData.code || JSON.stringify(errData));
    }
    return String(errData);
  }
  if (error.message) return String(error.message);
  return fallback;
};

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('steria_user')) || null,
  token: localStorage.getItem('steria_token') || null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('steria_token', token);
      localStorage.setItem('steria_user', JSON.stringify(user));

      set({ user, token, isLoading: false });
      return true;
    } catch (error) {
      console.error('Login error:', error);
      set({ error: extractErrorMessage(error, 'Login failed'), isLoading: false });
      return false;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/auth/register', { name, email, password });
      set({ isLoading: false });
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      set({ error: extractErrorMessage(error, 'Registration failed'), isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('steria_token');
    localStorage.removeItem('steria_user');
    set({ user: null, token: null });
  },
}));
