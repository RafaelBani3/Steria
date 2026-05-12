import { create } from 'zustand';
import api from '../services/api';

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
      const errorMessage = error.response?.data?.error;
      const finalMessage = typeof errorMessage === 'object' 
        ? (errorMessage.message || JSON.stringify(errorMessage))
        : (errorMessage || 'Login failed');
      
      set({ error: finalMessage, isLoading: false });
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
      const errorMessage = error.response?.data?.error;
      const finalMessage = typeof errorMessage === 'object' 
        ? (errorMessage.message || JSON.stringify(errorMessage))
        : (errorMessage || 'Registration failed');
        
      set({ error: finalMessage, isLoading: false });
      return false;
    }

  },

  logout: () => {
    localStorage.removeItem('steria_token');
    localStorage.removeItem('steria_user');
    set({ user: null, token: null });
  }
}));
