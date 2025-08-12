import PropTypes from 'prop-types';

const TextInput = ({
  value,
  onChange,
  placeholder = 'Describe your pain',
  className = '',
  ...props
}) => {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full max-w-[500px] px-6 py-4 text-2xl bg-primary text-white placeholder-gray-300 rounded-[5px] outline-none focus:ring-2 focus:ring-secondary transition-all ${className}`}
      {...props}
    />
  );
};

TextInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  className: PropTypes.string
};

export default TextInput;