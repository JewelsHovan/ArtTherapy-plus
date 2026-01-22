import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoadingButton from '../components/common/LoadingButton';
import { VisualControlsPanel, GenerationProgress, DEFAULT_OPTIONS } from '../components/generation';
import { painPlusAPI, sessionHelpers, getErrorMessage } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ArtSettingsModal from '../components/modals/ArtSettingsModal';

const PainDescription = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUserSettings, updateUserSettings } = useAuth();
  
  const [painDescription, setPainDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState('');
  const [prompts, setPrompts] = useState([]);
  const [showPrompts, setShowPrompts] = useState(false);
  const [error, setError] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [charWarning, setCharWarning] = useState(false);
  const [charLimitHit, setCharLimitHit] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [localSettings, setLocalSettings] = useState({});
  
  // Visual options state with defaults
  const [visualOptions, setVisualOptions] = useState(() => {
    // Try to restore from session storage
    const saved = sessionHelpers.loadVisualOptions();
    return saved || { ...DEFAULT_OPTIONS };
  });

  const maxChars = 500;
  const warningThreshold = 450;

  const examplePrompts = [
    "Sharp stabbing sensation in my lower back that radiates down my left leg",
    "Throbbing headache that feels like a vice grip around my temples",
    "Burning sensation in my chest that makes it hard to breathe deeply",
    "Dull ache in my shoulders that feels like carrying heavy weights"
  ];

  const [currentExample, setCurrentExample] = useState(0);

  useEffect(() => {
    setLocalSettings(user?.settings || {});
  }, [user?.settings]);

  // Get user's preferred model and style from settings
  const preferredModel = localSettings?.preferredModel || 'dall-e-3';
  const preferredStyle = localSettings?.preferredStyle || 'default';

  // Check if coming from Inspire page with a prefilled description
  useEffect(() => {
    if (location.state?.prefilledDescription) {
      const prefilled = location.state.prefilledDescription;
      setPainDescription(prefilled);
      setCharCount(prefilled.length);
      setCharWarning(prefilled.length >= warningThreshold);
    }
  }, [location.state]);

  // Save visual options to session storage when they change
  useEffect(() => {
    sessionHelpers.saveVisualOptions(visualOptions);
  }, [visualOptions]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExample((prev) => (prev + 1) % examplePrompts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [examplePrompts.length]);

  const handlePrompt = async () => {
    if (!painDescription.trim()) {
      setError('Please describe your pain first');
      return;
    }

    setIsLoading(true);
    setLoadingAction('prompts');
    setError('');
    
    try {
      const response = await painPlusAPI.generatePrompt(painDescription);
      if (response.success) {
        setPrompts(response.prompts);
        setShowPrompts(true);
      }
    } catch (err) {
      console.error('Error generating prompts:', err);
      setError(getErrorMessage(err, 'generate prompts'));
    } finally {
      setIsLoading(false);
      setLoadingAction('');
    }
  };

  const handleVisualize = async () => {
    if (!painDescription.trim()) {
      setError('Please describe your pain first');
      return;
    }

    setIsLoading(true);
    setLoadingAction('visualize');
    setShowProgress(true);
    setError('');
    
    try {
      // Pass user's preferred settings and visual options
      const response = await painPlusAPI.generateImage(painDescription, {
        model: preferredModel,
        style: preferredStyle,
        aspectRatio: visualOptions.aspectRatio,
        colorMood: visualOptions.colorMood,
        detailLevel: visualOptions.detailLevel,
      });
      
      if (response.success) {
        // Build generation data for Visualize page
        const generationData = {
          imageUrl: response.image_url,
          images: response.images || [{ url: response.image_url, model: response.model_used, style: response.style_used, promptUsed: response.prompt_used }],
          description: painDescription,
          promptUsed: response.prompt_used,
          modelUsed: response.model_used,
          styleUsed: response.style_used,
          visualOptions,
        };
        
        // Save to session storage for persistence
        sessionHelpers.saveCurrentGeneration(generationData);
        
        navigate('/visualize', { state: generationData });
      }
    } catch (err) {
      console.error('Error generating image:', err);
      setError(getErrorMessage(err, 'generate your visualization'));
    } finally {
      setIsLoading(false);
      setLoadingAction('');
      setShowProgress(false);
    }
  };

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
    if (!user?.settings) {
      refreshUserSettings();
    }
  };

  const handleSettingsChange = async (key, value) => {
    const nextSettings = { ...(localSettings || {}), [key]: value };
    setLocalSettings(nextSettings);
    setIsSavingSettings(true);

    try {
      await updateUserSettings(nextSettings);
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    setPainDescription(prompt);
    setCharCount(prompt.length);
    setCharWarning(prompt.length >= warningThreshold);
  };

  return (
    <div className="min-h-screen watercolor-bg p-4 sm:p-8">
      <div className="max-w-5xl w-full mx-auto">
        {/* Minimal Header Navigation */}
        <div className="flex justify-between items-center mb-6 animate-fadeIn">
          <button
            onClick={() => navigate('/mode')}
            className="p-2 hover:bg-white/50 rounded-full transition-colors"
            aria-label="Go back"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleOpenSettings}
            className="p-2 hover:bg-white/50 rounded-full transition-colors"
            aria-label="Settings"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Main Content Card */}
        <div className="card-clean gradient-border animate-fadeIn" style={{ animationDelay: '150ms' }}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Describe Your Pain
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Express how you're feeling in your own words. Be as descriptive as you'd like - 
              location, intensity, sensation, or emotional impact.
            </p>
          </div>

          {/* Textarea Input */}
          <div className="mb-6">
            <div className="relative">
              <label htmlFor="pain-description" className="sr-only">
                Describe your pain
              </label>
              <textarea
                id="pain-description"
                autoFocus
                value={painDescription}
                onChange={(e) => {
                  const newValue = e.target.value;

                  // Update warning state
                  setCharWarning(newValue.length >= warningThreshold);

                  if (newValue.length <= maxChars) {
                    setPainDescription(newValue);
                    setCharCount(newValue.length);
                    setError('');
                  } else {
                    // Flash animation when hitting limit
                    setCharLimitHit(true);
                    setTimeout(() => setCharLimitHit(false), 300);
                  }
                }}
                placeholder={examplePrompts[currentExample]}
                className={`w-full h-40 sm:h-44 px-6 py-4 text-lg bg-gray-50
                  border-2 rounded-xl resize-none
                  focus:outline-none focus:border-primary focus:bg-white
                  transition-all duration-300 placeholder:text-gray-400
                  ${charWarning ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'}`}
              />
              <span className={`absolute bottom-3 right-3 text-sm transition-all duration-200 ${
                charLimitHit
                  ? 'text-red-500 animate-pulse font-bold scale-110'
                  : charWarning
                    ? 'text-amber-500 font-medium'
                    : 'text-gray-400'
              }`}>
                {charCount}/{maxChars}
              </span>
            </div>
            
            {error && (
              <p className="text-red-500 text-sm mt-3 text-center animate-fadeIn">{error}</p>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3">Need inspiration? Try these:</p>
            <div className="flex flex-wrap gap-2">
              {['Sharp pain', 'Throbbing', 'Burning sensation', 'Dull ache', 'Stabbing'].map((prompt, index) => (
                <button
                  key={prompt}
                  onClick={() => handleQuickPrompt(prompt)}
                  className={`quick-tag ${
                    index % 3 === 0 ? 'quick-tag-primary' :
                    index % 3 === 1 ? 'quick-tag-secondary' :
                    'quick-tag-accent'
                  }`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Controls Panel - Collapsed by default */}
          <VisualControlsPanel
            options={visualOptions}
            onChange={setVisualOptions}
            disabled={isLoading}
            className="mb-6"
          />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <LoadingButton
              onClick={handleVisualize}
              isLoading={isLoading && loadingAction === 'visualize'}
              loadingText="Creating Art..."
              disabled={!painDescription.trim()}
              variant="primary"
              className="px-8 py-3 rounded-xl font-semibold text-lg min-w-[200px] transform hover:-translate-y-1 disabled:transform-none bg-gradient-to-r from-primary to-primary-hover"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Visualize
              </span>
            </LoadingButton>

            <button
              onClick={handlePrompt}
              disabled={isLoading}
              className="px-8 py-3 bg-transparent border-2 border-primary
                text-primary rounded-xl font-semibold text-lg
                hover:bg-primary hover:text-white transform hover:-translate-y-1 
                transition-all duration-300 shadow-md hover:shadow-lg
                disabled:opacity-50 disabled:cursor-not-allowed
                disabled:transform-none min-w-[200px]"
            >
              {isLoading && loadingAction === 'prompts' ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Get Prompts
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Display prompts if generated */}
        {showPrompts && prompts.length > 0 && (
          <div className="card-clean mt-8 animate-slideUp">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Creative Prompts for You</h3>
            <div className="space-y-4">
              {prompts.map((prompt, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-r from-primary-light/50 to-secondary-light/50 p-5 rounded-xl
                    border border-gray-200 hover:shadow-md transition-all duration-300
                    transform hover:-translate-y-1"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <p className="font-medium text-gray-800 text-lg mb-3">{prompt.prompt}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {prompt.technique && (
                      <span className="px-3 py-1 bg-white/70 rounded-full text-primary">
                        <span className="font-semibold">Technique:</span> {prompt.technique}
                      </span>
                    )}
                    {prompt.emotional_focus && (
                      <span className="px-3 py-1 bg-white/70 rounded-full text-secondary-dark">
                        <span className="font-semibold">Focus:</span> {prompt.emotional_focus}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowPrompts(false)}
                className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
              >
                Hide Prompts
              </button>
            </div>
          </div>
        )}

        {/* Helper Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            Your description helps create personalized art that reflects your experience
          </p>
        </div>
      </div>

      <ArtSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={localSettings}
        onSettingsChange={handleSettingsChange}
        isSaving={isSavingSettings}
      />

      {/* Generation Progress Overlay */}
      <GenerationProgress isVisible={showProgress} />
    </div>
  );
};

export default PainDescription;
