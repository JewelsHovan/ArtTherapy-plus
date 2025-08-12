import PropTypes from 'prop-types';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'large',
  className = '',
  ...props 
}) => {
  const baseStyles = 'font-inter font-normal rounded-[5px] transition-all duration-200 cursor-pointer';
  
  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-opacity-90',
    secondary: 'bg-secondary text-white hover:bg-opacity-90',
    outline: 'bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white'
  };
  
  const sizeStyles = {
    small: 'px-4 py-2 text-lg',
    medium: 'px-6 py-3 text-2xl',
    large: 'px-8 py-4 text-[40px] min-w-[236px] h-[75px] flex items-center justify-center'
  };
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  className: PropTypes.string
};

export default Button;