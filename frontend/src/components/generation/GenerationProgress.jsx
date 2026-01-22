import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Generation stages with timing
 */
const STAGES = [
  { id: 'prompt', label: 'Crafting prompt...', duration: 2000 },
  { id: 'generating', label: 'Generating artwork...', duration: 8000 },
  { id: 'finalizing', label: 'Finalizing...', duration: 2000 },
];

/**
 * GenerationProgress - Animated loading indicator with stages
 * 
 * Shows animated progress through generation stages:
 * 1. Crafting prompt...
 * 2. Generating artwork...
 * 3. Finalizing...
 * 
 * Optionally shows model count for Compare Mode.
 */
const GenerationProgress = ({
  isVisible = false,
  modelCount = 1,
  className = '',
}) => {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setCurrentStage(0);
      return;
    }

    // Progress through stages based on timing
    let totalTime = 0;
    const timers = [];

    STAGES.forEach((stage, index) => {
      if (index > 0) {
        totalTime += STAGES[index - 1].duration;
        const timer = setTimeout(() => {
          setCurrentStage(index);
        }, totalTime);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const stage = STAGES[currentStage];

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-fadeIn">
        {/* Animated Art Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Outer ring animation */}
            <div className="w-20 h-20 rounded-full border-4 border-primary/20 animate-pulse" />
            
            {/* Inner spinning ring */}
            <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-primary animate-spin" />
            
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Stage Label */}
        <h3 className="text-xl font-semibold text-center text-gray-800 mb-2">
          {stage.label}
        </h3>

        {/* Model Count (for Compare Mode) */}
        {modelCount > 1 && (
          <p className="text-center text-gray-500 text-sm mb-4">
            Creating from {modelCount} models
          </p>
        )}

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mt-4">
          {STAGES.map((s, index) => (
            <div
              key={s.id}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index <= currentStage ? 'bg-primary scale-110' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Therapeutic Message */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Your artwork is being created with care
        </p>
      </div>
    </div>
  );
};

GenerationProgress.propTypes = {
  isVisible: PropTypes.bool,
  modelCount: PropTypes.number,
  className: PropTypes.string,
};

export default GenerationProgress;
