import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/common/Logo';
import Button from '../components/common/Button';
import TextInput from '../components/forms/TextInput';
import { painPlusAPI } from '../services/api';

const PainDescription = () => {
  const navigate = useNavigate();
  const [painDescription, setPainDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [prompts, setPrompts] = useState([]);
  const [showPrompts, setShowPrompts] = useState(false);
  const [error, setError] = useState('');

  const handlePrompt = async () => {
    if (!painDescription.trim()) {
      setError('Please describe your pain first');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await painPlusAPI.generatePrompt(painDescription);
      if (response.success) {
        setPrompts(response.prompts);
        setShowPrompts(true);
      }
    } catch (err) {
      console.error('Error generating prompts:', err);
      setError('Failed to generate prompts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisualize = async () => {
    if (!painDescription.trim()) {
      setError('Please describe your pain first');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await painPlusAPI.generateImage(painDescription);
      if (response.success) {
        // Navigate to visualization page with the generated image
        navigate('/visualize', { 
          state: { 
            imageUrl: response.image_url,
            description: painDescription,
            promptUsed: response.prompt_used
          } 
        });
      }
    } catch (err) {
      console.error('Error generating image:', err);
      setError('Failed to generate visualization. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="mb-12">
        <Logo />
      </div>
      
      <div className="w-full max-w-lg flex flex-col items-center">
        <div className="mb-8 w-full">
          <TextInput
            value={painDescription}
            onChange={(e) => {
              setPainDescription(e.target.value);
              setError('');
            }}
            placeholder="Describe your pain"
            className="w-full text-center"
          />
          
          {error && (
            <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
          )}
        </div>
        
        <div className="flex gap-6">
          <Button 
            variant="primary" 
            size="medium"
            onClick={handlePrompt}
            disabled={isLoading}
            className="px-8 py-3"
          >
            {isLoading ? 'Generating...' : 'Prompt'}
          </Button>
          
          <Button 
            variant="primary" 
            size="medium"
            onClick={handleVisualize}
            disabled={isLoading}
            className="px-8 py-3"
          >
            {isLoading ? 'Creating...' : 'Visualize'}
          </Button>
        </div>
      </div>

      {/* Display prompts if generated */}
      {showPrompts && prompts.length > 0 && (
        <div className="mt-12 w-full max-w-2xl">
          <h3 className="text-xl font-semibold mb-4 text-primary">Creative Prompts for You:</h3>
          <div className="space-y-4">
            {prompts.map((prompt, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium text-gray-800">{prompt.prompt}</p>
                {prompt.technique && (
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">Technique:</span> {prompt.technique}
                  </p>
                )}
                {prompt.emotional_focus && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Focus:</span> {prompt.emotional_focus}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PainDescription;