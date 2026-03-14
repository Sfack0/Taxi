import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Input from '../common/Input';
import Button from '../common/Button';
import PhoneField from '../common/PhoneField';
import MobileDatePicker from '../common/MobileDatePicker';
import NumberPicker from '../common/NumberPicker';
import { useBooking } from '../../contexts/BookingContext';
import { isAirportAddress } from '../../utils/airport';

interface CustomerInfoProps {
  onCustomerInfoChange: (info: { name: string; phone: string; email: string }) => void;
  onContinue: () => void;
  onBack: () => void;
  initialName?: string;
  initialPhone?: string;
  initialEmail?: string;
  initialNotes?: string;
  onNotesChange?: (notes: string) => void;
}

const CustomerInfo = ({
  onCustomerInfoChange,
  onContinue,
  onBack,
  initialName,
  initialPhone,
  initialEmail,
  initialNotes,
  onNotesChange,
}: CustomerInfoProps) => {
  const { t, i18n } = useTranslation();
  const { setFlightNumber, setFlightTime, setLuggageCount, setReturnFlightNumber, setReturnFlightTime, setReturnLuggageCount, bookingState } = useBooking();
  const { flightNumber, flightTime, luggageCount, returnFlightNumber, returnFlightTime, returnLuggageCount, pickupCoordinates, dropoffCoordinates, pickupAddress, dropoffAddress, isRoundtrip } = bookingState;

  const [name, setName] = useState(initialName || '');
  const [phone, setPhone] = useState(initialPhone || '');
  const [email, setEmail] = useState(initialEmail || '');
  const [notes, setNotes] = useState(initialNotes || '');

  // Flight time as Date for MobileDatePicker
  const [flightTimeDate, setFlightTimeDate] = useState<Date | null>(() => {
    if (flightTime) {
      const [h, m] = flightTime.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return d;
    }
    return null;
  });

  const [returnFlightTimeDate, setReturnFlightTimeDate] = useState<Date | null>(() => {
    if (returnFlightTime) {
      const [h, m] = returnFlightTime.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return d;
    }
    return null;
  });

  const currentLocale = useMemo(() => {
    const lang = i18n.language?.split('-')[0] || 'el';
    return ['el', 'en', 'fr', 'de', 'it', 'es'].includes(lang) ? lang : 'el';
  }, [i18n.language]);

  // Detect if pickup or dropoff is an airport
  const isAirportTrip = useMemo(() => {
    return isAirportAddress(pickupAddress, pickupCoordinates) || isAirportAddress(dropoffAddress, dropoffCoordinates);
  }, [pickupAddress, pickupCoordinates, dropoffAddress, dropoffCoordinates]);

  // Sync initial values to context on mount (for pre-filled user data)
  useEffect(() => {
    if (initialName || initialPhone || initialEmail) {
      onCustomerInfoChange({
        name: initialName || '',
        phone: initialPhone || '',
        email: initialEmail || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  const handleNameChange = (value: string) => {
    setName(value);
    onCustomerInfoChange({ name: value, phone, email });
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    onCustomerInfoChange({ name, phone: value, email });
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    onCustomerInfoChange({ name, phone, email: value });
  };

  const handleContinue = () => {
    if (name.trim() && phone.trim() && email.trim()) {
      onContinue();
    }
  };

  const canContinue =
    name.trim().length > 0 &&
    phone.trim().length > 0 &&
    email.trim().length > 0 &&
    email.includes('@') &&
    (!isAirportTrip || (flightNumber.trim().length > 0 && flightTime.trim().length > 0));

  const inputClass = 'w-full pl-7 sm:pl-10 pr-1 sm:pr-4 py-2.5 sm:py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">{t('customerInfo.title')}</h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{t('customerInfo.subtitle')}</p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <Input
          label={t('customerInfo.name')}
          placeholder={t('customerInfo.namePlaceholder')}
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          required
        />

        <PhoneField
          label={t('customerInfo.phone')}
          placeholder={t('customerInfo.phonePlaceholder')}
          value={phone}
          onChange={handlePhoneChange}
          required
        />

        <Input
          label={t('customerInfo.email')}
          type="email"
          placeholder={t('customerInfo.emailPlaceholder')}
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          required
        />

        {/* Flight Info - Only shown for airport trips */}
        {isAirportTrip && (
          <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
              </svg>
              <span className="text-xs font-semibold uppercase">{t('booking.flightInfo')}</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  {t('booking.flightNumber')}
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                    placeholder="FR1234"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  {t('booking.flightTime')}
                </label>
                <MobileDatePicker
                  selected={flightTimeDate}
                  onChange={(date) => {
                    setFlightTimeDate(date);
                    if (date) {
                      const hh = String(date.getHours()).padStart(2, '0');
                      const mm = String(date.getMinutes()).padStart(2, '0');
                      setFlightTime(`${hh}:${mm}`);
                    } else {
                      setFlightTime('');
                    }
                  }}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={5}
                  timeFormat="HH:mm"
                  timeCaption={t('booking.flightTime')}
                  dateFormat="HH:mm"
                  locale={currentLocale}
                  placeholderText="hh:mm"
                  sheetTitle={t('booking.flightTime')}
                  buttonClassName={inputClass}
                  icon={
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  {t('booking.luggageCount')}
                </label>
                <NumberPicker
                  value={luggageCount}
                  onChange={setLuggageCount}
                  min={0}
                  max={15}
                  label={t('booking.luggageCount')}
                  icon={
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Return Flight Info - Only shown for airport roundtrips, optional */}
        {isAirportTrip && isRoundtrip && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
              </svg>
              <span className="text-xs font-semibold uppercase">{t('booking.returnFlightInfo')}</span>
              <span className="text-xs font-normal text-amber-600 dark:text-amber-500">({t('common.optional')})</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  {t('booking.flightNumber')}
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={returnFlightNumber}
                    onChange={(e) => setReturnFlightNumber(e.target.value.toUpperCase())}
                    placeholder="FR5678"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  {t('booking.flightTime')}
                </label>
                <MobileDatePicker
                  selected={returnFlightTimeDate}
                  onChange={(date) => {
                    setReturnFlightTimeDate(date);
                    if (date) {
                      const hh = String(date.getHours()).padStart(2, '0');
                      const mm = String(date.getMinutes()).padStart(2, '0');
                      setReturnFlightTime(`${hh}:${mm}`);
                    } else {
                      setReturnFlightTime('');
                    }
                  }}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={5}
                  timeFormat="HH:mm"
                  timeCaption={t('booking.flightTime')}
                  dateFormat="HH:mm"
                  locale={currentLocale}
                  placeholderText="hh:mm"
                  sheetTitle={t('booking.flightTime')}
                  buttonClassName={inputClass}
                  icon={
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  {t('booking.luggageCount')}
                </label>
                <NumberPicker
                  value={returnLuggageCount}
                  onChange={setReturnLuggageCount}
                  min={0}
                  max={15}
                  label={t('booking.luggageCount')}
                  icon={
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('booking.notes')}
          </label>
          <textarea
            value={notes}
            onChange={(e) => {
              const val = e.target.value.slice(0, 500);
              setNotes(val);
              onNotesChange?.(val);
            }}
            placeholder={t('booking.notesPlaceholder')}
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{notes.length}/500</p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          size="sm"
        >
          {t('common.back')}
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!canContinue}
          size="sm"
        >
          {t('common.continue')}
        </Button>
      </div>
    </div>
  );
};

export default CustomerInfo;
