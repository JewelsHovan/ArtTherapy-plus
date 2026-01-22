import { useRef } from 'react';
import PropTypes from 'prop-types';
import { processImageForUpload } from '../../utils/imageCompression';

const AvatarUploader = ({
  currentAvatarUrl,
  userName = 'User',
  onUpload,
  onError,
  isLoading = false,
  size = 'medium',
  className = '',
}) => {
  const fileInputRef = useRef(null);

  const sizeStyles = {
    small: 'w-16 h-16 text-xl',
    medium: 'w-24 h-24 text-3xl',
    large: 'w-32 h-32 text-4xl',
  };

  const sizeClass = sizeStyles[size] || sizeStyles.medium;
  const initial = userName?.charAt(0)?.toUpperCase() || 'U';

  const handleClick = () => {
    if (!isLoading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be selected again
    e.target.value = '';

    try {
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        onError?.('Please select a PNG, JPEG, or WebP image');
        return;
      }

      // Validate file size (max 10MB before compression)
      const maxSizeMB = 10;
      if (file.size > maxSizeMB * 1024 * 1024) {
        onError?.(`Image too large. Maximum size is ${maxSizeMB}MB`);
        return;
      }

      // Process image (compress and resize)
      const processed = await processImageForUpload(file, {
        maxSize: 512, // Smaller size for avatars
        quality: 0.85,
        maxFileSizeMB: 2,
      });

      // Call upload handler with processed image data
      onUpload?.(processed);
    } catch (err) {
      console.error('Avatar processing error:', err);
      onError?.(err.message || 'Failed to process image');
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload avatar"
      />

      {/* Avatar container */}
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={`${sizeClass} relative rounded-full overflow-hidden flex-shrink-0 bg-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all ${
          isLoading ? 'cursor-wait' : 'cursor-pointer group'
        }`}
        aria-label={isLoading ? 'Uploading avatar...' : 'Change avatar'}
      >
        {/* Avatar image or initial */}
        {currentAvatarUrl ? (
          <img
            src={currentAvatarUrl}
            alt={`${userName}'s avatar`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold">
            {initial}
          </div>
        )}

        {/* Hover overlay with camera icon */}
        {!isLoading && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 flex items-center justify-center transition-all">
            <svg
              className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        )}

        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <svg
              className="animate-spin h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
      </button>

      {/* Edit hint text below */}
      {!isLoading && (
        <p className="text-xs text-gray-500 text-center mt-1">
          Click to change
        </p>
      )}
    </div>
  );
};

AvatarUploader.propTypes = {
  currentAvatarUrl: PropTypes.string,
  userName: PropTypes.string,
  onUpload: PropTypes.func,
  onError: PropTypes.func,
  isLoading: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  className: PropTypes.string,
};

export default AvatarUploader;
