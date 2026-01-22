import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from '../components/common/Logo';
import Button from '../components/common/Button';
import { painPlusAPI } from '../services/api';
import { galleryStorage } from '../utils/storage';

const Visualize = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { imageUrl, description, promptUsed } = location.state || {};

  const [reflectionQuestions, setReflectionQuestions] = useState([]);
  const [showReflection, setShowReflection] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!imageUrl) {
      navigate('/describe');
    }
  }, [imageUrl, navigate]);

  const handleReflect = async () => {
    setIsLoading(true);
    setError(''); // Clear previous errors
    try {
      const response = await painPlusAPI.reflect(description, promptUsed);
      if (response.success) {
        setReflectionQuestions(response.questions);
        setShowReflection(true);
      }
    } catch (err) {
      console.error('Error generating reflection questions:', err);
      setError('Failed to generate reflection questions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewArtwork = () => {
    navigate('/describe');
  };

  const handleSaveImage = () => {
    // Open the image in a new tab for the user to save
    window.open(imageUrl, '_blank');
  };

  const handleSaveToGallery = async () => {
    const saved = await galleryStorage.save({
      imageUrl,
      description,
      promptUsed,
      mode: 'create'
    });
    if (saved) {
      setIsSaved(true);
    }
  };

  const handleViewGallery = () => {
    navigate('/gallery');
  };

  if (!imageUrl) {
    return null;
  }

  // Color cycle for reflection questions
  const borderColors = ['border-primary', 'border-secondary', 'border-accent'];

  return (
    <div className="min-h-screen watercolor-bg p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Logo />
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="small"
              onClick={handleViewGallery}
            >
              Gallery
            </Button>
            <Button
              variant="outline"
              size="small"
              onClick={() => navigate('/describe')}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={() => navigate('/profile')}
            >
              Profile
            </Button>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Image Display - Larger Column */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-display font-bold text-primary mb-4">Your Visualization</h2>
              <div className="relative">
                <img
                  src={imageUrl}
                  alt="Generated artwork"
                  className="w-full rounded-xl"
                />
                <button
                  onClick={handleSaveImage}
                  className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-lg transition-all"
                  title="Save Image"
                  aria-label="Save image to device"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>

              {/* Original Description */}
              <div className="mt-6 p-4 bg-cream-100 rounded-xl">
                <h3 className="font-semibold text-gray-700 mb-2">Your Description:</h3>
                <p className="text-gray-600">{description}</p>
              </div>

              {/* Artistic Prompt Used */}
              {promptUsed && (
                <div className="mt-6 p-5 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border border-primary/10">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI Interpretation
                  </h3>
                  <p className="text-sm text-gray-600 italic">{promptUsed}</p>
                </div>
              )}
            </div>
          </div>

          {/* Interaction Panel - Smaller Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Action Buttons */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-primary mb-4">What would you like to do?</h3>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">
                  {error}
                </div>
              )}
              <div className="space-y-3">
                {!isSaved && (
                  <Button
                    variant="primary"
                    size="medium"
                    onClick={handleSaveToGallery}
                    className="w-full"
                  >
                    Save to Gallery
                  </Button>
                )}
                {isSaved && (
                  <div className="bg-green-50 text-green-700 p-3 rounded-lg text-center">
                    Saved to Gallery
                  </div>
                )}
                <Button
                  variant={isSaved ? "primary" : "secondary"}
                  size="medium"
                  onClick={handleReflect}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Generating...' : 'Reflect on This Artwork'}
                </Button>
                <Button
                  variant="secondary"
                  size="medium"
                  onClick={handleNewArtwork}
                  className="w-full"
                >
                  Create New Artwork
                </Button>
                <Button
                  variant="outline"
                  size="medium"
                  onClick={handleViewGallery}
                  className="w-full"
                >
                  View Gallery
                </Button>
              </div>
            </div>

            {/* Reflection Questions */}
            {showReflection && reflectionQuestions.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-primary mb-4">Reflection Questions</h3>
                <div className="space-y-4">
                  {reflectionQuestions.map((question, index) => (
                    <div key={index} className={`border-l-4 ${borderColors[index % 3]} pl-4 py-1`}>
                      <p className="text-gray-700">{question}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-primary/10 rounded-xl">
                  <p className="text-sm text-gray-600">
                    Take your time to reflect on these questions. You might want to journal your thoughts or discuss them with a trusted friend or therapist.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Visualize;
