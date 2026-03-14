import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import LanguageSelector from '../components/common/LanguageSelector';
import ThemeToggle from '../components/common/ThemeToggle';
import OtpVerificationStep from '../components/auth/OtpVerificationStep';

const Login = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { login, verifyOtp, resendOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError(t('auth.invalidEmail'));
      return;
    }

    setIsLoading(true);

    try {
      const loggedInUser = await login({ email, password, language: i18n.language.split('-')[0] as any });

      if (loggedInUser.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      const code = err?.response?.data?.error?.code;

      if (code === 'EMAIL_NOT_VERIFIED') {
        setOtpEmail(email);
        setShowOtp(true);
        setError('');
      } else {
        const errorMap: Record<string, string> = {
          INVALID_CREDENTIALS: t('auth.invalidCredentials'),
          ACCOUNT_INACTIVE: t('auth.accountInactive'),
        };
        setError(errorMap[code] || t('auth.loginFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (otp: string) => {
    try {
      const user = await verifyOtp({ email: otpEmail, otp });
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      const code = err?.response?.data?.error?.code;
      const errorMap: Record<string, string> = {
        OTP_EXPIRED: t('auth.otpExpired'),
        OTP_INVALID: t('auth.otpInvalid'),
        OTP_MAX_ATTEMPTS: t('auth.otpMaxAttempts'),
      };
      setError(errorMap[code] || err?.response?.data?.error?.message || t('auth.verifyFailed'));
      throw err;
    }
  };

  const handleResend = async () => {
    await resendOtp({ email: otpEmail, language: i18n.language.split('-')[0] as any });
  };

  return (
    <>
    <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-3 sm:p-4">
      {/* Back Button */}
      <button
        onClick={() => showOtp ? (setShowOtp(false), setError('')) : navigate('/')}
        className="fixed top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-1.5 sm:gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-sm"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="text-xs sm:text-sm font-medium">{showOtp ? t('common.back') : t('common.home')}</span>
      </button>

      {/* Language & Theme */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSelector />
      </div>

      <Card className="w-full max-w-md p-5 sm:p-8">
        {showOtp ? (
          <OtpVerificationStep
            email={otpEmail}
            onVerify={handleVerify}
            onResend={handleResend}
            onBack={() => { setShowOtp(false); setError(''); }}
            error={error}
            setError={setError}
          />
        ) : (
          <>
            <h1 className="text-xl sm:text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
              {t('auth.welcome')}
            </h1>
            <p className="text-center text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 sm:mb-8">
              {t('auth.loginSubtitle')}
            </p>

            {error && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs sm:text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <Input
                type="email"
                label="Email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />

              <Input
                type="password"
                label={t('auth.password')}
                placeholder={t('auth.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? t('auth.loggingIn') : t('auth.loginButton')}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 font-medium">
                {t('common.register')}
              </Link>
            </p>
          </>
        )}
      </Card>
    </div>
    </>
  );
};

export default Login;
