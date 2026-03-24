import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { registerLocale } from 'react-datepicker';
import { el } from 'date-fns/locale/el';
import { enGB } from 'date-fns/locale/en-GB';
import { fr } from 'date-fns/locale/fr';
import { de } from 'date-fns/locale/de';
import { it } from 'date-fns/locale/it';
import { es } from 'date-fns/locale/es';
import 'react-datepicker/dist/react-datepicker.css';
import '../../styles/calendar-custom.css';
import { useBooking } from '../../contexts/BookingContext';
import PlacesAutocomplete from '../common/PlacesAutocomplete';
import MobileDatePicker from '../common/MobileDatePicker';
import NumberPicker from '../common/NumberPicker';
import { estimateRoadDistanceFromCoords } from '../../utils/distance';
import { calculatePrice } from '../../utils/pricing';
import { useGoogleMaps } from '../common/GoogleMapsProvider';
import RouteMap from './RouteMap';

// Register all locales
registerLocale('el', el);
registerLocale('en', enGB);
registerLocale('fr', fr);
registerLocale('de', de);
registerLocale('it', it);
registerLocale('es', es);

interface LocationPickerProps {
  onPickupChange: (address: string) => void;
  onDropoffChange: (address: string) => void;
  onContinue: () => void;
  initialPickup?: string;
  initialDropoff?: string;
}

const LocationPicker = ({
  onPickupChange,
  onDropoffChange,
  onContinue,
  initialPickup,
  initialDropoff,
}: LocationPickerProps) => {
  const { t, i18n } = useTranslation();
  const { setScheduledFor, setIsRoundtrip, setReturnScheduledFor, setReturnPeople, setPickupCoordinates, setDropoffCoordinates, setPaymentMethod, setChildSeat, setPeople: setPeopleContext, setDirectionsDistance: setContextDirectionsDistance, setDirectionsDuration: setContextDirectionsDuration, bookingState } = useBooking();
  const { isRoundtrip, returnPeople, paymentMethod, childSeat, pickupCoordinates, dropoffCoordinates, scheduledFor, returnScheduledFor } = bookingState;
  const { isLoaded } = useGoogleMaps();

  const [pickupAddress, setPickupAddress] = useState(initialPickup || '');
  const [dropoffAddress, setDropoffAddress] = useState(initialDropoff || '');

  // Coordinates for distance estimation (restore from context on remount)
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number }>(pickupCoordinates);
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lng: number }>(dropoffCoordinates);

  // Sync local coords when context updates (e.g. from URL params)
  useEffect(() => {
    if (pickupCoordinates.lat !== 0 && pickupCoordinates.lng !== 0) {
      setPickupCoords(pickupCoordinates);
    }
  }, [pickupCoordinates.lat, pickupCoordinates.lng]);

  useEffect(() => {
    if (dropoffCoordinates.lat !== 0 && dropoffCoordinates.lng !== 0) {
      setDropoffCoords(dropoffCoordinates);
    }
  }, [dropoffCoordinates.lat, dropoffCoordinates.lng]);

  // Date objects for DatePicker (restore from context on remount)
  const [scheduledDate, setScheduledDate] = useState<Date | null>(scheduledFor);
  const [scheduledTime, setScheduledTime] = useState<Date | null>(scheduledFor);
  const [returnDateVal, setReturnDateVal] = useState<Date | null>(returnScheduledFor);
  const [returnTimeVal, setReturnTimeVal] = useState<Date | null>(returnScheduledFor);

  const [people, setPeople] = useState(2);
  const [showMap, setShowMap] = useState(false);
  const [estimatedDuration, setEstimatedDuration] = useState<string | null>(null);
  const [directionsDistance, setDirectionsDistance] = useState<number | null>(bookingState.directionsDistance);

  // Use Directions API distance for display; no haversine fallback to avoid flickering
  const estimatedDistance = directionsDistance;

  // Estimated price based on distance and people
  const estimatedPrice = useMemo(() => {
    if (!estimatedDistance) return null;
    return calculatePrice(estimatedDistance, people);
  }, [estimatedDistance, people]);

  // Fetch trip duration and distance from Directions API
  const fetchDirections = useCallback(() => {
    if (!isLoaded || pickupCoords.lat === 0 || dropoffCoords.lat === 0) {
      setEstimatedDuration(null);
      return;
    }
    const service = new google.maps.DirectionsService();
    service.route(
      {
        origin: pickupCoords,
        destination: dropoffCoords,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          const leg = result.routes[0]?.legs[0];
          const durationText = leg?.duration?.text || null;
          setEstimatedDuration(durationText);
          const distanceMeters = leg?.distance?.value;
          const durationSeconds = leg?.duration?.value;
          if (distanceMeters) {
            const km = Math.round(distanceMeters / 1000);
            setDirectionsDistance(km);
            setContextDirectionsDistance(km);
          }
          if (durationSeconds) {
            setContextDirectionsDuration(Math.ceil(durationSeconds / 60));
          }
        }
      }
    );
  }, [isLoaded, pickupCoords.lat, pickupCoords.lng, dropoffCoords.lat, dropoffCoords.lng]);

  useEffect(() => {
    fetchDirections();
  }, [fetchDirections]);

  // Get current locale string for DatePicker
  const currentLocale = useMemo(() => {
    const lang = i18n.language?.split('-')[0] || 'el';
    return ['el', 'en', 'fr', 'de', 'it', 'es'].includes(lang) ? lang : 'el';
  }, [i18n.language]);

  // Combine date + time into a single Date and push to context
  const combineAndSetScheduled = (date: Date | null, time: Date | null) => {
    if (date && time) {
      const combined = new Date(date);
      combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
      setScheduledFor(combined);
    } else {
      setScheduledFor(null);
    }
  };

  const combineAndSetReturn = (date: Date | null, time: Date | null) => {
    if (date && time) {
      const combined = new Date(date);
      combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
      setReturnScheduledFor(combined);
    } else {
      setReturnScheduledFor(null);
    }
  };

  const handlePickupChange = (result: { address: string; lat: number; lng: number }) => {
    setPickupAddress(result.address);
    setPickupCoords({ lat: result.lat, lng: result.lng });
    setPickupCoordinates({ lat: result.lat, lng: result.lng });
    onPickupChange(result.address);
  };

  const handleDropoffChange = (result: { address: string; lat: number; lng: number }) => {
    setDropoffAddress(result.address);
    setDropoffCoords({ lat: result.lat, lng: result.lng });
    setDropoffCoordinates({ lat: result.lat, lng: result.lng });
    onDropoffChange(result.address);
  };

  const handleSwapLocations = () => {
    const tempAddress = pickupAddress;
    const tempCoords = pickupCoords;

    setPickupAddress(dropoffAddress);
    setPickupCoords(dropoffCoords);
    setPickupCoordinates(dropoffCoords);
    onPickupChange(dropoffAddress);

    setDropoffAddress(tempAddress);
    setDropoffCoords(tempCoords);
    setDropoffCoordinates(tempCoords);
    onDropoffChange(tempAddress);
  };

  const handleContinue = () => {
    setPeopleContext(people);
    if (pickupAddress.trim() && dropoffAddress.trim()) {
      onContinue();
    }
  };

  const canContinue =
    pickupAddress.trim().length > 0 &&
    dropoffAddress.trim().length > 0 &&
    scheduledDate !== null &&
    scheduledTime !== null &&
    (!isRoundtrip || (returnDateVal !== null && returnTimeVal !== null));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const inputClass = 'w-full pl-7 sm:pl-10 pr-1 sm:pr-4 py-2.5 sm:py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('home.bookRide')}</h2>
      </div>

      {/* Locations Section */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center">
        {/* Pickup Location */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            {t('booking.pickupLocation')}
          </label>
          <PlacesAutocomplete
            value={pickupAddress}
            onChange={handlePickupChange}
            placeholder={t('booking.selectLocation')}
          />
        </div>

        {/* Swap Button */}
        <button
          onClick={handleSwapLocations}
          className="hidden md:flex w-10 h-10 sm:w-12 sm:h-12 items-center justify-center border-2 border-gray-200 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors mb-0.5"
          title={t('booking.swapLocations')}
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>

        {/* Dropoff Location */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            {t('booking.dropoffLocation')}
          </label>
          <PlacesAutocomplete
            value={dropoffAddress}
            onChange={handleDropoffChange}
            placeholder={t('booking.selectLocation')}
          />
        </div>

        {/* Mobile Swap Button */}
        <div className="md:hidden col-span-full flex justify-center pt-2">
          <button
            onClick={handleSwapLocations}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-primary-500 hover:text-primary-600 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            {t('booking.swapLocations')}
          </button>
        </div>
        </div>
      </div>

      {/* Distance Estimate & Price */}
      {estimatedDistance !== null && estimatedDistance > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm text-blue-700 dark:text-blue-300">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span>
            ~{estimatedDistance} km
            {estimatedDuration && <> · ~{estimatedDuration}</>}
            {estimatedPrice !== null && (
              <> · {t('booking.estimatedPrice')}: {isRoundtrip ? `${estimatedPrice}€ × 2 = ${estimatedPrice * 2}€` : `${estimatedPrice}€`}</>
            )}
          </span>
        </div>
      )}

      {/* Route Map Toggle */}
      {estimatedDistance !== null && estimatedDistance > 0 && pickupCoords.lat !== 0 && dropoffCoords.lat !== 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="flex items-center gap-2 text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            {showMap ? t('booking.hideRoute') : t('booking.showRoute')}
            <svg className={`w-3 h-3 transition-transform ${showMap ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showMap && (
            <RouteMap pickupCoords={pickupCoords} dropoffCoords={dropoffCoords} />
          )}
        </>
      )}

      {/* Child Seat Toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setChildSeat(!childSeat)}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
            childSeat ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
              childSeat ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('booking.childSeat')}</span>
      </div>

      {/* Roundtrip Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            const newValue = !isRoundtrip;
            setIsRoundtrip(newValue);
            if (!newValue) {
              setReturnDateVal(null);
              setReturnTimeVal(null);
              setReturnScheduledFor(null);
            }
          }}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
            isRoundtrip ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
              isRoundtrip ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('booking.roundtripLabel')}</span>
      </div>

      {/* Date, Time, People */}
      <div className="grid grid-cols-3 gap-3">
        {/* Pickup Date */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            {t('booking.date')}
          </label>
          <MobileDatePicker
            selected={scheduledDate}
            onChange={(date) => {
              setScheduledDate(date);
              combineAndSetScheduled(date, scheduledTime);
            }}
            minDate={today}
            dateFormat="dd/MM/yy"
            locale={currentLocale}
            placeholderText="dd/mm/yy"
            sheetTitle={t('booking.date')}
            buttonClassName={inputClass}
            icon={
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
        </div>

        {/* Pickup Time */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            {t('booking.time')}
          </label>
          <MobileDatePicker
            selected={scheduledTime}
            onChange={(date) => {
              setScheduledTime(date);
              combineAndSetScheduled(scheduledDate, date);
            }}
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
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* People */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            {t('booking.people')}
          </label>
          <NumberPicker
            value={people}
            onChange={setPeople}
            icon={
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
          {t('booking.paymentMethod')}
        </label>
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
          <button
            type="button"
            onClick={() => setPaymentMethod('cash')}
            className={`flex-1 py-2.5 sm:py-3 text-sm sm:text-base font-medium transition-colors ${
              paymentMethod === 'cash'
                ? 'bg-primary-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {t('booking.cash')}
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('card')}
            className={`flex-1 py-2.5 sm:py-3 text-sm sm:text-base font-medium transition-colors border-l border-gray-200 dark:border-gray-600 ${
              paymentMethod === 'card'
                ? 'bg-primary-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {t('booking.card')}
          </button>
        </div>
      </div>


      {/* Return Date/Time/People - Only shown when roundtrip is enabled */}
      {isRoundtrip && (
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700 items-end">
          {/* Return Date */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              {t('booking.returnDate')}
            </label>
            <MobileDatePicker
              selected={returnDateVal}
              onChange={(date) => {
                setReturnDateVal(date);
                combineAndSetReturn(date, returnTimeVal);
              }}
              minDate={scheduledDate || today}
              dateFormat="dd/MM/yy"
              locale={currentLocale}
              placeholderText="dd/mm/yy"
              sheetTitle={t('booking.returnDate')}
              buttonClassName={inputClass}
              icon={
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
          </div>

          {/* Return Time */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              {t('booking.returnTime')}
            </label>
            <MobileDatePicker
              selected={returnTimeVal}
              onChange={(date) => {
                setReturnTimeVal(date);
                combineAndSetReturn(returnDateVal, date);
              }}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              timeFormat="HH:mm"
              timeCaption={t('booking.time')}
              dateFormat="HH:mm"
              locale={currentLocale}
              placeholderText="hh:mm"
              sheetTitle={t('booking.returnTime')}
              buttonClassName={inputClass}
              icon={
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>

          {/* Return People */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              {t('booking.people')}
            </label>
            <NumberPicker
              value={returnPeople}
              onChange={setReturnPeople}
              icon={
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
          </div>
        </div>
      )}

      {/* Continue Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all ${
            canContinue
              ? 'bg-primary-500 hover:bg-primary-600'
              : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
          }`}
        >
          {t('common.continue')}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default LocationPicker;
