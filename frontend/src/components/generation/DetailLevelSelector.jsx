import PropTypes from 'prop-types';

/**
 * Detail level options
 */
const DETAIL_LEVELS = [
  { id: 'draft', label: 'Quick Draft', description: 'Fast generation' },
  { id: 'balanced', label: 'Balanced', description: 'Good quality' },
  { id: 'max', label: 'Maximum', description: 'Highest detail' },
];

/**
 * DetailLevelSelector - Toggle buttons for selecting detail level
 * 
 * Provides three quality options from quick draft to maximum detail.
 * Default is 'balanced'.
 */
const DetailLevelSelector = ({
  value = 'balanced',
  onChange,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Detail Level
      </label>
      <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
        {DETAIL_LEVELS.map((level, index) => {
          const isSelected = value === level.id;
          const isFirst = index === 0;
          
          return (
            <button
              key={level.id}
              type="button"
              onClick={() => onChange(level.id)}
              disabled={disabled}
              className={`
                flex-1 py-2 px-3 text-center transition-all duration-200
                ${isSelected
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
                }
                ${!isFirst && !isSelected ? 'border-l-2 border-gray-200' : ''}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              title={level.description}
            >
              <span className="block text-sm font-medium">{level.label}</span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {DETAIL_LEVELS.find((l) => l.id === value)?.description}
      </p>
    </div>
  );
};

DetailLevelSelector.propTypes = {
  value: PropTypes.oneOf(['draft', 'balanced', 'max']),
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default DetailLevelSelector;
