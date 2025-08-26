import axios from 'axios';

// Use Cloudflare Worker API endpoint
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://arttherapy-plus-api.julienh15.workers.dev/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const painPlusAPI = {
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
  }
};

export default api;