import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from '../components/common/Logo';
import Button from '../components/common/Button';
import { painPlusAPI } from '../services/api';

const Visualize = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { imageUrl, description, promptUsed } = location.state || {};
  
  const [reflectionQuestions, setReflectionQuestions] = useState([]);
  const [showReflection, setShowReflection] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!imageUrl) {
      navigate('/describe');
    }
  }, [imageUrl, navigate]);

  const handleReflect = async () => {
    setIsLoading(true);
    try {
      const response = await painPlusAPI.reflect(description, promptUsed);
      if (response.success) {
        setReflectionQuestions(response.questions);
        setShowReflection(true);
      }
    } catch (err) {
      console.error('Error generating reflection questions:', err);
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

  if (!imageUrl) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Logo />
          <div className="flex gap-4">
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Display */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-primary mb-4">Your Visualization</h2>
            <div className="relative">
              <img 
                src={imageUrl} 
                alt="Generated artwork"
                className="w-full rounded-lg"
              />
              <button
                onClick={handleSaveImage}
                className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-lg transition-all"
                title="Save Image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
            
            {/* Original Description */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Your Description:</h3>
              <p className="text-gray-600">{description}</p>
            </div>
          </div>

          {/* Interaction Panel */}
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-primary mb-4">What would you like to do?</h3>
              <div className="space-y-3">
                <Button 
                  variant="primary" 
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
              </div>
            </div>

            {/* Reflection Questions */}
            {showReflection && reflectionQuestions.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold text-primary mb-4">Reflection Questions</h3>
                <div className="space-y-4">
                  {reflectionQuestions.map((question, index) => (
                    <div key={index} className="border-l-4 border-primary pl-4">
                      <p className="text-gray-700">{question}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Take your time to reflect on these questions. You might want to journal your thoughts or discuss them with a trusted friend or therapist.
                  </p>
                </div>
              </div>
            )}

            {/* Artistic Prompt Used */}
            {promptUsed && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Artistic Interpretation:</h3>
                <p className="text-sm text-gray-600 italic">{promptUsed}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Visualize;