import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { AppError } from './error.middleware';

export const isAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    // Check if user is admin by role
    if (user.role === 'admin') {
      return next();
    }

    // Also check if user email matches ADMIN_EMAIL from env (supports comma-separated)
    const adminEmails = process.env.ADMIN_EMAIL?.split(',').map((e) => e.trim()) || [];
    if (adminEmails.includes(user.email)) {
      return next();
    }

    throw new AppError('Admin access required', 403, 'FORBIDDEN');
  } catch (error) {
    next(error);
  }
};
