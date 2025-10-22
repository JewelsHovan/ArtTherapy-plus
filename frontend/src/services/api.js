import axios from 'axios';

// Use Cloudflare Worker API endpoint
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://arttherapy-plus-api.julienh15.workers.dev/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add JWT to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 (expired token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear and redirect
      localStorage.removeItem('auth_token');
      window.location.href = '/register';
    }
    return Promise.reject(error);
  }
);

export const painPlusAPI = {
  // Authentication
  auth: {
    microsoftCallback: (code) =>
      api.post('/auth/microsoft/callback', { code }),
    verifyToken: () =>
      api.post('/auth/verify'),
    logout: () =>
      api.post('/auth/logout')
  },

  // User (Phase 3)
  user: {
    getProfile: () =>
      api.get('/user/profile'),
    updateProfile: (data) =>
      api.put('/user/profile', data)
  },

  // Gallery (Phase 2 - will update these)
  gallery: {
    save: (item) =>
      api.post('/gallery', item),
    getAll: (limit = 50, offset = 0) =>
      api.get(`/gallery?limit=${limit}&offset=${offset}`),
    delete: (id) =>
      api.delete(`/gallery/${id}`)
  },

  // Journal (Phase 3)
  journal: {
    create: (entry) =>
      api.post('/journal', entry),
    getAll: (limit = 20, offset = 0) =>
      api.get(`/journal?limit=${limit}&offset=${offset}`)
  },

  // Existing OpenAI endpoints (keep as-is for now)
  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // Generate image from pain description
  generateImage: async (description) => {
    const response = await api.post('/generate/image', { description });
    return response.data;
  },

  // Generate creative prompts
  generatePrompt: async (description) => {
    const response = await api.post('/generate/prompt', { description });
    return response.data;
  },

  // Generate reflection questions
  reflect: async (description, imageContext = '') => {
    const response = await api.post('/reflect', {
      description,
      image_context: imageContext
    });
    return response.data;
  },

  // Get inspirational prompts
  getInspiration: async () => {
    const response = await api.get('/inspire');
    return response.data;
  },

  // Edit/transform image based on pain description
  editImage: async ({ image, description }) => {
    const response = await api.post('/edit/image', {
      image,
      description
    });
    return response.data;
  }
};

export default painPlusAPI;