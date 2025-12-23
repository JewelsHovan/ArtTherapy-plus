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
      const currentPath = window.location.pathname;
      const isAuthPage = ['/register', '/'].includes(currentPath);

      // Clear token
      localStorage.removeItem('auth_token');

      // Don't redirect if already on auth page
      if (!isAuthPage) {
        // Save current location to redirect back after login
        sessionStorage.setItem('auth_redirect', currentPath);

        // Dispatch event for UI notification
        window.dispatchEvent(new CustomEvent('auth:expired', {
          detail: { message: 'Your session has expired. Please log in again.' }
        }));

        // Delay redirect to allow user to see message
        setTimeout(() => {
          window.location.href = '/register';
        }, 1500);
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Sleep utility for delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Resolves after the delay
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Checks if an error should trigger a retry
 * @param {Error} error - The error to check
 * @returns {boolean} - True if the error is retryable
 */
const isRetryableError = (error) => {
  // Network error (no response)
  if (!error.response) return true;

  // 5xx server errors
  const status = error.response.status;
  return status >= 500 && status < 600;
};

/**
 * Wraps an async function with retry logic using exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.baseDelay - Base delay in ms for exponential backoff (default: 1000)
 * @returns {Promise} - Result of the function or throws after max retries
 *
 * Usage example:
 * const result = await withRetry(() => api.get('/some-endpoint'));
 */
export const withRetry = async (fn, options = {}) => {
  const { maxRetries = 3, baseDelay = 1000 } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      const isRetryable = isRetryableError(error);

      if (isLastAttempt || !isRetryable) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt); // 1s, 2s, 4s
      await sleep(delay);
    }
  }
};

/**
 * Generates a user-friendly error message based on error type
 * @param {Error} error - Axios error object
 * @param {string} context - What action was being attempted (e.g., "generate image")
 * @returns {string} - User-friendly error message
 *
 * Usage example:
 * catch (error) {
 *   setError(getErrorMessage(error, 'generate your artwork'));
 * }
 */
export const getErrorMessage = (error, context = 'complete this action') => {
  // Network error (no response from server)
  if (!error.response) {
    return `Unable to ${context}. Please check your internet connection and try again.`;
  }

  const status = error.response.status;

  // Client errors (4xx)
  if (status >= 400 && status < 500) {
    switch (status) {
      case 400:
        return error.response.data?.message || 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Your session has expired. Please log in again.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      default:
        return error.response.data?.message || `Unable to ${context}. Please try again.`;
    }
  }

  // Server errors (5xx)
  if (status >= 500) {
    return 'Our servers are experiencing issues. Please try again in a few moments.';
  }

  // Fallback
  return `Failed to ${context}. Please try again.`;
};

export const painPlusAPI = {
  // Authentication
  auth: {
    signup: (email, password, name) =>
      api.post('/auth/signup', { email, password, name }),
    login: (email, password) =>
      api.post('/auth/login', { email, password }),
    microsoftCallback: (code, redirectUri) =>
      api.post('/auth/microsoft/callback', { code, redirect_uri: redirectUri }),
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