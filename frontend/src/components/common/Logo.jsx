import { useNavigate } from 'react-router-dom';

const Logo = ({ size = 'default', showText = false }) => {
  const navigate = useNavigate();

  const sizeClasses = {
    small: 'w-8 h-8',
    default: 'w-10 h-10',
    large: 'w-12 h-12',
    hero: 'w-[250px] h-[250px]',
  };

  return (
    <div
      className="flex items-center gap-3 cursor-pointer group"
      onClick={() => navigate('/')}
    >
      <img
        src="/assets/logo-variants/brain-icon-v3.jpg"
        alt="Pain+ Logo"
        className={`${sizeClasses[size]} object-cover rounded-md group-hover:scale-105 transition-transform duration-300`}
      />
      {showText && (
        <span className="text-xl font-bold">
          <span className="text-secondary">p</span>
          <span className="text-primary">ain</span>
          <span className="text-secondary">+</span>
        </span>
      )}
    </div>
  );
};

export default Logo;