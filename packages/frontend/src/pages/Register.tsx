import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import PhoneField from '../components/common/PhoneField';
import Card from '../components/common/Card';
import LanguageSelector from '../components/common/LanguageSelector';
import ThemeToggle from '../components/common/ThemeToggle';
import OtpVerificationStep from '../components/auth/OtpVerificationStep';

const Register = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { register, verifyOtp, resendOtp } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError(t('auth.invalidEmail'));
      return;
    }

    if (formData.password.length < 8) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordsMismatch'));
      return;
    }

    setIsLoading(true);

    try {
      const result = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        language: i18n.language.split('-')[0] as any,
      });
      setRegisteredEmail(result.email);
      setStep(2);
    } catch (err: any) {
      const code = err.response?.data?.error?.code;
      const errorMap: Record<string, string> = {
        EMAIL_EXISTS: t('auth.emailExists'),
        PHONE_EXISTS: t('auth.phoneExists'),
        WEAK_PASSWORD: t('auth.passwordTooShort'),
      };
      setError(errorMap[code] || t('auth.registerFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (otp: string) => {
    try {
      const user = await verifyOtp({ email: registeredEmail, otp });
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
      throw err; // Re-throw so OtpVerificationStep knows it failed
    }
  };

  const handleResend = async () => {
    await resendOtp({ email: registeredEmail, language: i18n.language.split('-')[0] as any });
  };

  return (
    <>
    <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-3 sm:p-4">
      {/* Back Button */}
      <button
        onClick={() => step === 2 ? setStep(1) : navigate('/')}
        className="fixed top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-1.5 sm:gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-sm"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="text-xs sm:text-sm font-medium">{step === 2 ? t('common.back') : t('common.home')}</span>
      </button>

      {/* Language & Theme */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSelector />
      </div>

      <Card className="w-full max-w-md p-5 sm:p-8">
        {step === 1 ? (
          <>
            <h1 className="text-xl sm:text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
              {t('auth.createAccount')}
            </h1>
            <p className="text-center text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 sm:mb-8">
              {t('auth.registerSubtitle')}
            </p>

            {error && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs sm:text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Input
                  type="text"
                  label={t('auth.firstName')}
                  placeholder={t('auth.firstNamePlaceholder')}
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  required
                  autoFocus
                />

                <Input
                  type="text"
                  label={t('auth.lastName')}
                  placeholder={t('auth.lastNamePlaceholder')}
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  required
                />
              </div>

              <Input
                type="email"
                label="Email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
              />

              <PhoneField
                label={t('auth.phone')}
                placeholder={t('auth.phonePlaceholder')}
                value={formData.phone}
                onChange={(val) => handleChange('phone', val)}
                required
              />

              <Input
                type="password"
                label={t('auth.password')}
                placeholder={t('auth.passwordHelperText')}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
                helperText={t('auth.passwordHelperText')}
              />

              <Input
                type="password"
                label={t('auth.confirmPassword')}
                placeholder={t('auth.confirmPasswordPlaceholder')}
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                required
              />

              <Button
                type="submit"
                className="w-full mt-6"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? t('auth.registering') : t('auth.registerButton')}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 font-medium">
                {t('common.login')}
              </Link>
            </p>
          </>
        ) : (
          <OtpVerificationStep
            email={registeredEmail}
            onVerify={handleVerify}
            onResend={handleResend}
            onBack={() => { setStep(1); setError(''); }}
            error={error}
            setError={setError}
          />
        )}
      </Card>
    </div>
    </>
  );
};

export default Register;
