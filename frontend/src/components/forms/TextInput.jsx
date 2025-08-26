import PropTypes from 'prop-types';

const TextInput = ({
  value,
  onChange,
  placeholder = 'Describe your pain',
  className = '',
  fullWidth = false,
  ...props
}) => {
  const widthStyles = fullWidth ? 'w-full' : 'w-full max-w-[600px]';
  
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`${widthStyles} px-6 py-4 text-lg bg-white text-gray-800 placeholder-gray-400 rounded-lg border-2 border-primary outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-md focus:shadow-lg ${className}`}
      {...props}
    />
  );
};

TextInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  fullWidth: PropTypes.bool
};

export default TextInput;