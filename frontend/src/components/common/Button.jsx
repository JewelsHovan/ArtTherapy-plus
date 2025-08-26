import PropTypes from 'prop-types';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'large',
  className = '',
  fullWidth = false,
  ...props 
}) => {
  const baseStyles = 'font-inter font-medium rounded-lg transition-all duration-300 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl';
  
  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-opacity-90 border-2 border-primary',
    secondary: 'bg-secondary text-white hover:bg-opacity-90 border-2 border-secondary',
    outline: 'bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white'
  };
  
  const sizeStyles = {
    small: 'px-6 py-2.5 text-base',
    medium: 'px-8 py-3.5 text-lg',
    large: 'px-10 py-4 text-xl min-h-[60px] flex items-center justify-center'
  };
  
  const widthStyles = fullWidth ? 'w-full' : '';
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
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
  className: PropTypes.string,
  fullWidth: PropTypes.bool
};

export default Button;