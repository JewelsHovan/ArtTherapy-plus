import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../common/Logo';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    let timeoutId;

    if (isLoading) {
      timeoutId = setTimeout(() => {
        setShowRetry(true);
      }, 5000);
    } else {
      setShowRetry(false);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading]);

  const handleRetry = () => {
    window.location.reload();
  };

  // Show branded loading experience while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-pulse mx-auto mb-6">
            <Logo size="large" showText={false} />
          </div>
          <p className="text-gray-600 mb-6">Verifying your session...</p>

          {showRetry && (
            <div className="space-y-3">
              <p className="text-gray-500 text-sm">Taking longer than expected?</p>
              <button
                onClick={handleRetry}
                className="px-6 py-2 bg-primary text-white rounded-full shadow-md hover:shadow-lg hover:bg-primary/90 transition-all duration-200"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Redirect to register if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/register" replace />;
  }

  // Render child routes if authenticated
  return <Outlet />;
}
