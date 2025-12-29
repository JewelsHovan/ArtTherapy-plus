import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { painPlusAPI } from '../services/api';
import Button from '../components/common/Button';
import Logo from '../components/common/Logo';
import TextInput from '../components/forms/TextInput';
import PasswordInput from '../components/forms/PasswordInput';

export default function Registration() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('signup'); // 'signup' or 'login'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [errors, setErrors] = useState({});

  // PKCE helper functions
  const generateCodeVerifier = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  const generateCodeChallenge = async (verifier) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
      const redirectUri = `${window.location.origin}/oauth-callback.html`;

      if (!clientId) {
        setError('Microsoft Client ID not configured. Check VITE_MICROSOFT_CLIENT_ID.');
        setIsLoading(false);
        return;
      }

      // Generate PKCE code verifier and challenge
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      // Store code verifier for token exchange
      sessionStorage.setItem('pkce_code_verifier', codeVerifier);

      const authUrl =
        `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent('openid email profile User.Read')}&` +
        `response_mode=query&` +
        `code_challenge=${codeChallenge}&` +
        `code_challenge_method=S256`;

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

      if (!popup) {
        setError('Popup was blocked. Please allow popups for this site.');
        setIsLoading(false);
        return;
      }

      // Clear any previous OAuth result
      localStorage.removeItem('oauth_result');

      // Process OAuth result (from localStorage or postMessage)
      const processOAuthResult = async (code, oauthError) => {
        if (oauthError) {
          setError('Authentication failed. Please try again.');
          setIsLoading(false);
          return;
        }

        if (!code) {
          setError('Authentication failed. No authorization code received.');
          setIsLoading(false);
          return;
        }

        try {
          // Get code verifier from storage
          const codeVerifier = sessionStorage.getItem('pkce_code_verifier');
          sessionStorage.removeItem('pkce_code_verifier');

          // For SPA + PKCE, we must exchange the code from the browser (not backend)
          // Microsoft requires cross-origin token exchange for SPA apps
          const tokenResponse = await fetch(
            'https://login.microsoftonline.com/common/oauth2/v2.0/token',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                client_id: import.meta.env.VITE_MICROSOFT_CLIENT_ID,
                code,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
                code_verifier: codeVerifier,
                scope: 'openid email profile User.Read'
              })
            }
          );

          if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            throw new Error(errorData.error_description || errorData.error || 'Token exchange failed');
          }

          const tokenData = await tokenResponse.json();
          const { access_token } = tokenData;

          // Send access token to our backend to create/get user and issue our JWT
          const response = await painPlusAPI.auth.microsoftCallback(access_token);
          const { token, user } = response.data;

          // Update auth context
          login(token, user);

          // Redirect to authenticated home
          navigate('/mode');
        } catch (err) {
          const errorMsg = err.response?.data?.error || err.message;
          setError(`Authentication failed: ${errorMsg}`);
          setIsLoading(false);
        }
      };

      // Listen for OAuth callback via postMessage (works when opener is preserved)
      const handleMessage = async (event) => {
        if (event.origin !== window.location.origin) return;
        if (event.data.type === 'microsoft-oauth-callback') {
          cleanup();
          await processOAuthResult(event.data.code, event.data.error);
        }
      };

      // Poll localStorage for OAuth result (works when opener is lost)
      const checkLocalStorage = async () => {
        const result = localStorage.getItem('oauth_result');
        if (result) {
          localStorage.removeItem('oauth_result');
          cleanup();
          const data = JSON.parse(result);
          // Only process if result is recent (within 30 seconds)
          if (Date.now() - data.timestamp < 30000) {
            await processOAuthResult(
              data.type === 'success' ? data.code : null,
              data.type === 'error' ? data.error : null
            );
          }
        }
      };

      // Cleanup function
      let pollInterval;
      let popupCheckInterval;
      const cleanup = () => {
        window.removeEventListener('message', handleMessage);
        clearInterval(pollInterval);
        clearInterval(popupCheckInterval);
      };

      window.addEventListener('message', handleMessage);

      // Poll localStorage every 500ms
      pollInterval = setInterval(checkLocalStorage, 500);

      // Handle popup closed without completing
      popupCheckInterval = setInterval(() => {
        if (popup.closed) {
          // Give localStorage check one more chance
          setTimeout(() => {
            checkLocalStorage();
            if (!localStorage.getItem('oauth_result')) {
              cleanup();
              setIsLoading(false);
            }
          }, 500);
          clearInterval(popupCheckInterval);
        }
      }, 500);

    } catch (err) {
      console.error('Microsoft login error:', err);
      setError('Failed to initiate login. Please try again.');
      setIsLoading(false);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailBlur = () => {
    if (formData.email && !validateEmail(formData.email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    } else {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setError('');
    setIsLoading(true);

    // Client-side validation
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Name validation (signup only)
    if (mode === 'signup' && !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Confirm password validation (signup only)
    if (mode === 'signup' && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      let response;
      if (mode === 'signup') {
        response = await painPlusAPI.auth.signup(
          formData.email,
          formData.password,
          formData.name
        );
      } else {
        response = await painPlusAPI.auth.login(
          formData.email,
          formData.password
        );
      }

      const { token, user } = response.data;
      login(token, user); // From AuthContext
      navigate('/mode');
    } catch (err) {
      if (err.response?.data?.code === 'EMAIL_EXISTS') {
        setErrors({ email: 'This email is already registered' });
      } else if (err.response?.data?.code === 'INVALID_CREDENTIALS') {
        setErrors({ general: 'Invalid email or password' });
      } else if (err.response?.data?.code === 'WRONG_AUTH_PROVIDER') {
        setErrors({ general: 'This email uses Microsoft sign-in' });
      } else {
        setErrors({ general: 'Something went wrong. Please try again.' });
      }
    } finally {
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
          {/* Mode toggle */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                mode === 'signup'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                mode === 'login'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Log In
            </button>
          </div>

          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
          </h2>

          {/* General error message */}
          {(error || errors.general) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error || errors.general}
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name field (signup only) */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  autoFocus
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-white text-gray-800 placeholder-gray-500 rounded-lg border-2 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  } outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                  placeholder="Your name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
            )}

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                autoFocus={mode === 'login'}
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleEmailBlur}
                className={`w-full px-4 py-3 bg-white text-gray-800 placeholder-gray-500 rounded-lg border-2 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                placeholder="your.email@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password field */}
            <PasswordInput
              id="password"
              name="password"
              label="Password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="At least 8 characters"
              error={errors.password}
              showStrength={mode === 'signup'}
            />

            {/* Confirm password field (signup only) */}
            {mode === 'signup' && (
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Re-enter your password"
                error={errors.confirmPassword}
              />
            )}

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isLoading}
              fullWidth
              className="mt-6"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {mode === 'signup' ? 'Creating account...' : 'Signing in...'}
                </span>
              ) : (
                mode === 'signup' ? 'Create Account' : 'Log In'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

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
