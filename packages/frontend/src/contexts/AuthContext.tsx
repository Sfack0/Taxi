import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, RegisterData, LoginData, VerifyOtpData, ResendOtpData, RegisterResponse, ResendOtpResponse } from '@cts/shared';
import * as authService from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData & { language?: string }) => Promise<User>;
  register: (data: RegisterData & { language?: string }) => Promise<RegisterResponse>;
  verifyOtp: (data: VerifyOtpData) => Promise<User>;
  resendOtp: (data: ResendOtpData) => Promise<ResendOtpResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const userData = await authService.getProfile();
          setUser(userData);
        } catch {
          // Token is invalid, clear it
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (data: LoginData & { language?: string }) => {
    const response = await authService.login(data);
    localStorage.setItem('accessToken', response.token);
    localStorage.setItem('refreshToken', response.refreshToken);
    setUser(response.user);
    return response.user;
  };

  const register = async (data: RegisterData & { language?: string }) => {
    // No longer returns tokens - returns email + message
    const response = await authService.register(data);
    return response;
  };

  const verifyOtp = async (data: VerifyOtpData) => {
    const response = await authService.verifyOtp(data);
    localStorage.setItem('accessToken', response.token);
    localStorage.setItem('refreshToken', response.refreshToken);
    setUser(response.user);
    return response.user;
  };

  const resendOtp = async (data: ResendOtpData) => {
    return authService.resendOtp(data);
  };

  const logout = () => {
    authService.logout().catch(() => {
      // Ignore errors on logout
    });
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const refreshUser = async () => {
    const userData = await authService.getProfile();
    setUser(userData);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    verifyOtp,
    resendOtp,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
