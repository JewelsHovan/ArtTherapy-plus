import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '../components/common/Logo';
import { painPlusAPI } from '../services/api';

const PainDescription = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [painDescription, setPainDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState('');
  const [prompts, setPrompts] = useState([]);
  const [showPrompts, setShowPrompts] = useState(false);
  const [error, setError] = useState('');
  const [charCount, setCharCount] = useState(0);
  const maxChars = 500;

  const examplePrompts = [
    "Sharp stabbing sensation in my lower back that radiates down my left leg",
    "Throbbing headache that feels like a vice grip around my temples",
    "Burning sensation in my chest that makes it hard to breathe deeply",
    "Dull ache in my shoulders that feels like carrying heavy weights"
  ];

  const [currentExample, setCurrentExample] = useState(0);

  // Check if coming from Inspire page with a prefilled description
  useEffect(() => {
    if (location.state?.prefilledDescription) {
      setPainDescription(location.state.prefilledDescription);
      setCharCount(location.state.prefilledDescription.length);
    }
  }, [location.state]);

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
      setError('Failed to generate prompts. Please try again.');
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
    setError('');
    
    try {
      const response = await painPlusAPI.generateImage(painDescription);
      if (response.success) {
        navigate('/visualize', { 
          state: { 
            imageUrl: response.image_url,
            description: painDescription,
            promptUsed: response.prompt_used
          } 
        });
      }
    } catch (err) {
      console.error('Error generating image:', err);
      setError('Failed to generate visualization. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingAction('');
    }
  };

  const handleQuickPrompt = (prompt) => {
    setPainDescription(prompt);
    setCharCount(prompt.length);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with Logo and Back Button */}
        <div className="card-clean mb-8 animate-fadeIn">
          <div className="flex justify-between items-center">
            <Logo />
            <button
              onClick={() => navigate('/mode')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg
                hover:bg-gray-200 transition-all duration-300 font-medium"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="card-clean animate-fadeIn" style={{ animationDelay: '150ms' }}>
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
          <div className="mb-8">
            <div className="relative">
              <textarea
                value={painDescription}
                onChange={(e) => {
                  if (e.target.value.length <= maxChars) {
                    setPainDescription(e.target.value);
                    setCharCount(e.target.value.length);
                    setError('');
                  }
                }}
                placeholder={examplePrompts[currentExample]}
                className="w-full h-32 px-6 py-4 text-lg bg-gray-50
                  border-2 border-gray-200 rounded-xl resize-none
                  focus:outline-none focus:border-primary focus:bg-white
                  transition-all duration-300 placeholder:text-gray-400"
              />
              <div className="absolute bottom-3 right-3 text-sm text-gray-500">
                {charCount}/{maxChars}
              </div>
            </div>
            
            {error && (
              <p className="text-red-500 text-sm mt-3 text-center animate-fadeIn">{error}</p>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="mb-8">
            <p className="text-sm text-gray-600 mb-3">Need inspiration? Try these:</p>
            <div className="flex flex-wrap gap-2">
              {['Sharp pain', 'Throbbing', 'Burning sensation', 'Dull ache', 'Stabbing'].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleQuickPrompt(prompt)}
                  className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full
                    hover:bg-blue-100 transition-all duration-300"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleVisualize}
              disabled={isLoading}
              className="px-8 py-3 bg-primary text-white rounded-xl font-semibold text-lg
                hover:bg-primary-hover transform hover:-translate-y-1 transition-all duration-300
                shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                disabled:transform-none min-w-[200px]"
            >
              {isLoading && loadingAction === 'visualize' ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600 mb-2">Creating your artwork...</p>
                  <p className="text-sm text-gray-500">This usually takes 15-30 seconds</p>
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Visualize Pain
                </span>
              )}
            </button>

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
                  className="bg-gradient-to-r from-blue-50 to-orange-50 p-5 rounded-xl
                    border border-gray-200 hover:shadow-md transition-all duration-300
                    transform hover:-translate-y-1"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <p className="font-medium text-gray-800 text-lg mb-3">{prompt.prompt}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {prompt.technique && (
                      <span className="px-3 py-1 bg-white/70 rounded-full text-blue-700">
                        <span className="font-semibold">Technique:</span> {prompt.technique}
                      </span>
                    )}
                    {prompt.emotional_focus && (
                      <span className="px-3 py-1 bg-white/70 rounded-full text-orange-700">
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
    </div>
  );
};

export default PainDescription;