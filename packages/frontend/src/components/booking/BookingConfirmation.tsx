import { useMemo } from 'react';
import type { Location } from '@cts/shared';
import { useTranslation } from 'react-i18next';
import Card from '../common/Card';
import Button from '../common/Button';
import { estimateRoadDistanceFromCoords } from '../../utils/distance';
import { calculatePrice } from '../../utils/pricing';
import { LOCATIONS_DATA } from '../../data/locations';

interface BookingConfirmationProps {
  pickup: Location;
  dropoff: Location;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  people: number;
  scheduledFor: Date | null;
  isRoundtrip: boolean;
  returnScheduledFor: Date | null;
  returnPeople: number;
  paymentMethod: 'cash' | 'card';
  childSeat: boolean;
  flightNumber: string;
  flightTime: string;
  luggageCount: number;
  returnFlightNumber: string;
  returnFlightTime: string;
  returnLuggageCount: number;
  notes: string;
  onConfirm: () => void;
  onBack: () => void;
  isLoading: boolean;
}

const BookingConfirmation = ({
  pickup,
  dropoff,
  customerName,
  customerPhone,
  customerEmail,
  people,
  scheduledFor,
  isRoundtrip,
  returnScheduledFor,
  returnPeople,
  paymentMethod,
  childSeat,
  flightNumber,
  flightTime,
  luggageCount,
  returnFlightNumber,
  returnFlightTime,
  returnLuggageCount,
  notes,
  onConfirm,
  onBack,
  isLoading,
}: BookingConfirmationProps) => {
  const { t, i18n } = useTranslation();

  const estimatedDistance = useMemo(() => {
    return estimateRoadDistanceFromCoords(
      pickup.coordinates.lat, pickup.coordinates.lng,
      dropoff.coordinates.lat, dropoff.coordinates.lng,
    );
  }, [pickup.coordinates, dropoff.coordinates]);

  const estimatedPrice = useMemo(() => {
    if (!estimatedDistance) return null;
    return calculatePrice(estimatedDistance, people);
  }, [estimatedDistance, people]);

  // Translate predefined locations, show Google addresses as-is
  const translateLocation = (address: string) => {
    const loc = LOCATIONS_DATA.find((l) => l.greek === address);
    return loc ? t(`locations.${loc.key}`) : address;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const localeMap: Record<string, string> = {
      el: 'el-GR',
      en: 'en-US',
      fr: 'fr-FR',
      de: 'de-DE',
      it: 'it-IT',
    };
    return new Date(date).toLocaleString(localeMap[i18n.language] || 'el-GR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Athens',
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">{t('confirmation.title')}</h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{t('confirmation.subtitle')}</p>
      </div>

      <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Customer Info */}
        <div>
          <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">{t('confirmation.contactInfo')}</h3>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
              <span className="text-gray-600 dark:text-gray-400">{t('customerInfo.name')}:</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">{customerName}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
              <span className="text-gray-600 dark:text-gray-400">{t('customerInfo.phone')}:</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">{customerPhone}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
              <span className="text-gray-600 dark:text-gray-400">{t('customerInfo.email')}:</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium break-all">{customerEmail}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700"></div>

        {/* Route Information */}
        <div>
          <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">{t('confirmation.route')}</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="mt-1 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-primary-500 flex-shrink-0"></div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">{t('confirmation.from')}</p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">{translateLocation(pickup.address)}</p>
              </div>
            </div>
            <div className="ml-1 sm:ml-1.5 w-0.5 h-5 sm:h-6 bg-gray-300 dark:bg-gray-600"></div>
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="mt-1 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-secondary-500 flex-shrink-0"></div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">{t('confirmation.to')}</p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">{translateLocation(dropoff.address)}</p>
              </div>
            </div>
          </div>
          {estimatedDistance && (
            <div className="mt-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                ~{estimatedDistance} km
              </div>
              {estimatedPrice !== null && (
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('booking.estimatedPrice')}: {isRoundtrip ? `${estimatedPrice}€ × 2 = ${estimatedPrice * 2}€` : `${estimatedPrice}€`}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700"></div>

        {/* Trip Details - Outbound */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-semibold uppercase text-blue-700 dark:text-blue-400">
              {isRoundtrip ? t('confirmation.outbound') : t('booking.date')}
            </span>
          </div>
          <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100 font-medium">{formatDate(scheduledFor)}</p>
          <div className="flex items-center gap-1.5 mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {people} {t('history.people')}
          </div>

          {/* Outbound Flight Info */}
          {flightNumber && (
            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                    </svg>
                    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{t('booking.flightNumber')}</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">{flightNumber}</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{t('booking.flightTime')}</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">{flightTime}</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{t('booking.luggageCount')}</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">{luggageCount}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Trip Details - Return */}
        {isRoundtrip && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-semibold uppercase text-amber-700 dark:text-amber-400">{t('confirmation.return')}</span>
            </div>
            <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100 font-medium">{formatDate(returnScheduledFor)}</p>
            <div className="flex items-center gap-1.5 mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {returnPeople} {t('history.people')}
            </div>

            {/* Return Flight Info */}
            {returnFlightNumber && (
              <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-700">
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                      </svg>
                      <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{t('booking.flightNumber')}</span>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">{returnFlightNumber}</span>
                  </div>
                  {returnFlightTime && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{t('booking.flightTime')}</span>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">{returnFlightTime}</span>
                    </div>
                  )}
                  {returnLuggageCount > 0 && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{t('booking.luggageCount')}</span>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">{returnLuggageCount}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Extras: Payment, Child Seats, Notes */}
        <div className="border-t border-gray-200 dark:border-gray-700"></div>
        <div>
          <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">{t('confirmation.extras')}</h3>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
              <span className="text-gray-600 dark:text-gray-400">{t('booking.paymentMethod')}:</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">
                {paymentMethod === 'cash' ? t('booking.cash') : t('booking.card')}
              </span>
            </div>
            {childSeat && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
                <span className="text-gray-600 dark:text-gray-400">{t('booking.childSeat')}:</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">{t('booking.yes')}</span>
              </div>
            )}
            {notes && (
              <div className="flex flex-col gap-0.5">
                <span className="text-gray-600 dark:text-gray-400">{t('booking.notes')}:</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium whitespace-pre-wrap">{notes}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="flex justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          size="sm"
          disabled={isLoading}
        >
          {t('common.back')}
        </Button>
        <Button
          onClick={onConfirm}
          size="sm"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? t('confirmation.confirming') : t('common.confirm')}
        </Button>
      </div>
    </div>
  );
};

export default BookingConfirmation;
