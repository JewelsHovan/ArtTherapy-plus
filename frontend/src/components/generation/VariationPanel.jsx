import { useState } from 'react';
import PropTypes from 'prop-types';
import LoadingButton from '../common/LoadingButton';

/**
 * Variation adjustments available for creating new variations
 */
const VARIATION_ADJUSTMENTS = [
  { id: 'warmer', label: 'Warmer', description: 'Golden, amber tones' },
  { id: 'cooler', label: 'Cooler', description: 'Blue, teal tones' },
  { id: 'more_abstract', label: 'Abstract', description: 'More expressive' },
  { id: 'more_detailed', label: 'Detailed', description: 'More intricate' },
  { id: 'softer', label: 'Softer', description: 'Gentler feel' },
  { id: 'more_intense', label: 'Intense', description: 'Stronger impact' },
];

/**
 * VariationPanel - Panel for creating variations of generated images
 * 
 * Provides quick adjustment buttons and custom prompt input for
 * regenerating images with modifications while maintaining the
 * core therapeutic intent.
 */
const VariationPanel = ({
  onCreateVariation,
  isLoading = false,
  loadingAdjustment = null,
  className = '',
}) => {
  const [showCustom, setShowCustom] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  const handleAdjustmentClick = (adjustmentId) => {
    onCreateVariation(adjustmentId);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customPrompt.trim()) {
      onCreateVariation('custom', customPrompt.trim());
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-5 ${className}`}>
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-primary mb-2">
          Create a Variation
        </h3>
        <p className="text-sm text-gray-600 leading-snug">
          Generate a new image based on your feedback. Each variation builds on your original concept.
        </p>
      </div>

      {/* Quick Adjustment Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {VARIATION_ADJUSTMENTS.map((adjustment) => (
          <button
            key={adjustment.id}
            onClick={() => handleAdjustmentClick(adjustment.id)}
            disabled={isLoading}
            className={`
              p-3 rounded-xl border-2 transition-all duration-200 min-h-[78px]
              ${isLoading && loadingAdjustment === adjustment.id
                ? 'border-primary bg-primary-light'
                : 'border-gray-200 hover:border-primary hover:bg-primary-light/50'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
              text-left
            `}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex h-2 w-2 rounded-full bg-primary/60" aria-hidden="true" />
              <span className="text-sm font-semibold text-gray-800">{adjustment.label}</span>
            </div>
            <p className="text-xs text-gray-500 leading-snug break-words">{adjustment.description}</p>
            {isLoading && loadingAdjustment === adjustment.id && (
              <div className="mt-2 flex items-center gap-2 text-xs text-primary">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating...
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Custom Variation Toggle */}
      <div className="border-t border-gray-100 pt-4">
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showCustom ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Custom variation
        </button>

        {showCustom && (
          <form onSubmit={handleCustomSubmit} className="mt-3 animate-fadeIn">
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Describe how you'd like to modify the image..."
              className="w-full p-3 border-2 border-gray-200 rounded-xl resize-none
                focus:outline-none focus:border-primary transition-colors
                text-sm"
              rows={3}
              disabled={isLoading}
            />
            <LoadingButton
              type="submit"
              isLoading={isLoading && loadingAdjustment === 'custom'}
              loadingText="Creating..."
              disabled={!customPrompt.trim()}
              variant="outline"
              size="small"
              className="mt-2"
            >
              Create Custom Variation
            </LoadingButton>
          </form>
        )}
      </div>

      {/* Info Note */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500 flex items-start gap-2">
          <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Each variation generates a new image inspired by the original. 
            The AI interprets your feedback while maintaining the therapeutic intent.
          </span>
        </p>
      </div>
    </div>
  );
};

VariationPanel.propTypes = {
  onCreateVariation: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  loadingAdjustment: PropTypes.string,
  className: PropTypes.string,
};

export default VariationPanel;
