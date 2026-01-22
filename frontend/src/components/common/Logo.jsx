import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const Logo = ({ size = 'default', showText = false }) => {
  const navigate = useNavigate();

  const sizeClasses = {
    small: 'w-8 h-8',
    default: 'w-10 h-10',
    large: 'w-12 h-12',
    hero: 'w-[250px] h-[250px]',
  };

  const handleClick = () => {
    navigate('/');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate('/');
    }
  };

  return (
    <div
      className="flex items-center gap-3 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="link"
      aria-label="Go to home page"
    >
      <img
        src="/assets/logo-variants/brain-icon-v3.jpg"
        alt="Pain+ Logo"
        className={`${sizeClasses[size]} object-cover rounded-md group-hover:scale-105 transition-transform duration-300`}
      />
      {showText && (
        <span className="text-xl font-bold font-display">
          <span className="text-secondary">p</span>
          <span className="text-primary">ain</span>
          <span className="text-secondary">+</span>
        </span>
      )}
    </div>
  );
};

Logo.propTypes = {
  size: PropTypes.oneOf(['small', 'default', 'large', 'hero']),
  showText: PropTypes.bool
};

export default Logo;
