import React, { useState } from 'react';

const EditPromptInput = ({ value, onChange, onSubmit, isLoading = false }) => {
  const [isFocused, setIsFocused] = useState(false);

  const examplePrompts = [
    "Sharp stabbing pain in my lower back that radiates down my leg",
    "Throbbing headache that feels like pressure behind my eyes",
    "Burning sensation in my shoulders from stress and tension",
    "Emotional heaviness in my chest from grief and loss",
    "Aching joints that feel stiff and locked in the morning"
  ];

  const handleExampleClick = (example) => {
    onChange(example);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSubmit();
    }
  };

  return (
    <div className="edit-prompt-input w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <label 
            htmlFor="pain-description" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Describe Your Pain Experience
          </label>
          
          <textarea
            id="pain-description"
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Describe your pain experience in detail..."
            className={`w-full px-4 py-3 border rounded-lg resize-none transition-all
              ${isFocused ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-300'}
              ${isLoading ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
            rows={4}
            disabled={isLoading}
            required
          />
          
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {value.length} characters
          </div>
        </div>

        {!value && !isFocused && (
          <div className="example-prompts">
            <p className="text-xs text-gray-500 mb-2">Need inspiration? Try one of these:</p>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.slice(0, 3).map((example, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleExampleClick(example)}
                  className="text-xs px-3 py-1 bg-gray-100 hover:bg-purple-100 text-gray-700 
                    hover:text-purple-700 rounded-full transition-colors"
                >
                  {example.substring(0, 40)}...
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!value.trim() || isLoading}
          className={`w-full py-3 px-6 rounded-lg font-medium transition-all transform
            ${!value.trim() || isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:scale-[1.02] shadow-lg'
            }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating Therapeutic Transformation...
            </span>
          ) : (
            'Transform Into Therapeutic Art'
          )}
        </button>
      </form>
    </div>
  );
};

export default EditPromptInput;