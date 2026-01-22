import { useState } from 'react';
import PropTypes from 'prop-types';
import AspectRatioSelector from './AspectRatioSelector';
import ColorMoodSlider from './ColorMoodSlider';
import DetailLevelSelector from './DetailLevelSelector';
import { DEFAULT_OPTIONS } from './constants';

/**
 * Check if options are at default values
 */
const isDefaultOptions = (options) => {
  return (
    options.aspectRatio === DEFAULT_OPTIONS.aspectRatio &&
    options.colorMood === DEFAULT_OPTIONS.colorMood &&
    options.detailLevel === DEFAULT_OPTIONS.detailLevel
  );
};

/**
 * VisualControlsPanel - Collapsible panel for visual generation options
 * 
 * Contains AspectRatioSelector, ColorMoodSlider, and DetailLevelSelector.
 * Collapsed by default - shows "Customized" badge when non-defaults are selected.
 * Users can click "Visualize" without configuring anything.
 */
const VisualControlsPanel = ({
  options,
  onChange,
  disabled = false,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasCustomization = !isDefaultOptions(options);

  const handleOptionChange = (key, value) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <div className={`bg-gray-50 rounded-xl ${className}`}>
      {/* Header - Always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-100 rounded-xl transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-medium text-gray-700">Visual Options</span>
          {hasCustomization && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary text-white rounded-full">
              Customized
            </span>
          )}
        </div>
        <span className="text-sm text-gray-500">
          {isExpanded ? 'Hide' : 'Optional'}
        </span>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-5 animate-fadeIn">
          <div className="border-t border-gray-200 pt-4" />
          
          <AspectRatioSelector
            value={options.aspectRatio}
            onChange={(value) => handleOptionChange('aspectRatio', value)}
            disabled={disabled}
          />

          <ColorMoodSlider
            value={options.colorMood}
            onChange={(value) => handleOptionChange('colorMood', value)}
            disabled={disabled}
          />

          <DetailLevelSelector
            value={options.detailLevel}
            onChange={(value) => handleOptionChange('detailLevel', value)}
            disabled={disabled}
          />

          {/* Reset Button */}
          {hasCustomization && (
            <button
              type="button"
              onClick={() => onChange(DEFAULT_OPTIONS)}
              disabled={disabled}
              className="text-sm text-gray-500 hover:text-primary transition-colors"
            >
              Reset to defaults
            </button>
          )}
        </div>
      )}
    </div>
  );
};

VisualControlsPanel.propTypes = {
  options: PropTypes.shape({
    aspectRatio: PropTypes.oneOf(['1:1', '16:9', '9:16', '4:3', '3:4']),
    colorMood: PropTypes.oneOf(['warm', 'neutral', 'cool']),
    detailLevel: PropTypes.oneOf(['draft', 'balanced', 'max']),
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default VisualControlsPanel;
