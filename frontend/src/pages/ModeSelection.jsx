import { useNavigate } from 'react-router-dom';
import Logo from '../components/common/Logo';
import Button from '../components/common/Button';

const ModeSelection = () => {
  const navigate = useNavigate();

  const handleCreateOriginal = () => {
    navigate('/describe');
  };

  const handleTransformImage = () => {
    navigate('/edit');
  };

  const handleInspireMe = () => {
    navigate('/inspire');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col items-center justify-center px-4">
      <div className="mb-12">
        <Logo />
      </div>
      
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Choose Your Creative Path</h1>
      <p className="text-gray-600 text-center mb-8 max-w-md">
        Express your pain through art in the way that feels right for you
      </p>
      
      <div className="flex flex-col items-center gap-6 w-full max-w-lg">
        <Button 
          variant="primary" 
          size="large"
          onClick={handleCreateOriginal}
          fullWidth
          className="text-xl"
        >
          Create Original Art
        </Button>
        
        <Button 
          variant="primary" 
          size="large"
          onClick={handleTransformImage}
          fullWidth
          className="text-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          Transform Your Image
        </Button>
        
        <Button 
          variant="secondary" 
          size="medium"
          onClick={handleInspireMe}
          className="px-16"
        >
          Inspire Me
        </Button>
      </div>
      
      <div className="mt-12 text-center">
        <button
          onClick={() => navigate('/gallery')}
          className="text-purple-600 hover:text-purple-800 font-medium"
        >
          View Your Gallery →
        </button>
      </div>
    </div>
  );
};

export default ModeSelection;