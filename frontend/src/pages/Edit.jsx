import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ImageUploader from "../components/ImageUploader";
import EditPromptInput from "../components/EditPromptInput";
import EditVisualization from "../components/EditVisualization";
import { painPlusAPI } from "../services/api";
import { galleryStorage } from "../utils/storage";

const Edit = () => {
  const navigate = useNavigate();
  const [uploadedImage, setUploadedImage] = useState(null);
  const [painDescription, setPainDescription] = useState("");
  const [transformedImage, setTransformedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // 1: Upload, 2: Describe, 3: View
  const [isSaved, setIsSaved] = useState(false);

  const handleImageUpload = (processedImage) => {
    setUploadedImage(processedImage);
    setError(null);
    // Auto-advance to step 2
    setTimeout(() => setStep(2), 500);
  };

  const handleTransform = async () => {
    if (!uploadedImage || !painDescription.trim()) {
      setError("Please upload an image and describe your pain");
      return;
    }

    setIsLoading(true);
    setError(null);
    setStep(3); // Move to visualization step

    try {
      const response = await painPlusAPI.editImage({
        image: uploadedImage.data,
        description: painDescription,
      });

      if (response.success && response.edited_image_url) {
        setTransformedImage(response.edited_image_url);
      } else {
        throw new Error("Failed to transform image");
      }
    } catch (err) {
      setError(err.message || "An error occurred during transformation");
      console.error("Transform error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToGallery = async () => {
    if (!transformedImage || !painDescription) return;

    try {
      const saved = await galleryStorage.save({
        imageUrl: transformedImage,
        description: painDescription,
        promptUsed: painDescription,
        mode: 'edit'
      });
      if (saved) {
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Failed to save to gallery:', err);
      setError('Failed to save to gallery. Please try again.');
    }
  };

  const resetProcess = () => {
    setUploadedImage(null);
    setPainDescription("");
    setTransformedImage(null);
    setError(null);
    setStep(1);
    setIsSaved(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center text-primary hover:text-primary-hover mb-4 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </button>

          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Transform Your Image
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload any image that resonates with you and describe your pain
            experience. Our AI will create a therapeutic transformation that
            maintains the artistic style while expressing your journey.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center ${step >= 1 ? "text-primary" : "text-gray-400"}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2
                ${step >= 1 ? "border-primary bg-blue-100" : "border-gray-300 bg-white"}`}
              >
                1
              </div>
              <span className="ml-2 font-medium">Upload</span>
            </div>

            <div
              className={`w-16 h-0.5 ${step >= 2 ? "bg-primary" : "bg-gray-300"}`}
            />

            <div
              className={`flex items-center ${step >= 2 ? "text-primary" : "text-gray-400"}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2
                ${step >= 2 ? "border-primary bg-blue-100" : "border-gray-300 bg-white"}`}
              >
                2
              </div>
              <span className="ml-2 font-medium">Describe</span>
            </div>

            <div
              className={`w-16 h-0.5 ${step >= 3 ? "bg-primary" : "bg-gray-300"}`}
            />

            <div
              className={`flex items-center ${step >= 3 ? "text-primary" : "text-gray-400"}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2
                ${step >= 3 ? "border-primary bg-blue-100" : "border-gray-300 bg-white"}`}
              >
                3
              </div>
              <span className="ml-2 font-medium">Transform</span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 animate-fadeIn">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Main Content Area */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 1 && (
            <div className="animate-fadeIn">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Step 1: Upload Your Base Image
              </h2>
              <ImageUploader onImageUpload={handleImageUpload} />
            </div>
          )}

          {step === 2 && (
            <div className="animate-fadeIn">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Step 2: Describe Your Pain
              </h2>

              {uploadedImage && (
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <img
                      src={uploadedImage.data}
                      alt="Uploaded"
                      className="max-h-48 rounded-lg shadow-md"
                    />
                    <button
                      onClick={() => setStep(1)}
                      className="absolute -top-2 -right-2 bg-gray-600 text-white p-1 rounded-full hover:bg-gray-700"
                      title="Change image"
                      aria-label="Change image"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              <EditPromptInput
                value={painDescription}
                onChange={setPainDescription}
                onSubmit={handleTransform}
                isLoading={isLoading}
              />
            </div>
          )}

          {step === 3 && (
            <div className="animate-fadeIn">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Your Therapeutic Transformation
                </h2>
              </div>

              <EditVisualization
                originalImage={uploadedImage?.data}
                painDescription={painDescription}
                transformedImage={transformedImage}
                isLoading={isLoading}
              />

              {transformedImage && !isLoading && (
                <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                  {!isSaved ? (
                    <button
                      onClick={handleSaveToGallery}
                      className="px-6 py-3 bg-secondary text-white rounded-lg hover:bg-secondary-hover transition-all duration-300 font-medium shadow-md"
                    >
                      Save to Gallery
                    </button>
                  ) : (
                    <div className="px-6 py-3 bg-green-50 text-green-700 rounded-lg font-medium text-center">
                      ✓ Saved to Gallery
                    </div>
                  )}
                  <button
                    onClick={resetProcess}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 font-medium"
                  >
                    Start New Transformation
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Edit;

