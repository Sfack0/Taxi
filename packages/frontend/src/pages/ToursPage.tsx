import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { el, enUS, fr, de, it, es } from 'date-fns/locale';
import PublicHeader from '../components/common/PublicHeader';
import PlacesAutocomplete from '../components/common/PlacesAutocomplete';
import MobileDatePicker from '../components/common/MobileDatePicker';
import NumberPicker from '../components/common/NumberPicker';
import Input from '../components/common/Input';
import PhoneField from '../components/common/PhoneField';
import { useAuth } from '../contexts/AuthContext';
import { combineDateTimeAthens } from '../utils/datetime';

const localeMap: Record<string, Locale> = { el, en: enUS, fr, de, it, es };

const MAX_STOPS = 10;

interface Stop {
  address: string;
  lat: number;
  lng: number;
}

const ToursPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentLocale = localeMap[i18n.language?.split('-')[0]] || enUS;

  const [step, setStep] = useState(1);
  const [people, setPeople] = useState(2);
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [stops, setStops] = useState<(Stop | null)[]>([]);
  const [name, setName] = useState(user ? `${user.firstName} ${user.lastName}` : '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const validStops = stops.filter((s): s is Stop => s !== null);
  const placesText = validStops.map((s) => s.address).join(' -> ');

  const step1Valid = !!(pickupAddress && pickupCoords && date && time);
  const step2Valid = !!(name && phone && email);

  // Allow adding a new place only when the previous one has been filled in
  const canAddStop = stops.length < MAX_STOPS && (stops.length === 0 || stops[stops.length - 1] !== null);

  const addStop = () => {
    if (canAddStop) setStops((prev) => [...prev, null]);
  };

  const updateStop = (index: number, stop: Stop) => {
    setStops((prev) => prev.map((s, i) => (i === index ? stop : s)));
  };

  const removeStop = (index: number) => {
    setStops((prev) => prev.filter((_, i) => i !== index));
  };

  const goToStep = (target: number) => {
    setStep(target);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!step1Valid || !step2Valid || !date || !time || !pickupCoords) return;

    setIsSubmitting(true);
    setErrorMsg('');

    // Interpret the picked time as Crete (Europe/Athens) time, independent of browser TZ.
    const scheduled = combineDateTimeAthens(date, time);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/rides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup: { address: pickupAddress, coordinates: pickupCoords },
          dropoff: {
            address: `TOUR: ${placesText || t('tours.customTour')}`,
            coordinates: pickupCoords,
          },
          customerName: name,
          customerPhone: phone,
          customerEmail: email,
          customerLanguage: i18n.language?.split('-')[0] || 'el',
          scheduledFor: scheduled.toISOString(),
          people,
          paymentMethod: 'cash',
          notes: [
            `[TOUR]`,
            notes.trim(),
            validStops.length
              ? (() => {
                  const stopsInline = `${t('tours.bookingStops')}: ${validStops.map((s, i) => `${i + 1}. ${s.address}`).join(', ')}`;
                  return notes.trim() ? `(${stopsInline})` : stopsInline;
                })()
              : '',
          ].filter(Boolean).join(' '),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      setIsSuccess(true);
      window.scrollTo(0, 0);
    } catch {
      setErrorMsg(t('tours.booking.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = 'w-full pl-10 pr-3 py-2.5 sm:py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm sm:text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';

  const steps = [
    { number: 1, name: t('booking.step1'), completed: step > 1 },
    { number: 2, name: t('booking.step2'), completed: step > 2 },
    { number: 3, name: t('booking.step3'), completed: isSuccess },
  ];

  return (
    <>
      <Helmet>
        <title>{t('tours.metaTitle')}</title>
        <meta name="description" content={t('tours.metaDescription')} />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <PublicHeader />

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 dark:from-gray-800 dark:via-gray-900 dark:to-black py-10 sm:py-14">
          <div className="container-custom px-4 relative">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 font-display">
                {t('tours.heroTitle')}
              </h1>
              <p className="text-base sm:text-lg text-white/90 mb-3">
                {t('tours.heroSubtitle')}
              </p>
              <p className="text-sm sm:text-base text-white/80 font-medium">
                {t('tours.rateInfo')}
              </p>
            </div>
          </div>
        </section>

        {/* Booking wizard */}
        <section className="py-8 sm:py-12">
          <div className="max-w-2xl mx-auto px-3 sm:px-4">
            {/* Progress indicator */}
            {!isSuccess && (
              <div className="mb-6 sm:mb-8">
                <div className="flex items-center justify-center">
                  {steps.map((s, index) => (
                    <div key={s.number} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-semibold transition-all ${
                            s.completed
                              ? 'bg-accent-500 text-white'
                              : step === s.number
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {s.completed ? '✓' : s.number}
                        </div>
                        <span className="text-[10px] sm:text-xs mt-1 sm:mt-2 font-medium text-gray-600 dark:text-gray-400 text-center">
                          {s.name}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className={`w-12 sm:w-20 h-0.5 sm:h-1 mx-2 sm:mx-3 transition-all ${
                            s.completed ? 'bg-accent-500' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        ></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isSuccess ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-md text-center">
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
                  onClick={() => { navigate('/'); window.scrollTo(0, 0); }}
                  className="px-8 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors"
                >
                  {t('tours.booking.close')}
                </button>
              </div>
            ) : (
              <>
                {/* Step 1: ride details */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
                      {/* People */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          {t('booking.people')} *
                        </label>
                        <NumberPicker
                          value={people}
                          onChange={setPeople}
                          min={1}
                          max={8}
                          label={t('booking.people')}
                          icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          }
                        />
                      </div>

                      {/* Pickup */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          {t('booking.pickupLocation')} *
                        </label>
                        <PlacesAutocomplete
                          value={pickupAddress}
                          onChange={(result) => {
                            setPickupAddress(result.address);
                            setPickupCoords({ lat: result.lat, lng: result.lng });
                          }}
                          placeholder={t('booking.pickupLocation')}
                        />
                      </div>

                      {/* Date & time */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            {t('booking.date')} *
                          </label>
                          <MobileDatePicker
                            selected={date}
                            onChange={setDate}
                            minDate={new Date()}
                            dateFormat="dd/MM/yyyy"
                            locale={currentLocale}
                            placeholderText={t('booking.date')}
                            sheetTitle={t('booking.date')}
                            buttonClassName={inputClass}
                            icon={
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            {t('booking.time')} *
                          </label>
                          <MobileDatePicker
                            selected={time}
                            onChange={setTime}
                            showTimeSelect
                            showTimeSelectOnly
                            timeIntervals={15}
                            timeFormat="HH:mm"
                            timeCaption={t('booking.time')}
                            dateFormat="HH:mm"
                            locale={currentLocale}
                            placeholderText="hh:mm"
                            sheetTitle={t('booking.time')}
                            buttonClassName={inputClass}
                            icon={
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Places you'd like to visit (optional) */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 shadow-md">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('tours.placesTitle')}
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        {t('tours.placesHint')}
                      </p>

                      {stops.length > 0 && (
                        <div className="space-y-3 mb-3">
                          {stops.map((stop, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <PlacesAutocomplete
                                  value={stop?.address || ''}
                                  onChange={(result) => updateStop(index, {
                                    // Keep only the area name, drop ", Region, Greece" suffixes
                                    address: result.address.split(',')[0].trim(),
                                    lat: result.lat,
                                    lng: result.lng,
                                  })}
                                  placeholder={t('tours.addPlace')}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeStop(index)}
                                className="flex-shrink-0 p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                                aria-label={t('tours.removePlace')}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={addStop}
                        disabled={!canAddStop}
                        className="w-9 h-9 rounded-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white flex items-center justify-center transition-colors"
                        aria-label={t('tours.addPlace')}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    <button
                      onClick={() => goToStep(2)}
                      disabled={!step1Valid}
                      className="w-full py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-bold text-base transition-colors"
                    >
                      {t('common.continue')}
                    </button>
                  </div>
                )}

                {/* Step 2: contact info */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
                      <Input
                        label={t('customerInfo.name')}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('customerInfo.namePlaceholder')}
                        required
                      />

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('customerInfo.phone')} <span className="text-red-500">*</span>
                        </label>
                        <PhoneField value={phone} onChange={setPhone} />
                      </div>

                      <Input
                        label={t('customerInfo.email')}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('customerInfo.emailPlaceholder')}
                        required
                      />

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('booking.notes')}
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder={t('tours.booking.specialRequests')}
                          rows={2}
                          className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => goToStep(1)}
                        className="flex-1 py-3.5 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold text-base transition-colors"
                      >
                        {t('common.back')}
                      </button>
                      <button
                        onClick={() => goToStep(3)}
                        disabled={!step2Valid}
                        className="flex-1 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-bold text-base transition-colors"
                      >
                        {t('common.continue')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: confirmation */}
                {step === 3 && (
                  <div className="space-y-5">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 shadow-md">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                        {t('booking.step3')}
                      </h3>
                      <dl className="space-y-3 text-sm">
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-500 dark:text-gray-400 flex-shrink-0">{t('booking.pickupLocation')}</dt>
                          <dd className="text-gray-900 dark:text-white font-medium text-right">{pickupAddress}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-500 dark:text-gray-400 flex-shrink-0">{t('booking.date')}</dt>
                          <dd className="text-gray-900 dark:text-white font-medium">{date?.toLocaleDateString('el-GR')}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-500 dark:text-gray-400 flex-shrink-0">{t('booking.time')}</dt>
                          <dd className="text-gray-900 dark:text-white font-medium">
                            {time ? `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}` : ''}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-500 dark:text-gray-400 flex-shrink-0">{t('booking.people')}</dt>
                          <dd className="text-gray-900 dark:text-white font-medium">{people}</dd>
                        </div>
                        {validStops.length > 0 && (
                          <div>
                            <dt className="text-gray-500 dark:text-gray-400 mb-1.5">{t('tours.placesTitle')}</dt>
                            <dd>
                              <ol className="space-y-1">
                                {validStops.map((s, i) => (
                                  <li key={i} className="text-gray-900 dark:text-white font-medium">
                                    {i + 1}. {s.address}
                                  </li>
                                ))}
                              </ol>
                            </dd>
                          </div>
                        )}
                        <div className="border-t border-gray-100 dark:border-gray-700 pt-3 flex justify-between gap-4">
                          <dt className="text-gray-500 dark:text-gray-400 flex-shrink-0">{t('customerInfo.name')}</dt>
                          <dd className="text-gray-900 dark:text-white font-medium text-right">{name}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-500 dark:text-gray-400 flex-shrink-0">{t('customerInfo.phone')}</dt>
                          <dd className="text-gray-900 dark:text-white font-medium">{phone}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-500 dark:text-gray-400 flex-shrink-0">{t('customerInfo.email')}</dt>
                          <dd className="text-gray-900 dark:text-white font-medium text-right break-all">{email}</dd>
                        </div>
                        {notes && (
                          <div className="flex justify-between gap-4">
                            <dt className="text-gray-500 dark:text-gray-400 flex-shrink-0">{t('booking.notes')}</dt>
                            <dd className="text-gray-900 dark:text-white font-medium text-right">{notes}</dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    {errorMsg && (
                      <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                        {errorMsg}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => goToStep(2)}
                        disabled={isSubmitting}
                        className="flex-1 py-3.5 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold text-base transition-colors"
                      >
                        {t('common.back')}
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-bold text-base transition-colors flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          t('tours.booking.submit')
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="py-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="container-custom px-4 text-center text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Crete TaxiVan · <Link to="/" className="hover:text-primary-500">crete-taxivan.gr</Link>
          </div>
        </footer>
      </div>
    </>
  );
};

export default ToursPage;
