import PropTypes from 'prop-types';

/**
 * Color mood options
 */
const COLOR_MOODS = [
  { id: 'warm', label: 'Warm', color: '#F59E0B' },
  { id: 'neutral', label: 'Neutral', color: '#6B7280' },
  { id: 'cool', label: 'Cool', color: '#3B82F6' },
];

/**
 * ColorMoodSlider - Visual slider for selecting color mood
 * 
 * Shows a gradient from warm to cool with selectable positions.
 * Default is 'neutral'.
 */
const ColorMoodSlider = ({
  value = 'neutral',
  onChange,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Color Mood
      </label>
      
      {/* Gradient background track */}
      <div className="relative">
        <div 
          className="h-3 rounded-full"
          style={{
            background: 'linear-gradient(to right, #F59E0B, #9CA3AF, #3B82F6)',
          }}
        />
        
        {/* Selectable buttons */}
        <div className="absolute inset-0 flex justify-between items-center px-1">
          {COLOR_MOODS.map((mood, index) => {
            const isSelected = value === mood.id;
            const position = index === 0 ? '0%' : index === 1 ? '50%' : '100%';
            
            return (
              <button
                key={mood.id}
                type="button"
                onClick={() => onChange(mood.id)}
                disabled={disabled}
                className={`
                  w-5 h-5 rounded-full border-2 transition-all duration-200
                  ${isSelected
                    ? 'border-white shadow-lg scale-125 ring-2 ring-primary'
                    : 'border-white/80 hover:scale-110'
                  }
                  ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                `}
                style={{
                  backgroundColor: mood.color,
                  position: 'absolute',
                  left: position,
                  transform: `translateX(-50%)`,
                }}
                title={mood.label}
              />
            );
          })}
        </div>
      </div>
      
      {/* Labels */}
      <div className="flex justify-between mt-2">
        {COLOR_MOODS.map((mood) => {
          const isSelected = value === mood.id;
          return (
            <span
              key={mood.id}
              className={`text-xs ${isSelected ? 'text-primary font-medium' : 'text-gray-500'}`}
            >
              {mood.label}
            </span>
          );
        })}
      </div>
    </div>
  );
};

ColorMoodSlider.propTypes = {
  value: PropTypes.oneOf(['warm', 'neutral', 'cool']),
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default ColorMoodSlider;
