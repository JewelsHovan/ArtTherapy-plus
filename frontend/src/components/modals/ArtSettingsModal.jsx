import { useEffect, useRef, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import ArtGenerationSettings from '../settings/ArtGenerationSettings';

const ArtSettingsModal = ({ isOpen, onClose, settings, onSettingsChange, isSaving }) => {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const [activeTab, setActiveTab] = useState('models');

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleClose();
        return;
      }

      if (event.key === 'Tab') {
        const modal = modalRef.current;
        if (!modal) return;

        const focusableSelectors = [
          'button',
          '[href]',
          'input',
          'select',
          'textarea',
          '[tabindex]:not([tabindex="-1"])',
        ];
        const focusableElements = modal.querySelectorAll(focusableSelectors.join(', '));
        const focusableArray = Array.from(focusableElements);

        if (focusableArray.length === 0) return;

        const firstElement = focusableArray[0];
        const lastElement = focusableArray[focusableArray.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="art-settings-title"
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 id="art-settings-title" className="text-xl font-semibold text-gray-900">
              Art Generation Settings
            </h2>
            <p className="text-sm text-gray-500">
              Choose your model and style for the next generation.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 rounded-full p-2 hover:bg-gray-100 transition-colors"
            aria-label="Close settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="inline-flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setActiveTab('models')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'models'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              aria-pressed={activeTab === 'models'}
            >
              Models
            </button>
            <button
              onClick={() => setActiveTab('styles')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'styles'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              aria-pressed={activeTab === 'styles'}
            >
              Styles
            </button>
          </div>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0">
          <ArtGenerationSettings
            settings={settings}
            onSettingsChange={onSettingsChange}
            isSaving={isSaving}
            showModels={activeTab === 'models'}
            showStyles={activeTab === 'styles'}
          />
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

ArtSettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  settings: PropTypes.object,
  onSettingsChange: PropTypes.func.isRequired,
  isSaving: PropTypes.bool,
};

ArtSettingsModal.defaultProps = {
  settings: {},
  isSaving: false,
};

export default ArtSettingsModal;
