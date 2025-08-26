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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col items-center justify-center px-4">
      <div className="mb-12">
        <Logo />
      </div>
      
      <div className="flex flex-col items-center gap-6 w-full max-w-lg">
        <Button 
          variant="primary" 
          size="large"
          onClick={handleCreateOriginal}
          fullWidth
          className="text-xl"
        >
          Create Original Work
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
    </div>
  );
};

export default ModeSelection;