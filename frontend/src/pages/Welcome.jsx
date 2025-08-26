import { useNavigate } from 'react-router-dom';
import Logo from '../components/common/Logo';
import Button from '../components/common/Button';

const Welcome = () => {
  const navigate = useNavigate();

  const handleGenerate = () => {
    navigate('/mode');
  };

  const handleReflect = () => {
    navigate('/reflect');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col items-center justify-center px-4">
      <div className="mb-16">
        <Logo />
      </div>
      
      <div className="flex flex-col items-center gap-6 w-full max-w-md">
        <Button 
          variant="primary" 
          size="large"
          onClick={handleGenerate}
          fullWidth
          className="min-w-[280px]"
        >
          Generate
        </Button>
        
        <Button 
          variant="primary" 
          size="large"
          onClick={handleReflect}
          fullWidth
          className="min-w-[280px]"
        >
          Reflect
        </Button>
      </div>
    </div>
  );
};

export default Welcome;