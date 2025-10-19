import { useNavigate } from 'react-router-dom';
import Logo from '../components/common/Logo';

const Welcome = () => {
  const navigate = useNavigate();

  const handleGenerate = () => {
    navigate('/mode');
  };

  const handleReflect = () => {
    navigate('/reflect');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="card-clean max-w-xl w-full animate-fadeIn text-center py-12">
        <div className="mb-12">
          <Logo />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Transform Pain Into Power
        </h1>
        <p className="text-gray-600 text-lg mb-10 max-w-md mx-auto">
          Your journey of healing through creative expression begins here
        </p>
        
        <div className="flex flex-col items-center gap-4 w-full px-8">
          <button
            onClick={handleGenerate}
            className="w-full py-4 px-6 bg-[#3B82F6] text-white rounded-xl font-semibold text-lg
              hover:bg-[#2563EB] transform hover:-translate-y-1 transition-all duration-300
              shadow-md hover:shadow-lg"
          >
            <span className="flex items-center justify-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Generate Art
            </span>
          </button>
          
          <button
            onClick={handleReflect}
            className="w-full py-4 px-6 bg-[#F59E0B] text-white rounded-xl font-semibold text-lg
              hover:bg-[#D97706] transform hover:-translate-y-1 transition-all duration-300
              shadow-md hover:shadow-lg"
          >
            <span className="flex items-center justify-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Reflect & Journal
            </span>
          </button>
        </div>
        
        <div className="mt-10 text-sm text-gray-400">
          <p>Your safe space for healing through art</p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;