const GALLERY_STORAGE_KEY = 'painplus_gallery';

export const galleryStorage = {
  getAll: () => {
    try {
      const data = localStorage.getItem(GALLERY_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading gallery:', error);
      return [];
    }
  },

  save: (imageData) => {
    try {
      const gallery = galleryStorage.getAll();
      const newItem = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...imageData
      };
      gallery.unshift(newItem);
      localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(gallery));
      return newItem;
    } catch (error) {
      console.error('Error saving to gallery:', error);
      return null;
    }
  },

  delete: (id) => {
    try {
      const gallery = galleryStorage.getAll();
      const filtered = gallery.filter(item => item.id !== id);
      localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error deleting from gallery:', error);
      return false;
    }
  },

  getById: (id) => {
    const gallery = galleryStorage.getAll();
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