import { useState, useEffect, useRef, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../common/Button';

interface OtpVerificationStepProps {
  email: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack?: () => void;
  error?: string;
  setError?: (error: string) => void;
}

const OtpVerificationStep = ({
  email,
  onVerify,
  onResend,
  onBack,
  error,
  setError,
}: OtpVerificationStepProps) => {
  const { t } = useTranslation();
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [resendError, setResendError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const expiresAtRef = useRef(Date.now() + 60 * 1000);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Timestamp-based countdown (immune to background tab throttling)
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      const remaining = Math.ceil((expiresAtRef.current - Date.now()) / 1000);
      setCountdown(remaining > 0 ? remaining : 0);
    }, 500);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    setIsVerifying(true);
    setResendError('');
    if (setError) setError('');

    try {
      await onVerify(otp);
    } catch {
      // Error is handled by parent
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    setResendError('');
    if (setError) setError('');

    try {
      await onResend();
      expiresAtRef.current = Date.now() + 60 * 1000;
      setCountdown(60);
      setOtp('');
    } catch (err: any) {
      const code = err?.response?.data?.error?.code;
      if (code === 'OTP_COOLDOWN') {
        setResendError(t('auth.otpCooldown'));
      } else if (code === 'OTP_RATE_LIMIT') {
        setResendError(t('auth.otpRateLimit'));
      } else {
        setResendError(t('auth.resendFailed'));
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleChange = (value: string) => {
    // Only allow digits, max 6
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setOtp(cleaned);
  };

  const displayError = error || resendError;

  return (
    <div>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 mb-4">
          <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          {t('auth.verifyEmail')}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('auth.otpSentTo')}
        </p>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
          {email}
        </p>
      </div>

      {displayError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-xs sm:text-sm">
          {displayError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('auth.enterOtp')}
          </label>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="000000"
            className="block w-full rounded-lg border px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] transition-colors duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          isLoading={isVerifying}
          disabled={isVerifying || otp.length !== 6}
        >
          {isVerifying ? t('auth.verifying') : t('auth.verifyButton')}
        </Button>
      </form>

      <div className="mt-4 text-center">
        {countdown > 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('auth.resendIn', { seconds: countdown })}
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-sm text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 font-medium disabled:opacity-50"
          >
            {isResending ? t('auth.verifying') : t('auth.resendCode')}
          </button>
        )}
      </div>

      {onBack && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            {t('common.back')}
          </button>
        </div>
      )}
    </div>
  );
};

export default OtpVerificationStep;
