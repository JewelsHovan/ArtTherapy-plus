import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/common/Logo';
import Button from '../components/common/Button';
import ImageModal from '../components/modals/ImageModal';
import { galleryStorage } from '../utils/storage';

const Gallery = () => {
  const navigate = useNavigate();
  const [galleryItems, setGalleryItems] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = () => {
    const items = galleryStorage.getAll();
    setGalleryItems(items);
  };

  const handleImageClick = (item) => {
    setSelectedImage(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedImage(null), 300);
  };

  const handleDeleteImage = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this artwork?')) {
      galleryStorage.delete(id);
      loadGallery();
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Logo />
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              size="small"
              onClick={() => navigate('/visualize')}
            >
              Back
            </Button>
            <Button 
              variant="primary" 
              size="small"
              onClick={() => navigate('/describe')}
            >
              Create New
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Your Art Gallery</h1>
          <p className="text-gray-600">Click on any artwork to see your pain description transform into art</p>
        </div>

        {galleryItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="max-w-md mx-auto">
              <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">No Artwork Yet</h2>
              <p className="text-gray-500 mb-6">Start creating your visual pain journey</p>
              <Button 
                variant="primary"
                onClick={() => navigate('/describe')}
              >
                Create Your First Artwork
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {galleryItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl group"
                onClick={() => handleImageClick(item)}
              >
                <div className="relative aspect-square">
                  <img 
                    src={item.imageUrl} 
                    alt="Generated artwork"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <p className="text-sm font-medium line-clamp-2">{item.description}</p>
                    </div>
                  </div>
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
                <div className="p-4">
                  <p className="text-sm text-gray-500">{formatDate(item.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {galleryItems.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
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