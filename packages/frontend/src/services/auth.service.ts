import api from './api';
import type {
  RegisterData,
  LoginData,
  AuthResponse,
  RegisterResponse,
  VerifyOtpData,
  ResendOtpData,
  ResendOtpResponse,
  ApiResponse,
  User,
} from '@cts/shared';

export const register = async (data: RegisterData & { language?: string }): Promise<RegisterResponse> => {
  const response = await api.post<ApiResponse<{ registration: RegisterResponse }>>(
    '/auth/register',
    data
  );
  return response.data.data!.registration;
};

export const login = async (data: LoginData & { language?: string }): Promise<AuthResponse> => {
  const response = await api.post<ApiResponse<{ auth: AuthResponse }>>(
    '/auth/login',
    data
  );
  return response.data.data!.auth;
};

export const verifyOtp = async (data: VerifyOtpData): Promise<AuthResponse> => {
  const response = await api.post<ApiResponse<{ auth: AuthResponse }>>(
    '/auth/verify-otp',
    data
  );
  return response.data.data!.auth;
};

export const resendOtp = async (data: ResendOtpData): Promise<ResendOtpResponse> => {
  const response = await api.post<ApiResponse<{ resend: ResendOtpResponse }>>(
    '/auth/resend-otp',
    data
  );
  return response.data.data!.resend;
};

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
};

export const getProfile = async (): Promise<User> => {
  const response = await api.get<ApiResponse<{ user: User }>>('/users/profile');
  return response.data.data!.user;
};

export const updateProfile = async (data: Partial<User>): Promise<User> => {
  const response = await api.put<ApiResponse<{ user: User }>>(
    '/users/profile',
    data
  );
  return response.data.data!.user;
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  await api.put('/users/change-password', { currentPassword, newPassword });
};
