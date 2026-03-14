import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tour } from '../../data/tours';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../common/Input';
import PhoneField from '../common/PhoneField';
import NumberPicker from '../common/NumberPicker';
import MobileDatePicker from '../common/MobileDatePicker';
import { el, enUS, fr, de, it, es } from 'date-fns/locale';

const localeMap: Record<string, Locale> = { el, en: enUS, fr, de, it, es };

interface TourBookingModalProps {
  tour?: Tour;
  customStops?: string[];
  onClose: () => void;
}

const TourBookingModal = ({ tour, customStops, onClose }: TourBookingModalProps) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const currentLocale = localeMap[i18n.language?.split('-')[0]] || enUS;

  const [name, setName] = useState(user ? `${user.firstName} ${user.lastName}` : '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [people, setPeople] = useState(2);
  const [date, setDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const tourName = tour
    ? t(`tours.items.${tour.id}.name`)
    : t('tours.diy.customTour');

  const stopsText = customStops
    ? customStops.map((s) => t(`tours.stops.${s}`)).join(' -> ')
    : tour
      ? tour.stops.map((s) => t(`tours.stops.${s.locationKey}`)).join(' -> ')
      : '';

  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !email || !date) return;

    setIsSubmitting(true);
    setErrorMsg('');

    // Center of Crete as default coordinates for tour bookings
    const creteCenter = { lat: 35.24, lng: 24.47 };

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/rides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup: { address: `TOUR: ${tourName}`, coordinates: creteCenter },
          dropoff: { address: stopsText || tourName, coordinates: creteCenter },
          customerName: name,
          customerPhone: phone,
          customerEmail: email,
          customerLanguage: i18n.language?.split('-')[0] || 'el',
          scheduledFor: date.toISOString(),
          people,
          paymentMethod: 'cash',
          notes: `[TOUR] ${tourName}\n${t('tours.bookingStops')}: ${stopsText}\n${notes}`.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      setIsSuccess(true);
    } catch {
      setErrorMsg(t('tours.booking.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = 'w-full pl-10 pr-3 py-2.5 sm:py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm sm:text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent';

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center" onClick={(e) => e.stopPropagation()}>
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {t('tours.booking.success')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('tours.booking.successMessage')}
          </p>
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors"
          >
            {t('tours.booking.close')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {t('tours.booking.title')}
            </h3>
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">{tourName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Tour info summary */}
          {tour && (
            <div className="flex items-center gap-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <img src={tour.image} alt="" className="w-16 h-12 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span>{tour.durationHours}h</span>
                  <span>·</span>
                  <span>{tour.stops.length} {t('tours.diy.stops')}</span>
                  <span>·</span>
                  <span>{t('tours.fromPrice', { price: tour.startingPrice })}</span>
                </div>
              </div>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('tours.booking.date')} *
            </label>
            <MobileDatePicker
              selected={date}
              onChange={setDate}
              minDate={new Date()}
              dateFormat="dd/MM/yyyy"
              locale={currentLocale}
              placeholderText={t('tours.booking.selectDate')}
              sheetTitle={t('tours.booking.date')}
              buttonClassName={inputClass}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
          </div>

          {/* People */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('tours.booking.people')}
            </label>
            <NumberPicker
              value={people}
              onChange={setPeople}
              min={1}
              max={8}
              label={t('tours.booking.people')}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
          </div>

          {/* Name */}
          <Input
            label={t('customerInfo.name')}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('customerInfo.namePlaceholder')}
            required
          />

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('customerInfo.phone')} <span className="text-red-500">*</span>
            </label>
            <PhoneField value={phone} onChange={setPhone} />
          </div>

          {/* Email */}
          <Input
            label={t('customerInfo.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('customerInfo.emailPlaceholder')}
            required
          />

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('booking.notes')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('tours.booking.specialRequests')}
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !name || !phone || !email || !date}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-bold text-base transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('tours.booking.submit')}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TourBookingModal;
