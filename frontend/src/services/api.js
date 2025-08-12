import axios from 'axios';

// Using relative URL since we have Vite proxy configured
const API_BASE_URL = '/api';

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