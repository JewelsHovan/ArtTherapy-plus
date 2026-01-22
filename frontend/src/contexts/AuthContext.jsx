import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { painPlusAPI } from '../services/api';

const AuthContext = createContext(null);

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_EXPIRES_KEY = 'auth_expires_at';

const decodeJwtPayload = (token) => {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '==='.slice((base64.length + 3) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

const getTokenExpiry = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return null;
  return payload.exp * 1000;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUserSettings = useCallback(async () => {
    try {
      const response = await painPlusAPI.user.getProfile();
      const settings = response.data.profile?.settings || {};
      setUser((prev) => (prev ? { ...prev, settings } : { settings }));
      return settings;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.debug('[auth] refresh settings failed', {
          status: error.response?.status,
          message: error.message,
        });
      }
      return null;
    }
  }, []);

  const updateUserSettings = useCallback(async (nextSettings) => {
    const response = await painPlusAPI.user.updateProfile({ settings: nextSettings });
    const updatedSettings = response.data.profile?.settings || nextSettings;
    setUser((prev) => (prev ? { ...prev, settings: updatedSettings } : { settings: updatedSettings }));
    return response;
  }, []);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);

      if (import.meta.env.DEV) {
        console.debug('[auth] verify start', { hasToken: Boolean(storedToken) });
      }

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      const tokenExpiry = getTokenExpiry(storedToken);
      if (tokenExpiry) {
        localStorage.setItem(AUTH_EXPIRES_KEY, tokenExpiry.toString());
        if (Date.now() >= tokenExpiry) {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(AUTH_EXPIRES_KEY);
          setIsLoading(false);
          return;
        }
      }

      try {
        const response = await painPlusAPI.auth.verifyToken(storedToken);
        const { user: userData } = response.data;

        setToken(storedToken);
        setUser(userData);
        setIsAuthenticated(true);
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        if (import.meta.env.DEV) {
          console.debug('[auth] verify failed', {
            status: error.response?.status,
            code: error.response?.data?.code,
            message: error.message
          });
        }

        if (error.response?.status === 401) {
          // Token invalid or expired - clear it
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(AUTH_EXPIRES_KEY);
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!user || typeof user.settings !== 'undefined') return;
    refreshUserSettings();
  }, [isAuthenticated, user, refreshUserSettings]);

  const login = (newToken, userData) => {
    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    const tokenExpiry = getTokenExpiry(newToken);
    if (tokenExpiry) {
      localStorage.setItem(AUTH_EXPIRES_KEY, tokenExpiry.toString());
    } else {
      localStorage.removeItem(AUTH_EXPIRES_KEY);
    }
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_EXPIRES_KEY);
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
    logout,
    refreshUserSettings,
    updateUserSettings,
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
