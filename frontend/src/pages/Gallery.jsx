import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageModal from '../components/modals/ImageModal';
import { galleryStorage } from '../utils/storage';

const Gallery = () => {
  const navigate = useNavigate();
  const [galleryItems, setGalleryItems] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await galleryStorage.getAll();
      setGalleryItems(items);
    } catch (err) {
      console.error('Failed to load gallery:', err);
      setError('Failed to load your gallery. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageClick = (item) => {
    setSelectedImage(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedImage(null), 300);
  };

  const handleDeleteImage = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this artwork?')) {
      const success = await galleryStorage.delete(id);
      if (success) {
        setGalleryItems(prev => prev.filter(item => item.id !== id));
      }
    }
  };

  const handleReflect = (item, e) => {
    e.stopPropagation();
    navigate('/reflect', { state: { galleryItem: item } });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your gallery...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadGallery}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Combined Header Card */}
        <div className="card-clean mb-8 animate-fadeIn">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Art Gallery</h1>
              <p className="text-gray-600">Click on any artwork to see your pain description transform into art</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg
                  hover:bg-gray-200 transition-all duration-300 font-medium"
              >
                Back
              </button>
              <button
                onClick={() => navigate('/mode')}
                className="px-4 py-2 bg-primary text-white rounded-lg
                  hover:bg-primary-hover transition-all duration-300 font-medium shadow-md"
              >
                Create New
              </button>
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        {galleryItems.length === 0 ? (
          <div className="card-clean p-12 text-center animate-fadeIn" style={{ animationDelay: '150ms' }}>
            <div className="max-w-md mx-auto">
              <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">No Artwork Yet</h2>
              <p className="text-gray-500 mb-6">Start creating your visual pain journey</p>
              <button
                onClick={() => navigate('/mode')}
                className="px-6 py-3 bg-secondary text-white rounded-lg
                  hover:bg-secondary-hover transition-all duration-300 font-medium shadow-md"
              >
                Create Your First Artwork
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {galleryItems.map((item, index) => (
              <div
                key={item.id}
                className="bg-white rounded-xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl group animate-fadeIn"
                style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
                onClick={() => handleImageClick(item)}
              >
                <div className="relative aspect-square">
                  <img
                    src={item.imageUrl}
                    alt="Generated artwork"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <p className="text-sm font-medium line-clamp-2">{item.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleReflect(item, e)}
                    className="absolute top-2 left-2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    title="Reflect on artwork"
                  >
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => handleDeleteImage(item.id, e)}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    title="Delete artwork"
                  >
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div className="p-4 bg-white">
                  <p className="text-sm text-gray-500">{formatDate(item.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {galleryItems.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              {galleryItems.length} {galleryItems.length === 1 ? 'artwork' : 'artworks'} in your gallery
            </p>
          </div>
        )}

        {selectedImage && (
          <ImageModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            imageData={selectedImage}
          />
        )}
      </div>
    </div>
  );
};

export default Gallery;
