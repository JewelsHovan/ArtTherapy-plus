import { useNavigate } from 'react-router-dom';
import Logo from '../components/common/Logo';

const ModeSelection = () => {
  const navigate = useNavigate();

  const handleCreateOriginal = () => {
    navigate('/describe');
  };

  const handleTransformImage = () => {
    navigate('/edit');
  };

  const handleInspireMe = () => {
    navigate('/inspire');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Clean card container */}
      <div className="card-clean max-w-2xl w-full animate-fadeIn">
        <div className="text-center mb-8">
          <div className="mb-8">
            <Logo />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Choose Your Creative Path
          </h1>
          <p className="text-gray-600 text-lg max-w-md mx-auto">
            Express your pain through art in the way that feels right for you
          </p>
        </div>
        
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Create Original Art Button - Primary Blue */}
          <button
            onClick={handleCreateOriginal}
            className="w-full py-4 px-6 bg-[#3B82F6] text-white rounded-xl font-semibold text-lg
              hover:bg-[#2563EB] transform hover:-translate-y-1 transition-all duration-300
              shadow-md hover:shadow-lg"
          >
            <span className="flex items-center justify-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Create Original Art
            </span>
          </button>
          
          {/* Transform Your Image Button - Secondary Orange */}
          <button
            onClick={handleTransformImage}
            className="w-full py-4 px-6 bg-[#F59E0B] text-white rounded-xl font-semibold text-lg
              hover:bg-[#D97706] transform hover:-translate-y-1 transition-all duration-300
              shadow-md hover:shadow-lg"
          >
            <span className="flex items-center justify-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Transform Your Image
            </span>
          </button>
          
          {/* Inspire Me Button - Outline Style */}
          <button
            onClick={handleInspireMe}
            className="w-full py-4 px-6 bg-transparent text-[#3B82F6] border-2 border-[#3B82F6] 
              rounded-xl font-semibold text-lg hover:bg-[#3B82F6] hover:text-white
              transform hover:-translate-y-1 transition-all duration-300
              shadow-md hover:shadow-lg"
          >
            <span className="flex items-center justify-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Inspire Me
            </span>
          </button>
        </div>
        
        {/* Gallery Link */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/gallery')}
            className="text-gray-600 hover:text-gray-800 px-6 py-2 rounded-full
              transition-all duration-300 font-medium hover:bg-gray-100"
          >
            View Your Gallery →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModeSelection;