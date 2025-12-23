import { createContext, useState, useContext, useEffect } from 'react';
import { painPlusAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('auth_token');

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await painPlusAPI.auth.verifyToken();
        const { user: userData } = response.data;

        setToken(storedToken);
        setUser(userData);
        setIsAuthenticated(true);
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        // Token invalid or expired - clear it
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = (newToken, userData) => {
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/register';
  };

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
