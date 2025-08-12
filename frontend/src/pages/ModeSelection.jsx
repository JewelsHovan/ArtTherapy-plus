import { useNavigate } from 'react-router-dom';
import Logo from '../components/common/Logo';
import Button from '../components/common/Button';

const ModeSelection = () => {
  const navigate = useNavigate();

  const handleCreateOriginal = () => {
    navigate('/describe');
  };

  const handleInspireMe = () => {
    navigate('/inspire');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="mb-12">
        <Logo />
      </div>
      
      <div className="flex flex-col items-center space-y-6 w-full max-w-md">
        <Button 
          variant="primary" 
          size="large"
          onClick={handleCreateOriginal}
          className="w-full text-lg py-4"
        >
          Create Original Work
        </Button>
        
        <Button 
          variant="primary" 
          size="medium"
          onClick={handleInspireMe}
          className="px-12 py-3"
        >
          Inspire Me
        </Button>
      </div>
    </div>
  );
};

export default ModeSelection;