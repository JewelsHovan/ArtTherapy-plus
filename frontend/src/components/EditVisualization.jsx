import React, { useState, useEffect } from 'react';
import { galleryStorage } from '../utils/storage';

const EditVisualization = ({ 
  originalImage, 
  painDescription, 
  transformedImage, 
  isLoading = false 
}) => {
  const [showTransformed, setShowTransformed] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Trigger animation when transformed image loads
    if (transformedImage && !isLoading) {
      setTimeout(() => setShowTransformed(true), 100);
    }
  }, [transformedImage, isLoading]);

  const handleSaveToGallery = async () => {
    if (transformedImage && painDescription) {
      const saved = await galleryStorage.save({
        imageUrl: transformedImage,
        description: painDescription,
        promptUsed: `Therapeutic transformation based on: ${painDescription}`,
        mode: 'edit'
      });

      if (saved) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      }
    }
  };

  const handleDownload = () => {
    if (transformedImage) {
      const link = document.createElement('a');
      link.href = transformedImage;
      link.download = `therapeutic-art-${Date.now()}.png`;
      link.click();
    }
  };

  return (
    <div className="edit-visualization w-full">
      {/* Three-panel view for mobile and desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Original Image Panel */}
        <div className="panel">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Your Base Image</h3>
          <div className="rounded-lg overflow-hidden shadow-md bg-white">
            {originalImage ? (
              <img 
                src={originalImage} 
                alt="Original" 
                className="w-full h-64 lg:h-80 object-contain bg-gray-50"
              />
            ) : (
              <div className="w-full h-64 lg:h-80 bg-gray-100 flex items-center justify-center">
                <p className="text-gray-400">Upload an image to begin</p>
              </div>
            )}
          </div>
        </div>

        {/* Pain Description Panel */}
        <div className="panel">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Your Pain Experience</h3>
          <div className="rounded-lg shadow-md bg-gradient-to-br from-purple-50 to-pink-50 p-6 h-64 lg:h-80 flex items-center justify-center">
            {painDescription ? (
              <div className="text-center">
                <svg className="w-12 h-12 text-purple-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="text-gray-700 italic text-sm leading-relaxed">
                  "{painDescription}"
                </p>
              </div>
            ) : (
              <p className="text-gray-400">Describe your pain experience</p>
            )}
          </div>
        </div>

        {/* Transformed Image Panel */}
        <div className="panel">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Therapeutic Transformation</h3>
          <div className="rounded-lg overflow-hidden shadow-md bg-white relative">
            {isLoading ? (
              <div className="w-full h-64 lg:h-80 bg-gray-50 flex flex-col items-center justify-center">
                <div className="loader mb-4">
                  <svg className="animate-spin h-10 w-10 text-purple-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm animate-pulse">Creating your transformation...</p>
              </div>
            ) : transformedImage ? (
              <>
                <img 
                  src={transformedImage} 
                  alt="Transformed" 
                  className={`w-full h-64 lg:h-80 object-contain bg-gray-50 transition-all duration-1000
                    ${showTransformed ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                />
                {showTransformed && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs animate-fadeIn">
                    ✓ Transformed
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-64 lg:h-80 bg-gray-100 flex items-center justify-center">
                <p className="text-gray-400">Transformation will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {transformedImage && !isLoading && (
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center animate-fadeIn">
          <button
            onClick={handleSaveToGallery}
            disabled={isSaved}
            className={`px-6 py-3 rounded-lg font-medium transition-all
              ${isSaved 
                ? 'bg-green-500 text-white' 
                : 'bg-purple-600 text-white hover:bg-purple-700'}`}
          >
            {isSaved ? '✓ Saved to Gallery' : 'Save to Gallery'}
          </button>
          
          <button
            onClick={handleDownload}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Download Image
          </button>
          
          <button
            onClick={() => window.location.href = '/gallery'}
            className="px-6 py-3 bg-white text-purple-600 border-2 border-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors"
          >
            View Gallery
          </button>
        </div>
      )}
    </div>
  );
};

export default EditVisualization;