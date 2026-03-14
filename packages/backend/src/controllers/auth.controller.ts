import { Request, Response, NextFunction } from 'express';
import { RegisterData, LoginData, VerifyOtpData, ResendOtpData, ApiResponse, AuthResponse, RegisterResponse, ResendOtpResponse, SupportedLanguage } from '@cts/shared';
import * as authService from '../services/auth.service';

export const register = async (
  req: Request<{}, {}, RegisterData & { language?: SupportedLanguage }>,
  res: Response<ApiResponse<{ registration: RegisterResponse }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const registration = await authService.registerUser(req.body);

    res.status(201).json({
      success: true,
      data: { registration },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request<{}, {}, LoginData & { language?: SupportedLanguage }>,
  res: Response<ApiResponse<{ auth: AuthResponse }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const auth = await authService.loginUser(req.body);

    res.status(200).json({
      success: true,
      data: { auth },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (
  req: Request<{}, {}, VerifyOtpData>,
  res: Response<ApiResponse<{ auth: AuthResponse }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const auth = await authService.verifyUserOtp(req.body.email, req.body.otp);

    res.status(200).json({
      success: true,
      data: { auth },
    });
  } catch (error) {
    next(error);
  }
};

export const resendOtp = async (
  req: Request<{}, {}, ResendOtpData>,
  res: Response<ApiResponse<{ resend: ResendOtpResponse }>>,
  next: NextFunction
): Promise<void> => {
  try {
    await authService.resendUserOtp(req.body.email, req.body.language);

    // Always return success (no email enumeration)
    res.status(200).json({
      success: true,
      data: { resend: { message: 'If the email exists, a new code has been sent.' } },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};
