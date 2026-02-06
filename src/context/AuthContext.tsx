import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';
import { AuthContextType, AuthState, User } from '../types/auth';
import { getUserMemberships } from '../lib/dbService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    memberships: [],
  });

  // Check for existing token on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/me');

          // Use memberships from /auth/me response (fresh from database)
          const freshMemberships = response.data.memberships || [];

          setAuthState({
            user: response.data,
            isAuthenticated: true,
            isLoading: false,
            memberships: freshMemberships,
          });
        } catch (error) {
          console.error('Failed to load user', error);
          localStorage.removeItem('token');
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            memberships: [],
          });
        }
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          memberships: [],
        });
      }
    };

    loadUser();

    // Periodic refresh every 5 minutes to catch role changes
    const refreshInterval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token) {
        loadUser();
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Refresh on window focus to catch changes made in other tabs
    const handleFocus = () => {
      const token = localStorage.getItem('token');
      if (token) {
        loadUser();
      }
    };
    window.addEventListener('focus', handleFocus);

    // Listen for 401 Unauthorized events from api interceptor
    const handleUnauthorized = () => {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        memberships: [],
      });
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; remainingAttempts?: number; lockoutDuration?: number }> => {

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token } = response.data;

      localStorage.setItem('token', token);

      // Fetch fresh user data with memberships from /auth/me
      const meResponse = await api.get('/auth/me');
      const freshMemberships = meResponse.data.memberships || [];

      setAuthState({
        user: meResponse.data,
        isAuthenticated: true,
        isLoading: false,
        memberships: freshMemberships,
      });
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);


      const result: { success: boolean; error?: string; remainingAttempts?: number; lockoutDuration?: number } = {
        success: false,
        error: error.response?.data?.message || 'Login failed',
      };

      if (error.response) {
        // Parse RateLimit headers
        const remaining = error.response.headers['ratelimit-remaining'];
        if (remaining !== undefined) {
          result.remainingAttempts = parseInt(remaining, 10);
        }

        const reset = error.response.headers['ratelimit-reset'];
        const retryAfter = error.response.headers['retry-after'];

        if (error.response.status === 429 || result.remainingAttempts === 0) {
          if (retryAfter) {
            // Retry-After is usually in seconds
            result.lockoutDuration = parseInt(retryAfter, 10) * 1000;
          } else if (reset) {
            // express-rate-limit draft-7 (default) returns seconds until reset
            const resetSeconds = parseInt(reset, 10);
            result.lockoutDuration = resetSeconds * 1000;
          }
        }
      }

      return result;
    }
  };

  const logout = async (): Promise<void> => {
    localStorage.removeItem('token');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      memberships: [],
    });
  };

  const signUp = async (email: string, password: string, name: string, otp: string): Promise<{ success: boolean; error?: string }> => {

    try {
      const response = await api.post('/auth/signup', { email, password, name, otp });
      const { token } = response.data;

      localStorage.setItem('token', token);

      // Fetch fresh user data with memberships from /auth/me
      const meResponse = await api.get('/auth/me');
      const freshMemberships = meResponse.data.memberships || [];

      setAuthState({
        user: meResponse.data,
        isAuthenticated: true,
        isLoading: false,
        memberships: freshMemberships,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Sign up error:', error);

      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create account'
      };
    }
  };

  const sendOtp = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await api.post('/auth/send-otp-signup', { email });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to send OTP' };
    }
  };

  const verifyOtp = async (email: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await api.post('/auth/verify-otp', { email, otp });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to verify OTP' };
    }
  };

  const signInWithGoogle = async (credential?: string): Promise<{ success: boolean; error?: string; needsSignup?: boolean; googleData?: { email: string; name: string; credential: string } }> => {
    if (!credential) {
      return { success: false, error: 'No Google credential provided' };
    }


    try {
      const response = await api.post('/auth/google', { credential });
      const { token } = response.data;

      localStorage.setItem('token', token);

      // Fetch fresh user data with memberships from /auth/me
      const meResponse = await api.get('/auth/me');
      const freshMemberships = meResponse.data.memberships || [];

      setAuthState({
        user: meResponse.data,
        isAuthenticated: true,
        isLoading: false,
        memberships: freshMemberships,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Google Sign In error:', error);


      // Check if user needs to sign up
      if (error.response?.status === 404 && error.response?.data?.code === 'USER_NOT_FOUND') {
        return {
          success: false,
          needsSignup: true,
          googleData: error.response.data.googleData,
          error: error.response.data.message
        };
      }

      return {
        success: false,
        error: error.response?.data?.message || 'Google authentication failed'
      };
    }
  };

  const signUpWithGoogle = async (credential: string, password: string, name?: string): Promise<{ success: boolean; error?: string }> => {

    try {
      const response = await api.post('/auth/google/signup', { credential, password, name });
      const { token } = response.data;

      localStorage.setItem('token', token);

      // Fetch fresh user data with memberships from /auth/me
      const meResponse = await api.get('/auth/me');
      const freshMemberships = meResponse.data.memberships || [];

      setAuthState({
        user: meResponse.data,
        isAuthenticated: true,
        isLoading: false,
        memberships: freshMemberships,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Google Sign Up error:', error);

      return {
        success: false,
        error: error.response?.data?.message || 'Google signup failed'
      };
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (authState.user) {
      setAuthState(prev => ({
        ...prev,
        user: { ...prev.user!, ...userData },
      }));
    }
  };

  const refreshMemberships = async () => {
    if (authState.user?.email) {
      const memberships = await getUserMemberships(authState.user.email);
      setAuthState(prev => ({ ...prev, memberships }));
    }
  };

  const value: AuthContextType = {
    ...authState,
    login,
    signUp,
    signInWithGoogle,
    signUpWithGoogle,
    logout,
    updateUser,
    resetPassword: async (email: string) => {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    },
    refreshMemberships,
    sendOtp,
    verifyOtp,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
