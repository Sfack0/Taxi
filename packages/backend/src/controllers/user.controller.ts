import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ApiResponse, User } from '@cts/shared';
import * as authService from '../services/auth.service';
import { User as UserModel } from '../models/User.model';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';

export const getProfile = async (
  req: AuthRequest,
  res: Response<ApiResponse<{ user: User }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await authService.getUserById(req.user!.id);

    res.status(200).json({
      success: true,
      data: { user: user.toJSON() as any },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response<ApiResponse<{ user: User }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const updates = req.body;

    // Don't allow updating sensitive fields
    delete updates.email;
    delete updates.password;
    delete updates.role;
    delete updates.emailVerified;

    const user = await UserModel.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      data: { user: user.toJSON() as any },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Current and new password are required', 400, 'MISSING_FIELDS');
    }

    await authService.changePassword(userId, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      data: { message: 'Password changed successfully' },
    });
  } catch (error) {
    next(error);
  }
};
