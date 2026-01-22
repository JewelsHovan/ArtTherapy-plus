import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import OnboardingModal from '../components/modals/OnboardingModal';

const ModeSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const onboardingCompleted = localStorage.getItem('onboarding_completed');
    if (!onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, []);

  const handleCreateOriginal = () => {
    navigate('/describe');
  };

  const handleTransformImage = () => {
    navigate('/edit');
  };

  const handleInspireMe = () => {
    navigate('/inspire');
  };

  const firstName = user?.name?.split(' ')[0] || '';

  return (
    <div className="min-h-screen watercolor-bg px-4 py-8 pt-14 sm:pt-20">
      <div className="max-w-4xl w-full mx-auto flex flex-col items-center">
        {/* Header with personalized greeting */}
        <div className="text-center mb-12 animate-fadeIn">
          <h1 className="text-4xl font-display font-bold text-gray-800 mb-3">
            {firstName ? `Welcome back, ${firstName}` : 'Choose Your Creative Path'}
          </h1>
          <p className="text-gray-600 text-lg max-w-md mx-auto">
            Express your feelings through art in the way that feels right for you
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full">
          {/* Create Original Art Card */}
          <button
            onClick={handleCreateOriginal}
            className="feature-card p-8 text-left group cursor-pointer animate-fadeIn"
            style={{ animationDelay: '100ms' }}
          >
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Create Original Art</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Describe your feelings and watch AI transform them into unique, meaningful artwork
            </p>
          </button>

          {/* Transform Your Image Card */}
          <button
            onClick={handleTransformImage}
            className="feature-card p-8 text-left group cursor-pointer animate-fadeIn"
            style={{ animationDelay: '200ms' }}
          >
            <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Transform Your Image</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Upload any image and transform it into artwork with your story
            </p>
          </button>

          {/* Inspire Me Card */}
          <button
            onClick={handleInspireMe}
            className="feature-card p-8 text-left group cursor-pointer animate-fadeIn"
            style={{ animationDelay: '300ms' }}
          >
            <div className="w-14 h-14 bg-accent/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-accent-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Inspire Me</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Not sure where to start? Let curated prompts guide your creative journey
            </p>
          </button>
        </div>

        {/* Gallery Preview Teaser */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 mb-8 animate-fadeIn w-full" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Your Art Gallery</h3>
                <p className="text-sm text-gray-500">View and reflect on your creative journey</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/gallery')}
              className="px-5 py-2.5 bg-primary/10 text-primary rounded-xl font-medium hover:bg-primary/20 transition-colors"
            >
              View Gallery
            </button>
          </div>
        </div>

        {/* Journal Teaser */}
        <div
          className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border-l-4 border-secondary animate-fadeIn w-full"
          style={{ animationDelay: '500ms' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Reflection Journal</h3>
                <p className="text-sm text-gray-500">Record your thoughts and insights</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/journal')}
              className="px-5 py-2.5 bg-secondary/10 text-secondary-dark rounded-xl font-medium hover:bg-secondary/20 transition-colors"
            >
              Open Journal
            </button>
          </div>
        </div>
      </div>

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </div>
  );
};

export default ModeSelection;
