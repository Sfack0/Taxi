import { RegisterData, LoginData, AuthResponse, RegisterResponse, SupportedLanguage } from '@cts/shared';
import { User } from '../models/User.model';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password.util';
import { generateTokens } from '../utils/jwt.util';
import { AppError } from '../middleware/error.middleware';
import { createAndSendOtp, verifyOtp } from './otp.service';

export const registerUser = async (data: RegisterData & { language?: SupportedLanguage }): Promise<RegisterResponse> => {
  const email = data.email.toLowerCase();

  // Check if email already exists
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    // If exists but unverified, resend OTP
    if (!existingEmail.emailVerified) {
      await createAndSendOtp(email, existingEmail.firstName, data.language || 'en');
      return {
        email,
        message: 'Verification code sent',
      };
    }
    throw new AppError('Υπάρχει ήδη λογαριασμός με αυτό το email', 409, 'EMAIL_EXISTS');
  }

  // Check if phone already exists
  const existingPhone = await User.findOne({ phone: data.phone });
  if (existingPhone) {
    throw new AppError('Υπάρχει ήδη λογαριασμός με αυτό το τηλέφωνο', 409, 'PHONE_EXISTS');
  }

  // Validate password strength
  if (!validatePasswordStrength(data.password)) {
    throw new AppError(
      'Ο κωδικός πρέπει να είναι τουλάχιστον 8 χαρακτήρες',
      400,
      'WEAK_PASSWORD'
    );
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create user (emailVerified=false by default)
  const user = await User.create({
    email,
    password: hashedPassword,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
  });

  // Send OTP
  await createAndSendOtp(email, user.firstName, data.language || 'en');

  return {
    email,
    message: 'Verification code sent',
  };
};

export const loginUser = async (data: LoginData & { language?: SupportedLanguage }): Promise<AuthResponse> => {
  // Find user with password field
  const user = await User.findOne({ email: data.email.toLowerCase() }).select('+password');

  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError('Account is deactivated. Please contact support.', 403, 'ACCOUNT_INACTIVE');
  }

  // Verify password
  const isPasswordValid = await comparePassword(data.password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // Check if email is verified
  if (!user.emailVerified) {
    // Send OTP and tell frontend to show verification step
    try {
      await createAndSendOtp(user.email, user.firstName, data.language || 'en');
    } catch (err: any) {
      // If cooldown/rate limit, still throw EMAIL_NOT_VERIFIED so frontend shows OTP step
      if (err.code !== 'OTP_COOLDOWN' && err.code !== 'OTP_RATE_LIMIT') {
        throw err;
      }
    }
    throw new AppError('Email not verified', 403, 'EMAIL_NOT_VERIFIED');
  }

  // Generate tokens
  const tokens = generateTokens({
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  // Remove password from response
  const userObject = user.toObject();
  delete userObject.password;

  return {
    user: userObject as any,
    token: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

export const verifyUserOtp = async (email: string, otp: string): Promise<AuthResponse> => {
  // Verify the OTP
  await verifyOtp(email, otp);

  // Set emailVerified = true
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { emailVerified: true },
    { new: true }
  );

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Generate tokens
  const tokens = generateTokens({
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  return {
    user: user.toJSON() as any,
    token: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

export const resendUserOtp = async (email: string, language: SupportedLanguage = 'en'): Promise<void> => {
  const user = await User.findOne({ email: email.toLowerCase() });

  // Generic response for non-existent emails (no enumeration)
  if (!user) return;

  // Don't resend if already verified
  if (user.emailVerified) return;

  await createAndSendOtp(user.email, user.firstName, language);
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const isValid = await comparePassword(currentPassword, user.password);
  if (!isValid) {
    throw new AppError('Ο τρέχων κωδικός είναι λάθος', 400, 'WRONG_PASSWORD');
  }

  if (!validatePasswordStrength(newPassword)) {
    throw new AppError('Ο κωδικός πρέπει να είναι τουλάχιστον 8 χαρακτήρες', 400, 'WEAK_PASSWORD');
  }

  if (currentPassword === newPassword) {
    throw new AppError('Ο νέος κωδικός πρέπει να είναι διαφορετικός από τον τρέχοντα', 400, 'SAME_PASSWORD');
  }

  user.password = await hashPassword(newPassword);
  await user.save();
};

export const getUserById = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  return user;
};
