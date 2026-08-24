import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BookingProvider, useBooking } from '../contexts/BookingContext';
import { useAuth } from '../contexts/AuthContext';
import { loadPricing } from '../utils/pricing';
import LocationPicker from '../components/booking/LocationPicker';
import CustomerInfo from '../components/booking/CustomerInfo';
import BookingConfirmation from '../components/booking/BookingConfirmation';
import Card from '../components/common/Card';
import PublicHeader from '../components/common/PublicHeader';


const BookRideContent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    bookingState,
    setPickupAddress,
    setDropoffAddress,
    setPickupCoordinates,
    setDropoffCoordinates,
    setDirectionsDistance,
    setCustomerInfo,
    setNotes,
    createBooking,
    nextStep,
    prevStep,
    resetBooking,
    isLoading,
    error,
  } = useBooking();

  // Pre-fill from URL search params (e.g. from transfer landing pages or destinations)
  const fromParam = searchParams.get('from') || '';
  const toParam = searchParams.get('to') || '';
  const fromLatParam = searchParams.get('fromLat');
  const fromLngParam = searchParams.get('fromLng');
  const toLatParam = searchParams.get('toLat');
  const toLngParam = searchParams.get('toLng');
  const distanceParam = searchParams.get('distance');

  // Load pricing + push URL params into BookingContext
  useEffect(() => {
    loadPricing();
    if (fromParam) setPickupAddress(fromParam);
    if (toParam) setDropoffAddress(toParam);
    if (fromLatParam && fromLngParam) setPickupCoordinates({ lat: Number(fromLatParam), lng: Number(fromLngParam) });
    if (toLatParam && toLngParam) setDropoffCoordinates({ lat: Number(toLatParam), lng: Number(toLngParam) });
    if (distanceParam) setDirectionsDistance(Number(distanceParam));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLocationContinue = () => {
    nextStep();
  };

  const handleCustomerInfoContinue = () => {
    nextStep();
  };

  const handleConfirmBooking = async () => {
    try {
      const ride = await createBooking();
      // Navigate to success page
      navigate(`/ride-success/${ride._id}`);
    } catch {
      // Toast shown automatically by API interceptor
    }
  };

  const handleStartNewBooking = () => {
    resetBooking();
  };

  // Progress Steps
  const steps = [
    { number: 1, name: t('booking.step1'), completed: bookingState.step > 1 },
    { number: 2, name: t('booking.step2'), completed: bookingState.step > 2 },
    { number: 3, name: t('booking.step3'), completed: bookingState.step > 3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
      <PublicHeader />

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Progress Indicator */}
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-semibold transition-all ${
                      step.completed
                        ? 'bg-accent-500 text-white'
                        : bookingState.step === step.number
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {step.completed ? '✓' : step.number}
                  </div>
                  <span className="text-[10px] sm:text-xs mt-1 sm:mt-2 font-medium text-gray-600 dark:text-gray-400 text-center">
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 sm:w-20 h-0.5 sm:h-1 mx-2 sm:mx-3 transition-all ${
                      step.completed ? 'bg-accent-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs sm:text-sm">
            <strong>{t('common.error')}:</strong> {error}
          </div>
        )}

        {/* Step Content */}
        <Card className="p-4 sm:p-6">
          {bookingState.step === 1 && (
            <LocationPicker
              onPickupChange={setPickupAddress}
              onDropoffChange={setDropoffAddress}
              onContinue={handleLocationContinue}
              initialPickup={fromParam || bookingState.pickupAddress}
              initialDropoff={toParam || bookingState.dropoffAddress}
            />
          )}

          {bookingState.step === 2 && (
            <CustomerInfo
              onCustomerInfoChange={setCustomerInfo}
              onContinue={handleCustomerInfoContinue}
              onBack={prevStep}
              initialName={bookingState.customerName || (user ? `${user.firstName} ${user.lastName}` : '')}
              initialPhone={bookingState.customerPhone || user?.phone || ''}
              initialEmail={bookingState.customerEmail || user?.email || ''}
              initialNotes={bookingState.notes}
              onNotesChange={setNotes}
            />
          )}

          {bookingState.step === 3 &&
            bookingState.pickupAddress &&
            bookingState.dropoffAddress && (
              <BookingConfirmation
                pickup={{ address: bookingState.pickupAddress, coordinates: bookingState.pickupCoordinates }}
                dropoff={{ address: bookingState.dropoffAddress, coordinates: bookingState.dropoffCoordinates }}
                customerName={bookingState.customerName}
                customerPhone={bookingState.customerPhone}
                customerEmail={bookingState.customerEmail}
                people={bookingState.people}
                scheduledFor={bookingState.scheduledFor}
                isRoundtrip={bookingState.isRoundtrip}
                returnScheduledFor={bookingState.returnScheduledFor}
                returnPeople={bookingState.returnPeople}
                paymentMethod={bookingState.paymentMethod}
                childSeat={bookingState.childSeat}
                babySeat={bookingState.babySeat}
                flightNumber={bookingState.flightNumber}
                flightTime={bookingState.flightTime}
                smallLuggageCount={bookingState.smallLuggageCount}
                largeLuggageCount={bookingState.largeLuggageCount}
                returnFlightNumber={bookingState.returnFlightNumber}
                returnFlightTime={bookingState.returnFlightTime}
                returnSmallLuggageCount={bookingState.returnSmallLuggageCount}
                returnLargeLuggageCount={bookingState.returnLargeLuggageCount}
                notes={bookingState.notes}
                onConfirm={handleConfirmBooking}
                onBack={prevStep}
                isLoading={isLoading}
              />
            )}
        </Card>
      </div>
    </div>
  );
};

const BookRide = () => {
  return (
    <BookingProvider>
      <BookRideContent />
    </BookingProvider>
  );
};

export default BookRide;
