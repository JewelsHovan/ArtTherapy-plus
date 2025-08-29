import React, { useState, useRef } from 'react';
import { processImageForUpload } from '../utils/imageCompression';

const ImageUploader = ({ onImageUpload, className = '' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleFile(files[0]);
    }
  };

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFile(files[0]);
    }
  };

  const handleFile = async (file) => {
    try {
      setUploadStatus('processing');
      
      // Process image (compress if needed)
      const processedImage = await processImageForUpload(file);
      
      // Set preview
      setPreviewImage(processedImage.data);
      
      // Update status
      if (processedImage.compressed) {
        setUploadStatus(`Compressed: ${processedImage.originalSizeMB}MB → ${processedImage.finalSizeMB}MB`);
      } else {
        setUploadStatus(`Ready: ${processedImage.originalName} (${processedImage.originalSizeMB}MB)`);
      }
      
      // Pass to parent component
      if (onImageUpload) {
        onImageUpload(processedImage);
      }
    } catch (error) {
      setUploadStatus(`Error: ${error.message}`);
      console.error('Upload error:', error);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const resetUpload = () => {
    setPreviewImage(null);
    setUploadStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`image-uploader ${className}`}>
      {!previewImage ? (
        <div
          className={`upload-area border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
            ${isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileInput}
        >
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          
          <p className="text-lg font-medium text-gray-700 mb-2">
            Drag & drop your image here
          </p>
          <p className="text-sm text-gray-500 mb-4">
            or click to browse from your computer
          </p>
          <p className="text-xs text-gray-400">
            Any artwork, photo, or image you connect with
          </p>
          <p className="text-xs text-gray-400 mt-1">
            PNG, JPG, WEBP up to 10MB (auto-compressed if needed)
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
          />
        </div>
      ) : (
        <div className="preview-area">
          <div className="relative rounded-lg overflow-hidden shadow-lg">
            <img
              src={previewImage}
              alt="Uploaded preview"
              className="w-full h-auto max-h-96 object-contain bg-gray-100"
            />
            <button
              onClick={resetUpload}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
              title="Remove image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {uploadStatus && (
            <div className={`mt-3 p-2 rounded text-sm text-center
              ${uploadStatus.includes('Error') ? 'bg-red-100 text-red-700' : 
                uploadStatus.includes('Compressed') ? 'bg-yellow-100 text-yellow-700' : 
                'bg-green-100 text-green-700'}`}>
              {uploadStatus}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;