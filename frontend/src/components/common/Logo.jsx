import { useNavigate } from 'react-router-dom';

const Logo = () => {
  const navigate = useNavigate();

  return (
    <div 
      className="flex items-center justify-center cursor-pointer"
      onClick={() => navigate('/')}
    >
      <img 
        src="/assets/pain-plus-logo.png" 
        alt="Pain+ Logo - Turning Pain Into Power"
        className="w-[250px] h-[250px] object-contain hover:scale-105 transition-transform duration-300"
      />
    </div>
  );
};

export default Logo;