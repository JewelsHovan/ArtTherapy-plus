import { useState, useRef } from 'react';
import PropTypes from 'prop-types';

const TagInput = ({
  id,
  name,
  value = [],
  onChange,
  suggestions = [],
  placeholder = 'Type and press Enter',
  className = '',
  fullWidth = false,
  label,
  error,
  disabled = false,
  maxTags = 10,
  ...props
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const widthStyles = fullWidth ? 'w-full' : 'w-full max-w-[600px]';
  const inputId = id || name;
  const errorId = error && inputId ? `${inputId}-error` : undefined;

  // Filter suggestions based on input and exclude already selected
  const filteredSuggestions = suggestions.filter(
    (suggestion) =>
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(suggestion)
  );

  const addTag = (tag) => {
    const trimmedTag = tag.trim();
    if (
      trimmedTag &&
      !value.includes(trimmedTag) &&
      value.length < maxTags
    ) {
      onChange([...value, trimmedTag]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setShowSuggestions(e.target.value.length > 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove last tag when backspace on empty input
      removeTag(value[value.length - 1]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    addTag(suggestion);
    inputRef.current?.focus();
  };

  const handleBlur = (e) => {
    // Check if the related target is inside our container (clicking a suggestion)
    if (containerRef.current?.contains(e.relatedTarget)) {
      return;
    }
    // Add current input as tag if not empty
    if (inputValue.trim()) {
      addTag(inputValue);
    }
    setShowSuggestions(false);
  };

  const handleFocus = () => {
    if (inputValue.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className={fullWidth ? 'w-full' : ''} ref={containerRef}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <div
          className={`${widthStyles} min-h-[56px] px-4 py-2 bg-white rounded-lg border-2 ${
            error
              ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500'
              : 'border-primary focus-within:ring-primary focus-within:border-transparent'
          } outline-none focus-within:ring-2 transition-all shadow-md focus-within:shadow-lg ${
            disabled ? 'opacity-50 bg-gray-50' : ''
          } ${className}`}
        >
          <div className="flex flex-wrap gap-2 items-center">
            {/* Tags */}
            {value.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary rounded-full px-3 py-1 text-sm"
              >
                {tag}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                    aria-label={`Remove ${tag}`}
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </span>
            ))}
            {/* Input */}
            {value.length < maxTags && (
              <input
                ref={inputRef}
                type="text"
                id={inputId}
                name={name}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                onFocus={handleFocus}
                disabled={disabled}
                placeholder={value.length === 0 ? placeholder : ''}
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={errorId}
                className="flex-1 min-w-[120px] py-1 text-lg bg-transparent outline-none placeholder-gray-400"
                {...props}
              />
            )}
          </div>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && !disabled && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onMouseDown={(e) => e.preventDefault()} // Prevent blur
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors first:rounded-t-lg last:rounded-b-lg"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-red-500 text-sm mt-2" role="alert">
          {error}
        </p>
      )}
      {value.length >= maxTags && (
        <p className="text-gray-500 text-sm mt-2">
          Maximum of {maxTags} items reached
        </p>
      )}
    </div>
  );
};

TagInput.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  suggestions: PropTypes.arrayOf(PropTypes.string),
  placeholder: PropTypes.string,
  className: PropTypes.string,
  fullWidth: PropTypes.bool,
  label: PropTypes.string,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  maxTags: PropTypes.number,
};

export default TagInput;
