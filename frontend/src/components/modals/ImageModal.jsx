import { useState, useEffect } from 'react';

const ImageModal = ({ isOpen, onClose, imageData }) => {
  const [showImage, setShowImage] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowImage(false);
      setIsClosing(false);
      const timer = setTimeout(() => {
        setShowImage(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setShowImage(false);
      setIsClosing(false);
    }, 300);
  };

  if (!isOpen && !isClosing) return null;

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      <div 
        className="absolute inset-0 bg-black bg-opacity-75" 
        onClick={handleClose}
      />
      
      <div className={`relative w-[90vw] h-[90vh] max-w-7xl bg-white rounded-lg shadow-2xl overflow-hidden transition-transform duration-300 flex flex-col ${isClosing ? 'scale-95' : 'scale-100'}`}>
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-700 bg-white rounded-full p-2 shadow-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col h-full p-6 overflow-auto">
          <div className="mb-4">
            <p className="text-sm text-gray-500">{formatDate(imageData.timestamp)}</p>
          </div>

          <div className="relative flex-1 flex items-center justify-center min-h-0">
            <div className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-1000 p-4 ${showImage ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">Your Pain Description</h2>
              <div className="max-w-2xl mx-auto text-center">
                <p className="text-lg md:text-xl text-gray-700 leading-relaxed animate-fadeIn">
                  {imageData.description}
                </p>
              </div>
              {!showImage && (
                <div className="mt-8">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-300"></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Transforming into art...</p>
                </div>
              )}
            </div>

            <div className={`w-full h-full flex items-center justify-center transition-opacity duration-1500 ${showImage ? 'opacity-100' : 'opacity-0'}`}>
              <img 
                src={imageData.imageUrl} 
                alt="Generated artwork"
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                style={{ maxHeight: 'calc(90vh - 200px)' }}
              />
            </div>
          </div>

          {showImage && imageData.promptUsed && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg max-w-4xl mx-auto w-full">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Artistic Interpretation:</h3>
              <p className="text-sm text-gray-600 italic">{imageData.promptUsed}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageModal;