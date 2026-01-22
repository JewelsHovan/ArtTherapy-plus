import { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { painPlusAPI } from '../../services/api';

/**
 * Art Generation Settings Component
 *
 * Allows users to configure their preferred image generation model
 * and style preset. Settings auto-save with debounce.
 */
const ArtGenerationSettings = ({
  settings,
  onSettingsChange,
  isSaving,
  showModels = true,
  showStyles = true,
}) => {
  const [models, setModels] = useState([]);
  const [styles, setStyles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Current selections (use defaults if not set)
  const selectedModel = settings?.preferredModel || 'dall-e-3';
  const selectedStyle = settings?.preferredStyle || 'default';

  // Debounce timer ref
  const debounceTimerRef = useRef(null);

  // Load available models and styles
  useEffect(() => {
    const loadImageModels = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await painPlusAPI.settings.getImageModels();
        setModels(response.data.models || []);
        setStyles(response.data.styles || []);
      } catch (err) {
        console.error('Failed to load image models:', err);
        setError('Failed to load available models. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadImageModels();
  }, []);

  // Debounced settings update
  const debouncedUpdate = useCallback(
    (key, value) => {
      // Clear any pending timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer for 300ms debounce
      debounceTimerRef.current = setTimeout(() => {
        onSettingsChange(key, value);
      }, 300);
    },
    [onSettingsChange]
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleModelChange = (modelId) => {
    debouncedUpdate('preferredModel', modelId);
  };

  const handleStyleChange = (styleId) => {
    debouncedUpdate('preferredStyle', styleId);
  };

  // Cost tier badge colors
  const costTierColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-accent-light text-amber-800',
    high: 'bg-secondary-light text-secondary-dark',
  };

  const tierLabels = {
    high: 'Premium',
    medium: 'Standard',
    low: 'Free',
  };

  const tierOrder = ['high', 'medium', 'low'];
  const groupedModels = tierOrder
    .map((tier) => ({
      tier,
      models: models.filter((model) => model.costTier === tier),
    }))
    .filter((group) => group.models.length > 0);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-red-600 text-center">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-primary hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Model Selection */}
      {showModels && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium">AI Model</h3>
            {isSaving && <span className="text-xs text-gray-500">Saving...</span>}
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Choose the AI model used to generate your artwork. Different models have unique artistic styles.
          </p>

          <div className="space-y-6">
            {groupedModels.map((group) => (
              <div key={group.tier}>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                  <span>{tierLabels[group.tier]}</span>
                  <span className="text-gray-400">({group.models.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {group.models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleModelChange(model.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedModel === model.id
                          ? 'border-primary bg-primary-light'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{model.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${costTierColors[model.costTier]}`}>
                          {tierLabels[model.costTier]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{model.description}</p>
                      {selectedModel === model.id && (
                        <div className="mt-2 flex items-center text-primary text-sm">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Selected
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Style Selection */}
      {showStyles && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium">Art Style</h3>
            {isSaving && <span className="text-xs text-gray-500">Saving...</span>}
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Select your preferred artistic style. This affects how your pain descriptions are transformed into art.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {styles.map((style) => (
              <button
                key={style.id}
                onClick={() => handleStyleChange(style.id)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  selectedStyle === style.id
                    ? 'border-primary bg-primary-light'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{style.name}</span>
                  {selectedStyle === style.id && (
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{style.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

ArtGenerationSettings.propTypes = {
  settings: PropTypes.shape({
    preferredModel: PropTypes.string,
    preferredStyle: PropTypes.string,
  }),
  onSettingsChange: PropTypes.func.isRequired,
  isSaving: PropTypes.bool,
  showModels: PropTypes.bool,
  showStyles: PropTypes.bool,
};

ArtGenerationSettings.defaultProps = {
  settings: {},
  isSaving: false,
  showModels: true,
  showStyles: true,
};

export default ArtGenerationSettings;
