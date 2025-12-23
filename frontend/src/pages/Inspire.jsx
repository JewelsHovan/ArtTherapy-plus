import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { painPlusAPI } from '../services/api';
import Button from '../components/common/Button';

const Inspire = () => {
  const navigate = useNavigate();
  const [inspirations, setInspirations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState(null);

  useEffect(() => {
    loadInspirations();
  }, []);

  const loadInspirations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await painPlusAPI.getInspiration();
      setInspirations(response.inspirations || []);
    } catch (err) {
      console.error('Failed to load inspirations:', err);
      setError('Failed to load inspirational prompts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPrompt = (inspiration) => {
    setSelectedPrompt(inspiration);
  };

  const handleUsePrompt = () => {
    if (selectedPrompt) {
      navigate('/describe', {
        state: {
          prefilledDescription: selectedPrompt.prompt,
          fromInspire: true
        }
      });
    }
  };

  const handleRefresh = () => {
    setSelectedPrompt(null);
    loadInspirations();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Finding inspiration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadInspirations}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="card-clean mb-8 animate-fadeIn">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Get Inspired</h1>
              <p className="text-gray-600">Choose a prompt that resonates with you</p>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => navigate('/mode')}>
                Back
              </Button>
              <Button variant="outline" onClick={handleRefresh}>
                Refresh Prompts
              </Button>
            </div>
          </div>
        </div>

        {/* Inspirations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {inspirations.map((inspiration, index) => (
            <div
              key={index}
              onClick={() => handleSelectPrompt(inspiration)}
              className={`card-clean cursor-pointer transform transition-all duration-300 hover:scale-105 animate-fadeIn ${
                selectedPrompt === inspiration
                  ? 'ring-2 ring-primary shadow-lg'
                  : 'hover:shadow-md'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <h3 className="text-xl font-semibold text-primary mb-3">
                {inspiration.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {inspiration.prompt}
              </p>
              {selectedPrompt === inspiration && (
                <div className="mt-4 flex items-center text-primary">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Selected
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Button */}
        {selectedPrompt && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 animate-fadeIn">
            <Button
              variant="primary"
              size="large"
              onClick={handleUsePrompt}
              className="shadow-lg px-8"
            >
              Use This Prompt
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inspire;
