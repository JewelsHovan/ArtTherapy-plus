import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Registration = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    // TODO: Implement actual signup logic
    console.log('Signing up with email:', email);
    
    setTimeout(() => {
      setIsLoading(false);
      navigate('/');
    }, 1500);
  };

  const handleGoogleSignup = () => {
    // TODO: Implement Google OAuth
    console.log('Signing up with Google');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-orange-500 flex flex-col items-center justify-center relative">
      {/* Profile/Settings button in top right */}
      <button 
        className="absolute top-8 right-8 w-12 h-12 bg-primary rounded-full hover:bg-opacity-90 transition-all"
        onClick={() => navigate('/settings')}
        aria-label="Settings"
      />

      <div className="max-w-md w-full px-8">
        {/* Logo with circular text */}
        <div className="mb-8">
          <div className="w-56 h-56 mx-auto">
            <img 
              src="/assets/pain-plus-logo-with-text.png" 
              alt="Pain+ Logo - Turning Pain Into Power"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Create account text */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary mb-2">Create an account</h1>
          <p className="text-primary text-sm">Enter your email to sign up for this app</p>
        </div>

        {/* Email signup form */}
        <form onSubmit={handleEmailSignup} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@domain.com"
            className="w-full px-4 py-3 rounded-lg text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-opacity-90 transition-all disabled:opacity-50"
          >
            {isLoading ? 'Signing up...' : 'Sign up with email'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-orange-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-transparent text-orange-100">or continue with</span>
          </div>
        </div>

        {/* Google signup */}
        <button
          onClick={handleGoogleSignup}
          className="w-full py-3 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </button>

        {/* Terms and Privacy */}
        <p className="text-center text-xs text-primary mt-6">
          By clicking continue, you agree to our{' '}
          <a href="#" className="underline hover:text-opacity-80">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="underline hover:text-opacity-80">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};

export default Registration;