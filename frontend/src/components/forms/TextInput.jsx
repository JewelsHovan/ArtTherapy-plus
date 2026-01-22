import PropTypes from 'prop-types';

const TextInput = ({
  id,
  name,
  value,
  onChange,
  placeholder = 'Describe your pain',
  className = '',
  fullWidth = false,
  label,
  error,
  ...props
}) => {
  const widthStyles = fullWidth ? 'w-full' : 'w-full max-w-[600px]';
  const inputId = id || name;
  const errorId = error && inputId ? `${inputId}-error` : undefined;

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
        </label>
      )}
      <input
        type="text"
        id={inputId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={errorId}
        className={`${widthStyles} px-6 py-4 text-lg bg-white text-gray-800 placeholder-gray-400 rounded-lg border-2 ${
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-primary focus:ring-primary focus:border-transparent'
        } outline-none focus:ring-2 transition-all shadow-md focus:shadow-lg ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-red-500 text-sm mt-2" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

TextInput.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  fullWidth: PropTypes.bool,
  label: PropTypes.string,
  error: PropTypes.string
};

export default TextInput;
