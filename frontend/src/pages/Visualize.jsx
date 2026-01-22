import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { VariationPanel, ImageComparison } from '../components/generation';
import { painPlusAPI, sessionHelpers } from '../services/api';
import { galleryStorage } from '../utils/storage';

const SESSION_KEY = 'arttherapy_current_generation';

const Visualize = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State from navigation or session storage
  const [generationData, setGenerationData] = useState(null);
  const [reflectionQuestions, setReflectionQuestions] = useState([]);
  const [showReflection, setShowReflection] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingVariation, setIsCreatingVariation] = useState(false);
  const [variationAdjustment, setVariationAdjustment] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Initialize from navigation state or session storage
  useEffect(() => {
    // First check navigation state
    if (location.state?.imageUrl) {
      const data = {
        imageUrl: location.state.imageUrl,
        images: location.state.images || [{ 
          url: location.state.imageUrl, 
          model: location.state.modelUsed || 'dall-e-3',
          style: location.state.styleUsed || 'default',
          promptUsed: location.state.promptUsed 
        }],
        description: location.state.description,
        promptUsed: location.state.promptUsed,
        modelUsed: location.state.modelUsed,
        styleUsed: location.state.styleUsed,
        visualOptions: location.state.visualOptions,
      };
      setGenerationData(data);
      sessionHelpers.saveCurrentGeneration(data);
    } else {
      // Try to restore from session storage
      const saved = sessionHelpers.loadCurrentGeneration();
      if (saved) {
        setGenerationData(saved);
      } else {
        // No data available - redirect to describe
        navigate('/describe');
      }
    }
  }, [location.state, navigate]);

  // Get the currently selected/displayed image
  const currentImage = generationData?.images?.[selectedImageIndex] || {
    url: generationData?.imageUrl,
    model: generationData?.modelUsed,
    style: generationData?.styleUsed,
    promptUsed: generationData?.promptUsed,
  };

  const handleReflect = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await painPlusAPI.reflect(
        generationData.description, 
        generationData.promptUsed
      );
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

  const handleCreateVariation = async (adjustment, customPrompt = null) => {
    setIsCreatingVariation(true);
    setVariationAdjustment(adjustment);
    setError('');
    
    try {
      const response = await painPlusAPI.createVariation(
        currentImage.url,
        adjustment,
        {
          customPrompt,
          originalDescription: generationData.description,
        }
      );
      
      if (response.success) {
        // Create new generation data with the variation
        const newImage = {
          url: response.image_url,
          model: response.model_used || 'dall-e-3',
          style: currentImage.style,
          promptUsed: response.prompt_used,
        };
        
        const newData = {
          ...generationData,
          imageUrl: response.image_url,
          images: [newImage],
          promptUsed: response.prompt_used,
          variationHistory: [
            ...(generationData.variationHistory || []),
            { adjustment, customPrompt, previousUrl: currentImage.url }
          ],
        };
        
        setGenerationData(newData);
        setSelectedImageIndex(0);
        setIsSaved(false); // Reset saved state for new variation
        sessionHelpers.saveCurrentGeneration(newData);
      }
    } catch (err) {
      console.error('Error creating variation:', err);
      setError('Failed to create variation. Please try again.');
    } finally {
      setIsCreatingVariation(false);
      setVariationAdjustment(null);
    }
  };

  const handleImageSelect = (index) => {
    setSelectedImageIndex(index);
  };

  const handleImageContinue = (index) => {
    // If in compare mode, finalize selection
    setSelectedImageIndex(index);
  };

  const handleNewArtwork = () => {
    sessionHelpers.clearCurrentGeneration();
    navigate('/describe');
  };

  const handleSaveImage = () => {
    window.open(currentImage.url, '_blank');
  };

  const handleSaveToGallery = async () => {
    const saved = await galleryStorage.save({
      imageUrl: currentImage.url,
      description: generationData.description,
      promptUsed: currentImage.promptUsed,
      mode: 'create'
    });
    if (saved) {
      setIsSaved(true);
    }
  };

  if (!generationData) {
    return null;
  }

  const hasMultipleImages = generationData.images && generationData.images.length > 1;
  const borderColors = ['border-primary', 'border-secondary', 'border-accent'];

  return (
    <div className="min-h-screen watercolor-bg p-4 sm:p-6">
      <div className="max-w-6xl w-full mx-auto">
        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-6 items-start">
          {/* Left Panel */}
          <aside className="space-y-4 order-2 lg:order-1">
            <VariationPanel
              onCreateVariation={handleCreateVariation}
              isLoading={isCreatingVariation}
              loadingAdjustment={variationAdjustment}
            />

            <div className="bg-white rounded-2xl shadow-lg p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Description</p>
              <p className="text-gray-700 leading-snug">{generationData.description}</p>

              {currentImage.promptUsed && (
                <div className="relative mt-4 group">
                  <div
                    className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500 cursor-help"
                    tabIndex={0}
                    aria-label="AI interpretation. Focus or hover to preview."
                  >
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5.001 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span>AI interpretation</span>
                    <span className="text-primary/70 normal-case">hover to view</span>
                  </div>
                  <div className="pointer-events-none absolute left-0 z-20 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 italic shadow-lg opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0">
                    {currentImage.promptUsed}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Visualization */}
          <div className="order-1 lg:order-2">
            <div className="bg-white rounded-2xl shadow-lg p-5">

              {/* Image Display - Single or Comparison */}
              {hasMultipleImages ? (
                <ImageComparison
                  images={generationData.images}
                  selectedIndex={selectedImageIndex}
                  onSelect={handleImageSelect}
                  onContinue={handleImageContinue}
                />
              ) : (
                <div className="relative">
                  <div className="rounded-2xl bg-gradient-to-br from-white to-gray-50 p-3 shadow-[0_12px_30px_-18px_rgba(0,0,0,0.35)] ring-1 ring-black/5">
                    <img
                      src={currentImage.url}
                      alt="Generated artwork"
                      className="w-full rounded-xl max-h-[60vh] lg:max-h-[calc(100vh-280px)] object-contain"
                    />
                  </div>
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
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Action Row */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            {!isSaved && (
              <Button
                variant="primary"
                size="small"
                onClick={handleSaveToGallery}
                className="flex-1"
              >
                Save to Gallery
              </Button>
            )}
            {isSaved && (
              <div className="bg-green-50 text-green-700 p-3 rounded-lg text-center flex-1">
                Saved to Gallery
              </div>
            )}
            <Button
              variant={isSaved ? "primary" : "secondary"}
              size="small"
              onClick={handleReflect}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Generating...' : 'Reflect on This Artwork'}
            </Button>
            <Button
              variant="outline"
              size="small"
              onClick={handleNewArtwork}
              className="flex-1"
            >
              Create New Artwork
            </Button>
          </div>
        </div>

        {/* Reflection Questions */}
        {showReflection && reflectionQuestions.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow-lg p-5">
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
  );
};

export default Visualize;
