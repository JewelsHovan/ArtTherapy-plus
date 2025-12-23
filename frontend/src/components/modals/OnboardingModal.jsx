import { useState, useEffect, useRef, useCallback } from 'react';

const ONBOARDING_STEPS = [
  {
    emoji: '🎨',
    title: 'Welcome to ArtTherapy+',
    description:
      'Transform your feelings into meaningful art using AI-powered creative tools. Express pain, stress, or emotions through a guided artistic journey designed to promote healing and self-discovery.',
  },
  {
    emoji: '✨',
    title: 'Choose Your Creative Mode',
    description:
      'Create Original Art from your descriptions, Transform Your Images into therapeutic artwork, or let Inspire Me guide you with creative prompts when you need a starting point.',
  },
  {
    emoji: '💭',
    title: 'Reflect and Grow',
    description:
      'After creating your artwork, use our reflection tools to explore the emotions and meanings behind your art. Thoughtful questions help deepen your understanding and promote personal growth.',
  },
];

const OnboardingModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  const handleComplete = useCallback(() => {
    localStorage.setItem('onboarding_completed', 'true');
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setCurrentStep(0);
      setIsClosing(false);
    }, 300);
  }, [onClose]);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      modalRef.current?.focus();

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          handleComplete();
        }
        if (e.key === 'Tab') {
          const focusableElements = modalRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements && focusableElements.length > 0) {
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey && document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleComplete]);

  // Restore focus on close
  useEffect(() => {
    if (!isOpen && previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isOpen && !isClosing) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleSkip}
      />

      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className={`relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transition-transform duration-300 ${
          isClosing ? 'scale-95' : 'scale-100'
        }`}
      >
        <div className="p-8 text-center">
          {/* Emoji placeholder */}
          <div className="text-7xl mb-6">{step.emoji}</div>

          {/* Title */}
          <h2
            id="onboarding-title"
            className="text-2xl font-bold text-gray-800 mb-4"
          >
            {step.title}
          </h2>

          {/* Description */}
          <p className="text-gray-600 leading-relaxed mb-8">
            {step.description}
          </p>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'bg-primary w-6'
                    : index < currentStep
                      ? 'bg-primary'
                      : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3">
            {!isLastStep && (
              <button
                onClick={handleSkip}
                className="flex-1 py-3 px-6 text-gray-600 border border-gray-300 rounded-xl font-medium
                  hover:bg-gray-50 transition-all duration-300"
              >
                Skip
              </button>
            )}
            <button
              onClick={handleNext}
              className={`py-3 px-6 bg-primary text-white rounded-xl font-semibold
                hover:bg-primary-hover transition-all duration-300 shadow-md hover:shadow-lg
                ${isLastStep ? 'flex-1' : 'flex-1'}`}
            >
              {isLastStep ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
