import PropTypes from 'prop-types';

/**
 * Available aspect ratios with visual preview shapes
 */
const ASPECT_RATIOS = [
  { id: '1:1', label: 'Square', width: 24, height: 24 },
  { id: '16:9', label: 'Landscape', width: 32, height: 18 },
  { id: '9:16', label: 'Portrait', width: 18, height: 32 },
  { id: '4:3', label: 'Classic', width: 28, height: 21 },
  { id: '3:4', label: 'Portrait Classic', width: 21, height: 28 },
];

/**
 * AspectRatioSelector - Visual selector for image aspect ratios
 * 
 * Displays clickable preview shapes that represent each aspect ratio option.
 * Default is '1:1' (Square).
 */
const AspectRatioSelector = ({
  value = '1:1',
  onChange,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Aspect Ratio
      </label>
      <div className="flex flex-wrap gap-2">
        {ASPECT_RATIOS.map((ratio) => {
          const isSelected = value === ratio.id;
          const scale = 1.2; // Scale factor for the preview shape
          
          return (
            <button
              key={ratio.id}
              type="button"
              onClick={() => onChange(ratio.id)}
              disabled={disabled}
              className={`
                flex flex-col items-center p-2 rounded-lg border-2 transition-all duration-200
                ${isSelected
                  ? 'border-primary bg-primary-light'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              title={ratio.label}
            >
              {/* Visual shape preview */}
              <div
                className={`
                  rounded-sm transition-colors mb-1
                  ${isSelected ? 'bg-primary' : 'bg-gray-300'}
                `}
                style={{
                  width: ratio.width * scale,
                  height: ratio.height * scale,
                }}
              />
              <span className={`text-xs ${isSelected ? 'text-primary font-medium' : 'text-gray-500'}`}>
                {ratio.id}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

AspectRatioSelector.propTypes = {
  value: PropTypes.oneOf(['1:1', '16:9', '9:16', '4:3', '3:4']),
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default AspectRatioSelector;
