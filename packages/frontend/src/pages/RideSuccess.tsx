import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Ride } from '@cts/shared';
import * as bookingService from '../services/booking.service';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import LanguageSelector from '../components/common/LanguageSelector';
import ThemeToggle from '../components/common/ThemeToggle';
import { estimateRoadDistance } from '../utils/distance';

const RideSuccess = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { rideId } = useParams<{ rideId: string }>();
  const [ride, setRide] = useState<Ride | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (rideId) {
      loadRide();
    }
  }, [rideId]);

  const loadRide = async () => {
    try {
      const rideData = await bookingService.getRide(rideId!);
      setRide(rideData);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load ride');
    } finally {
      setIsLoading(false);
    }
  };

  const estimatedDistance = useMemo(() => {
    if (!ride) return null;
    return estimateRoadDistance(ride.pickup.address, ride.dropoff.address);
  }, [ride]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 p-3 sm:p-4">
        <Card className="max-w-md w-full p-5 sm:p-8 text-center">
          <div className="mb-3 sm:mb-4">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('success.oops')}</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">{error || t('success.notFound')}</p>
          <Button onClick={() => navigate('/')} className="w-full sm:w-auto">{t('common.home')}</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-3 sm:p-4">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-1.5 sm:gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-sm"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="text-xs sm:text-sm font-medium">{t('common.home')}</span>
      </button>

      {/* Language Selector and Theme Toggle */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSelector />
      </div>

      <Card className="max-w-2xl w-full p-4 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-accent-100 dark:bg-accent-900/30 rounded-full mb-3 sm:mb-4">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
            {t('success.title')}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {t('success.subtitle')}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 space-y-3 sm:space-y-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('success.bookingNumber')}</p>
            <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">{ride.rideNumber}</p>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-600 pt-3 sm:pt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('confirmation.route')}</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="mt-1 w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"></div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium">{t('confirmation.from')}</p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 break-words">{ride.pickup.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-1 w-2 h-2 rounded-full bg-secondary-500 flex-shrink-0"></div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium">{t('confirmation.to')}</p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 break-words">{ride.dropoff.address}</p>
                </div>
              </div>
              {estimatedDistance && (
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-blue-600 dark:text-blue-400 mt-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  ~{estimatedDistance} km
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-600 pt-3 sm:pt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('confirmation.contactInfo')}</p>
            <div className="space-y-1 text-xs sm:text-sm">
              <p className="text-gray-900 dark:text-gray-100"><strong>{t('customerInfo.name')}:</strong> {ride.customerName}</p>
              <p className="text-gray-900 dark:text-gray-100"><strong>{t('customerInfo.phone')}:</strong> {ride.customerPhone}</p>
              <p className="text-gray-900 dark:text-gray-100 break-all"><strong>{t('customerInfo.email')}:</strong> {ride.customerEmail}</p>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-600 pt-3 sm:pt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('success.status')}</p>
            <span className="inline-block px-2 sm:px-3 py-0.5 sm:py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-xs sm:text-sm font-medium rounded-full">
              {ride.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        <Card className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 mb-4 sm:mb-6">
          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 mb-2">
            <strong>{t('success.emailConfirmation')}:</strong> {t('success.emailSent')} <span className="break-all">{ride.customerEmail}</span>
          </p>
          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
            <strong>{t('success.nextStep')}:</strong> {t('success.nextStepText')}
          </p>
        </Card>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button onClick={() => navigate('/')} variant="outline" className="w-full sm:flex-1 text-sm sm:text-base">
            {t('common.home')}
          </Button>
          <Button onClick={() => navigate('/book')} className="w-full sm:flex-1 text-sm sm:text-base">
            {t('common.newBooking')}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default RideSuccess;
