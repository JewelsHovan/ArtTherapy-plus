/**
 * Image compression and processing utilities
 */

/**
 * Compress and resize an image to fit within specified dimensions
 * DALL-E 2 requires square images less than 4MB
 * 
 * @param {string} base64String - Base64 encoded image
 * @param {number} maxSize - Maximum width/height (default 1024)
 * @param {number} quality - Compression quality 0-1 (default 0.9)
 * @returns {Promise<string>} Compressed base64 image
 */
export const compressImage = async (base64String, maxSize = 1024, quality = 0.9) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = function() {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        // Make it square by adding padding (DALL-E 2 requirement)
        const size = Math.max(width, height);
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        
        // Fill with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        
        // Center the image
        const x = (size - width) / 2;
        const y = (size - height) / 2;
        ctx.drawImage(img, x, y, width, height);

        // Convert to base64 with compression
        let compressedBase64 = canvas.toDataURL('image/png', quality);
        
        // If still too large, reduce quality iteratively
        let currentQuality = quality;
        const maxBase64Size = 4 * 1024 * 1024 * 0.75; // 75% of 4MB for base64 overhead
        
        while (compressedBase64.length > maxBase64Size && currentQuality > 0.1) {
          currentQuality -= 0.1;
          compressedBase64 = canvas.toDataURL('image/jpeg', currentQuality);
        }
        
        resolve(compressedBase64);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = function() {
      reject(new Error('Failed to load image'));
    };
    
    img.src = base64String;
  });
};

/**
 * Convert File to base64 string
 * 
 * @param {File} file - File object to convert
 * @returns {Promise<string>} Base64 encoded string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Process an image file for upload
 * Handles compression if needed
 * 
 * @param {File} file - Image file to process
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Processed image data
 */
export const processImageForUpload = async (file, options = {}) => {
  const {
    maxSize = 1024,
    quality = 0.9,
    maxFileSizeMB = 3.5
  } = options;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file');
  }

  const originalSizeMB = file.size / (1024 * 1024);
  
  // Convert to base64
  let imageData = await fileToBase64(file);
  
  // Check if compression is needed
  let compressed = false;
  let finalSizeMB = originalSizeMB;
  
  if (originalSizeMB > maxFileSizeMB) {
    imageData = await compressImage(imageData, maxSize, quality);
    compressed = true;
    // Estimate compressed size (base64 is ~33% larger than binary)
    finalSizeMB = (imageData.length * 0.75) / (1024 * 1024);
  } else {
    // Still process to ensure square format for DALL-E 2
    imageData = await compressImage(imageData, maxSize, 1.0);
  }

  return {
    data: imageData,
    originalName: file.name,
    originalSizeMB: originalSizeMB.toFixed(2),
    finalSizeMB: finalSizeMB.toFixed(2),
    compressed
  };
};

/**
 * Validate image dimensions
 * 
 * @param {string} base64String - Base64 encoded image
 * @returns {Promise<Object>} Image dimensions
 */
export const getImageDimensions = (base64String) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = function() {
      resolve({
        width: img.width,
        height: img.height,
        aspectRatio: img.width / img.height
      });
    };
    img.src = base64String;
  });
};