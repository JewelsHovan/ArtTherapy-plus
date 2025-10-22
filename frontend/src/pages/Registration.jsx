import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { painPlusAPI } from '../services/api';
import Button from '../components/common/Button';
import Logo from '../components/common/Logo';

export default function Registration() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
      const redirectUri = `${window.location.origin}/oauth-callback.html`;

      const authUrl =
        `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent('openid email profile')}&` +
        `response_mode=query`;

      // Open OAuth popup
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        'Microsoft Login',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for OAuth callback message
      const handleMessage = async (event) => {
        // Security: verify origin
        if (!event.origin.startsWith(window.location.origin)) {
          return;
        }

        if (event.data.type === 'microsoft-oauth-callback') {
          window.removeEventListener('message', handleMessage);

          const { code, error: oauthError } = event.data;

          if (oauthError) {
            setError('Authentication failed. Please try again.');
            setIsLoading(false);
            return;
          }

          try {
            // Exchange code for JWT
            const response = await painPlusAPI.auth.microsoftCallback(code);
            const { token, user } = response.data;

            // Update auth context
            login(token, user);

            // Redirect to authenticated home
            navigate('/mode');
          } catch (err) {
            console.error('OAuth callback error:', err);
            setError('Authentication failed. Please try again.');
            setIsLoading(false);
          }
        }
      };

      window.addEventListener('message', handleMessage);

      // Handle popup closed without completing
      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          window.removeEventListener('message', handleMessage);
          setIsLoading(false);
        }
      }, 500);

    } catch (err) {
      console.error('Microsoft login error:', err);
      setError('Failed to initiate login. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-md w-full">
        {/* Logo and header */}
        <div className="text-center mb-8">
          <Logo className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome to Pain+ Art Therapy
          </h1>
          <p className="text-gray-600">
            Transform pain into art through creative expression
          </p>
        </div>

        {/* Registration card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Sign In
          </h2>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Microsoft OAuth button */}
          <Button
            onClick={handleMicrosoftLogin}
            disabled={isLoading}
            fullWidth
            className="mb-4"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M0 0h11v11H0z"/>
                  <path fill="#81bc06" d="M12 0h11v11H12z"/>
                  <path fill="#05a6f0" d="M0 12h11v11H0z"/>
                  <path fill="#ffba08" d="M12 12h11v11H12z"/>
                </svg>
                Sign in with Microsoft
              </span>
            )}
          </Button>

          <p className="text-sm text-gray-600 text-center mt-4">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-primary hover:underline text-sm"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
