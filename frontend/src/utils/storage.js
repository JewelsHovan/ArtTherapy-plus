import { painPlusAPI } from '../services/api';

const GALLERY_STORAGE_KEY = 'painplus_gallery';

// Check if user is authenticated
const isAuthenticated = () => !!localStorage.getItem('auth_token');

export const galleryStorage = {
  getAll: async () => {
    if (!isAuthenticated()) {
      // Fallback to localStorage for unauthenticated users
      try {
        const data = localStorage.getItem(GALLERY_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
      } catch (error) {
        console.error('Error loading local gallery:', error);
        return [];
      }
    }

    try {
      const response = await painPlusAPI.gallery.getAll();
      return response.data.items || [];
    } catch (error) {
      console.error('Error loading gallery from API:', error);
      return [];
    }
  },

  save: async (imageData) => {
    if (!isAuthenticated()) {
      // Fallback to localStorage for unauthenticated users
      try {
        const data = localStorage.getItem(GALLERY_STORAGE_KEY);
        const gallery = data ? JSON.parse(data) : [];
        const newItem = {
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          ...imageData
        };
        gallery.unshift(newItem);
        localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(gallery));
        return newItem;
      } catch (error) {
        console.error('Error saving to local gallery:', error);
        return null;
      }
    }

    try {
      const response = await painPlusAPI.gallery.save({
        image_url: imageData.imageUrl,
        description: imageData.description,
        prompt_used: imageData.promptUsed,
        mode: imageData.mode || 'create'
      });
      return response.data.item;
    } catch (error) {
      console.error('Error saving to gallery API:', error);
      return null;
    }
  },

  delete: async (id) => {
    if (!isAuthenticated()) {
      try {
        const data = localStorage.getItem(GALLERY_STORAGE_KEY);
        const gallery = data ? JSON.parse(data) : [];
        const filtered = gallery.filter(item => item.id !== id);
        localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(filtered));
        return true;
      } catch (error) {
        console.error('Error deleting from local gallery:', error);
        return false;
      }
    }

    try {
      await painPlusAPI.gallery.delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting from gallery API:', error);
      return false;
    }
  },

  getById: async (id) => {
    const gallery = await galleryStorage.getAll();
    return gallery.find(item => item.id === id);
  },

  clear: () => {
    try {
      localStorage.removeItem(GALLERY_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing gallery:', error);
      return false;
    }
  }
};
