import PropTypes from 'prop-types';

const SelectInput = ({
  id,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  className = '',
  fullWidth = false,
  label,
  error,
  disabled = false,
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
      <div className="relative">
        <select
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={errorId}
          className={`${widthStyles} px-6 py-4 text-lg bg-white text-gray-800 rounded-lg border-2 ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-primary focus:ring-primary focus:border-transparent'
          } outline-none focus:ring-2 transition-all shadow-md focus:shadow-lg appearance-none cursor-pointer ${
            disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {/* Custom dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          <svg
            className={`w-5 h-5 ${disabled ? 'text-gray-400' : 'text-gray-600'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
      {error && (
        <p id={errorId} className="text-red-500 text-sm mt-2" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

SelectInput.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  placeholder: PropTypes.string,
  className: PropTypes.string,
  fullWidth: PropTypes.bool,
  label: PropTypes.string,
  error: PropTypes.string,
  disabled: PropTypes.bool,
};

export default SelectInput;
