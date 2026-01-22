import axios from 'axios';

// API endpoint - configured via VITE_API_URL in .env
// Fallback options:
// - Local: http://localhost:8787/api
// - Azure: https://arttherapy-plus-api.ambitioussand-bc135123.centralus.azurecontainerapps.io/api
// - Cloudflare (legacy): https://arttherapy-plus-api.julienh15.workers.dev/api
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api';

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
      localStorage.removeItem('auth_expires_at');

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
  const responseData = error.response.data || {};
  const serverMessage = responseData.error || responseData.message;
  const serverCode = responseData.code;

  // Client errors (4xx)
  if (status >= 400 && status < 500) {
    if (serverCode === 'CONTENT_POLICY_VIOLATION') {
      return serverMessage || 'Your description was flagged by our safety filters. Please rephrase and try again.';
    }

    switch (status) {
      case 400:
        return serverMessage || 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Your session has expired. Please log in again.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      default:
        return serverMessage || `Unable to ${context}. Please try again.`;
    }
  }

  // Server errors (5xx)
  if (status >= 500) {
    return serverMessage || 'Our servers are experiencing issues. Please try again in a few moments.';
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
    microsoftCallback: (accessToken) =>
      api.post('/auth/microsoft/callback', { access_token: accessToken }),
    verifyToken: (token) =>
      api.post('/auth/verify', {}, token ? {
        headers: { Authorization: `Bearer ${token}` }
      } : undefined),
    logout: () =>
      api.post('/auth/logout')
  },

  // User (Phase 3)
  user: {
    getProfile: () =>
      api.get('/user/profile'),
    updateProfile: (data) =>
      api.put('/user/profile', data),
    uploadAvatar: (imageData) =>
      api.post('/user/avatar', { image: imageData }),
  },

  // Settings
  settings: {
    /**
     * Get available image models and style presets
     * @returns {Promise} - { models: ModelInfo[], styles: StylePresetInfo[], defaultModel, defaultStyle }
     */
    getImageModels: () =>
      api.get('/settings/image-models')
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

  /**
   * Generate image from pain description with optional model, style, and visual options
   * @param {string} description - Pain description to visualize
   * @param {Object} options - Optional generation settings
   * @param {string} options.model - Model ID (dall-e-3, flux-pro, gemini-image)
   * @param {string} options.style - Style preset ID
   * @param {string} options.aspectRatio - Aspect ratio (1:1, 16:9, 9:16, 4:3, 3:4)
   * @param {string} options.colorMood - Color mood (warm, neutral, cool)
   * @param {string} options.detailLevel - Detail level (draft, balanced, max)
   * @param {boolean} options.compareMode - Enable multi-model comparison
   * @returns {Promise} - { success, images[], image_url, prompt_used, model_used, style_used, ... }
   */
  generateImage: async (description, options = {}) => {
    const response = await api.post('/generate/image', {
      description,
      model: options.model,
      style: options.style,
      aspectRatio: options.aspectRatio,
      colorMood: options.colorMood,
      detailLevel: options.detailLevel,
      compareMode: options.compareMode,
    });
    return response.data;
  },

  /**
   * Create a variation of an existing generated image
   * @param {string} imageUrl - URL of the image to create variation from
   * @param {string} adjustment - Adjustment type (warmer, cooler, more_abstract, more_detailed, softer, more_intense, custom)
   * @param {Object} options - Optional settings
   * @param {string} options.customPrompt - Custom prompt for 'custom' adjustment
   * @param {string} options.originalDescription - Original pain description
   * @param {string} options.model - Model ID
   * @returns {Promise} - { success, image_url, prompt_used, adjustment_applied, ... }
   */
  createVariation: async (imageUrl, adjustment, options = {}) => {
    const response = await api.post('/generate/variation', {
      imageUrl,
      adjustment,
      customPrompt: options.customPrompt,
      originalDescription: options.originalDescription,
      model: options.model,
    });
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

// Session Storage Keys
const SESSION_STORAGE_KEYS = {
  CURRENT_GENERATION: 'arttherapy_current_generation',
  VISUAL_OPTIONS: 'arttherapy_visual_options',
};

/**
 * Session storage helpers for persisting generation state across page refreshes
 */
export const sessionHelpers = {
  /**
   * Save current generation to session storage
   * @param {Object} generation - Generation data to save
   */
  saveCurrentGeneration: (generation) => {
    try {
      sessionStorage.setItem(
        SESSION_STORAGE_KEYS.CURRENT_GENERATION,
        JSON.stringify(generation)
      );
    } catch (error) {
      console.warn('Failed to save generation to session storage:', error);
    }
  },

  /**
   * Load current generation from session storage
   * @returns {Object|null} - Saved generation data or null
   */
  loadCurrentGeneration: () => {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEYS.CURRENT_GENERATION);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('Failed to load generation from session storage:', error);
      return null;
    }
  },

  /**
   * Clear current generation from session storage
   */
  clearCurrentGeneration: () => {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEYS.CURRENT_GENERATION);
    } catch (error) {
      console.warn('Failed to clear generation from session storage:', error);
    }
  },

  /**
   * Save visual options to session storage
   * @param {Object} options - Visual options to save
   */
  saveVisualOptions: (options) => {
    try {
      sessionStorage.setItem(
        SESSION_STORAGE_KEYS.VISUAL_OPTIONS,
        JSON.stringify(options)
      );
    } catch (error) {
      console.warn('Failed to save visual options to session storage:', error);
    }
  },

  /**
   * Load visual options from session storage
   * @returns {Object|null} - Saved visual options or null
   */
  loadVisualOptions: () => {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEYS.VISUAL_OPTIONS);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('Failed to load visual options from session storage:', error);
      return null;
    }
  },
};

export default painPlusAPI;
