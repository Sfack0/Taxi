import crypto from 'crypto';
import { SupportedLanguage } from '@cts/shared';
import { Otp } from '../models/Otp.model';
import { hashPassword, comparePassword } from '../utils/password.util';
import { sendOtpEmail } from './email.service';
import { AppError } from '../middleware/error.middleware';

const OTP_LENGTH = 6;
const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 60;
const RATE_LIMIT_COUNT = 3;
const RATE_LIMIT_WINDOW_MINUTES = 10;

export const generateOtp = (): string => {
  // Generate cryptographically random 6-digit number
  const buffer = crypto.randomBytes(4);
  const num = buffer.readUInt32BE(0) % 1000000;
  return num.toString().padStart(OTP_LENGTH, '0');
};

export const createAndSendOtp = async (
  email: string,
  firstName: string,
  language: SupportedLanguage = 'en'
): Promise<void> => {
  const normalizedEmail = email.toLowerCase();

  // Cooldown check: must wait 60s between OTPs
  const latestOtp = await Otp.findOne({ email: normalizedEmail }).sort({ createdAt: -1 });
  if (latestOtp) {
    const elapsed = (Date.now() - latestOtp.createdAt.getTime()) / 1000;
    if (elapsed < COOLDOWN_SECONDS) {
      throw new AppError(
        'Please wait before requesting a new code',
        429,
        'OTP_COOLDOWN'
      );
    }
  }

  // Rate limit: max 3 OTPs per email per 10 minutes
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
  const recentCount = await Otp.countDocuments({
    email: normalizedEmail,
    createdAt: { $gte: windowStart },
  });
  if (recentCount >= RATE_LIMIT_COUNT) {
    throw new AppError(
      'Too many verification codes requested. Please try again later.',
      429,
      'OTP_RATE_LIMIT'
    );
  }

  // Generate, hash, and store
  const otp = generateOtp();
  const otpHash = await hashPassword(otp);

  await Otp.create({
    email: normalizedEmail,
    otpHash,
  });

  // Send email (fire and forget - don't block on failure)
  await sendOtpEmail(normalizedEmail, otp, firstName, language);
};

export const verifyOtp = async (email: string, otp: string): Promise<boolean> => {
  const normalizedEmail = email.toLowerCase();

  // Find the latest OTP for this email
  const otpDoc = await Otp.findOne({ email: normalizedEmail }).sort({ createdAt: -1 });

  if (!otpDoc) {
    throw new AppError(
      'Verification code expired. Please request a new one.',
      400,
      'OTP_EXPIRED'
    );
  }

  // Check max attempts
  if (otpDoc.attempts >= MAX_ATTEMPTS) {
    throw new AppError(
      'Too many incorrect attempts. Please request a new code.',
      400,
      'OTP_MAX_ATTEMPTS'
    );
  }

  // Increment attempts
  otpDoc.attempts += 1;
  await otpDoc.save();

  // Compare
  const isValid = await comparePassword(otp, otpDoc.otpHash);

  if (!isValid) {
    const remaining = MAX_ATTEMPTS - otpDoc.attempts;
    throw new AppError(
      `Invalid code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      400,
      'OTP_INVALID'
    );
  }

  // Success - delete all OTPs for this email
  await Otp.deleteMany({ email: normalizedEmail });

  return true;
};
