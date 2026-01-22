import { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../common/Button';

/**
 * Model cost tier badges
 */
const COST_TIER_BADGES = {
  high: { label: 'Premium', color: 'bg-amber-100 text-amber-800' },
  medium: { label: 'Standard', color: 'bg-blue-100 text-blue-800' },
  low: { label: 'Free', color: 'bg-green-100 text-green-800' },
};

/**
 * Model info mapping
 */
const MODEL_INFO = {
  'dall-e-3': { name: 'DALL-E 3', costTier: 'high' },
  'flux-pro': { name: 'Flux Pro', costTier: 'medium' },
  'gemini-image': { name: 'Gemini Flash', costTier: 'low' },
};

/**
 * ImageComparison - Grid/carousel for comparing multiple generated images
 * 
 * Used in Compare Mode to display images from multiple models side by side.
 * Allows user to select which image to continue with.
 */
const ImageComparison = ({
  images = [],
  selectedIndex = 0,
  onSelect,
  onContinue,
  className = '',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (images.length === 0) {
    return null;
  }

  // Single image - don't show comparison UI
  if (images.length === 1) {
    return (
      <div className={className}>
        <img
          src={images[0].url}
          alt="Generated artwork"
          className="w-full rounded-xl"
        />
      </div>
    );
  }

  const selectedImage = images[selectedIndex];
  const modelInfo = MODEL_INFO[selectedImage?.model] || { name: selectedImage?.model, costTier: 'medium' };
  const badge = COST_TIER_BADGES[modelInfo.costTier];

  return (
    <div className={className}>
      {/* Selected Image - Large View */}
      <div className="relative mb-4">
        <img
          src={selectedImage?.url}
          alt={`Generated artwork from ${modelInfo.name}`}
          className="w-full rounded-xl"
        />
        
        {/* Model Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-800 shadow">
            {modelInfo.name}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
            {badge.label}
          </span>
        </div>

        {/* Selected checkmark */}
        <div className="absolute top-3 right-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Thumbnail Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {images.map((image, index) => {
          const isSelected = index === selectedIndex;
          const isHovered = index === hoveredIndex;
          const imgModelInfo = MODEL_INFO[image.model] || { name: image.model, costTier: 'medium' };

          return (
            <button
              key={index}
              onClick={() => onSelect(index)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`
                relative rounded-lg overflow-hidden transition-all duration-200
                ${isSelected
                  ? 'ring-2 ring-primary ring-offset-2'
                  : 'hover:ring-2 hover:ring-gray-300'
                }
              `}
            >
              <img
                src={image.url}
                alt={`Option ${index + 1} from ${imgModelInfo.name}`}
                className="w-full aspect-square object-cover"
              />
              
              {/* Overlay on hover */}
              {(isHovered || isSelected) && (
                <div className={`
                  absolute inset-0 flex items-end justify-center pb-2
                  ${isSelected ? 'bg-primary/20' : 'bg-black/30'}
                `}>
                  <span className="text-xs font-medium text-white bg-black/50 px-2 py-0.5 rounded">
                    {imgModelInfo.name}
                  </span>
                </div>
              )}

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-1 right-1">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Continue Button */}
      <Button
        variant="primary"
        size="medium"
        onClick={() => onContinue(selectedIndex)}
        className="w-full"
      >
        Continue with {modelInfo.name} Image
      </Button>

      {/* Info text */}
      <p className="text-center text-xs text-gray-500 mt-3">
        Select the image you prefer, then continue to save or create variations
      </p>
    </div>
  );
};

ImageComparison.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.shape({
      url: PropTypes.string.isRequired,
      model: PropTypes.string.isRequired,
      style: PropTypes.string,
      promptUsed: PropTypes.string,
    })
  ),
  selectedIndex: PropTypes.number,
  onSelect: PropTypes.func.isRequired,
  onContinue: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default ImageComparison;
