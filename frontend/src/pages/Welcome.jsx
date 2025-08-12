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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="mb-16">
        <Logo />
      </div>
      
      <div className="space-y-8">
        <Button 
          variant="primary" 
          size="large"
          onClick={handleGenerate}
        >
          Generate
        </Button>
        
        <Button 
          variant="primary" 
          size="large"
          onClick={handleReflect}
        >
          Reflect
        </Button>
      </div>
    </div>
  );
};

export default Welcome;