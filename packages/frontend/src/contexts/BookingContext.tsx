import { createContext, useContext, useState, ReactNode } from 'react';
import type { Ride, CreateRideRequest, SupportedLanguage } from '@cts/shared';
import * as bookingService from '../services/booking.service';
import { estimateRoadDistanceFromCoords } from '../utils/distance';
import { calculatePrice, applyCardSurcharge } from '../utils/pricing';
import { geocodeByAddress } from '../utils/geocode';
import i18n from '../i18n';

interface BookingState {
  pickupAddress: string;
  dropoffAddress: string;
  pickupCoordinates: { lat: number; lng: number };
  dropoffCoordinates: { lat: number; lng: number };
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
  smallLuggageCount: number;
  largeLuggageCount: number;
  returnFlightNumber: string;
  returnFlightTime: string;
  returnLuggageCount: number;
  returnSmallLuggageCount: number;
  returnLargeLuggageCount: number;
  directionsDistance: number | null;
  directionsDuration: number | null;
  notes: string;
  currentRide: Ride | null;
  step: number;
}

interface BookingContextType {
  bookingState: BookingState;
  setPickupAddress: (address: string) => void;
  setDropoffAddress: (address: string) => void;
  setPickupCoordinates: (coords: { lat: number; lng: number }) => void;
  setDropoffCoordinates: (coords: { lat: number; lng: number }) => void;
  setCustomerInfo: (info: { name: string; phone: string; email: string }) => void;
  setPeople: (people: number) => void;
  setScheduledFor: (date: Date | null) => void;
  setIsRoundtrip: (isRoundtrip: boolean) => void;
  setReturnScheduledFor: (date: Date | null) => void;
  setReturnPeople: (people: number) => void;
  setPaymentMethod: (method: 'cash' | 'card') => void;
  setChildSeat: (value: boolean) => void;
  setFlightNumber: (flightNumber: string) => void;
  setFlightTime: (flightTime: string) => void;
  setLuggageCount: (luggageCount: number) => void;
  setSmallLuggageCount: (smallLuggageCount: number) => void;
  setLargeLuggageCount: (largeLuggageCount: number) => void;
  setReturnFlightNumber: (returnFlightNumber: string) => void;
  setReturnFlightTime: (returnFlightTime: string) => void;
  setReturnLuggageCount: (returnLuggageCount: number) => void;
  setReturnSmallLuggageCount: (returnSmallLuggageCount: number) => void;
  setReturnLargeLuggageCount: (returnLargeLuggageCount: number) => void;
  setDirectionsDistance: (distance: number | null) => void;
  setDirectionsDuration: (duration: number | null) => void;
  setNotes: (notes: string) => void;
  createBooking: () => Promise<Ride>;
  nextStep: () => void;
  prevStep: () => void;
  resetBooking: () => void;
  isLoading: boolean;
  error: string | null;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return context;
};

interface BookingProviderProps {
  children: ReactNode;
}

const initialState: BookingState = {
  pickupAddress: '',
  dropoffAddress: '',
  pickupCoordinates: { lat: 0, lng: 0 },
  dropoffCoordinates: { lat: 0, lng: 0 },
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  people: 2,
  scheduledFor: null,
  isRoundtrip: false,
  returnScheduledFor: null,
  returnPeople: 2,
  paymentMethod: 'cash',
  childSeat: false,
  flightNumber: '',
  flightTime: '',
  luggageCount: 0,
  smallLuggageCount: 0,
  largeLuggageCount: 0,
  returnFlightNumber: '',
  returnFlightTime: '',
  returnLuggageCount: 0,
  returnSmallLuggageCount: 0,
  returnLargeLuggageCount: 0,
  directionsDistance: null,
  directionsDuration: null,
  notes: '',
  currentRide: null,
  step: 1,
};

const BookingProvider = ({ children }: BookingProviderProps) => {
  const [bookingState, setBookingState] = useState<BookingState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setScheduledFor = (date: Date | null) => {
    setBookingState((prev) => ({ ...prev, scheduledFor: date }));
    setError(null);
  };

  const setIsRoundtrip = (isRoundtrip: boolean) => {
    setBookingState((prev) => ({
      ...prev,
      isRoundtrip,
      returnScheduledFor: isRoundtrip ? prev.returnScheduledFor : null
    }));
    setError(null);
  };

  const setReturnScheduledFor = (date: Date | null) => {
    setBookingState((prev) => ({ ...prev, returnScheduledFor: date }));
    setError(null);
  };

  const setReturnPeople = (returnPeople: number) => {
    setBookingState((prev) => ({ ...prev, returnPeople }));
    setError(null);
  };

  const setPaymentMethod = (paymentMethod: 'cash' | 'card') => {
    setBookingState((prev) => ({ ...prev, paymentMethod }));
    setError(null);
  };

  const setChildSeat = (childSeat: boolean) => {
    setBookingState((prev) => ({ ...prev, childSeat }));
    setError(null);
  };

  const setFlightNumber = (flightNumber: string) => {
    setBookingState((prev) => ({ ...prev, flightNumber }));
    setError(null);
  };

  const setFlightTime = (flightTime: string) => {
    setBookingState((prev) => ({ ...prev, flightTime }));
    setError(null);
  };

  const setLuggageCount = (luggageCount: number) => {
    setBookingState((prev) => ({ ...prev, luggageCount }));
    setError(null);
  };

  const setSmallLuggageCount = (smallLuggageCount: number) => {
    setBookingState((prev) => ({ ...prev, smallLuggageCount }));
    setError(null);
  };

  const setLargeLuggageCount = (largeLuggageCount: number) => {
    setBookingState((prev) => ({ ...prev, largeLuggageCount }));
    setError(null);
  };

  const setReturnFlightNumber = (returnFlightNumber: string) => {
    setBookingState((prev) => ({ ...prev, returnFlightNumber }));
    setError(null);
  };

  const setReturnFlightTime = (returnFlightTime: string) => {
    setBookingState((prev) => ({ ...prev, returnFlightTime }));
    setError(null);
  };

  const setReturnLuggageCount = (returnLuggageCount: number) => {
    setBookingState((prev) => ({ ...prev, returnLuggageCount }));
    setError(null);
  };

  const setReturnSmallLuggageCount = (returnSmallLuggageCount: number) => {
    setBookingState((prev) => ({ ...prev, returnSmallLuggageCount }));
    setError(null);
  };

  const setReturnLargeLuggageCount = (returnLargeLuggageCount: number) => {
    setBookingState((prev) => ({ ...prev, returnLargeLuggageCount }));
    setError(null);
  };

  const setDirectionsDistance = (distance: number | null) => {
    setBookingState((prev) => ({ ...prev, directionsDistance: distance }));
  };

  const setDirectionsDuration = (duration: number | null) => {
    setBookingState((prev) => ({ ...prev, directionsDuration: duration }));
  };

  const setNotes = (notes: string) => {
    setBookingState((prev) => ({ ...prev, notes }));
    setError(null);
  };

  const setPickupAddress = (address: string) => {
    setBookingState((prev) => ({ ...prev, pickupAddress: address }));
    setError(null);
  };

  const setDropoffAddress = (address: string) => {
    setBookingState((prev) => ({ ...prev, dropoffAddress: address }));
    setError(null);
  };

  const setPickupCoordinates = (coords: { lat: number; lng: number }) => {
    setBookingState((prev) => ({ ...prev, pickupCoordinates: coords }));
  };

  const setDropoffCoordinates = (coords: { lat: number; lng: number }) => {
    setBookingState((prev) => ({ ...prev, dropoffCoordinates: coords }));
  };

  const setCustomerInfo = (info: { name: string; phone: string; email: string }) => {
    setBookingState((prev) => ({
      ...prev,
      customerName: info.name,
      customerPhone: info.phone,
      customerEmail: info.email,
    }));
    setError(null);
  };

  const setPeople = (people: number) => {
    setBookingState((prev) => ({ ...prev, people }));
    setError(null);
  };

  const createBooking = async (): Promise<Ride> => {
    if (!bookingState.pickupAddress || !bookingState.dropoffAddress) {
      throw new Error('Λείπουν απαραίτητα στοιχεία κράτησης');
    }


    if (!bookingState.customerName || !bookingState.customerPhone || !bookingState.customerEmail) {
      throw new Error('Λείπουν στοιχεία επικοινωνίας');
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload: CreateRideRequest = {
        pickup: {
          address: bookingState.pickupAddress,
          coordinates: bookingState.pickupCoordinates,
        },
        dropoff: {
          address: bookingState.dropoffAddress,
          coordinates: bookingState.dropoffCoordinates,
        },
        customerName: bookingState.customerName,
        customerPhone: bookingState.customerPhone,
        customerEmail: bookingState.customerEmail,
        customerLanguage: (i18n.language?.split('-')[0] || 'el') as SupportedLanguage,
        scheduledFor: bookingState.scheduledFor ?? undefined,
        isRoundtrip: bookingState.isRoundtrip,
        returnScheduledFor: bookingState.isRoundtrip ? bookingState.returnScheduledFor ?? undefined : undefined,
        returnPeople: bookingState.isRoundtrip ? bookingState.returnPeople : undefined,
        people: bookingState.people,
        paymentMethod: bookingState.paymentMethod,
        childSeat: bookingState.childSeat,
        flightNumber: bookingState.flightNumber || undefined,
        flightTime: bookingState.flightTime || undefined,
        luggageCount: bookingState.luggageCount || undefined,
        smallLuggageCount: bookingState.smallLuggageCount || undefined,
        largeLuggageCount: bookingState.largeLuggageCount || undefined,
        returnFlightNumber: bookingState.returnFlightNumber || undefined,
        returnFlightTime: bookingState.returnFlightTime || undefined,
        returnLuggageCount: bookingState.returnLuggageCount || undefined,
        returnSmallLuggageCount: bookingState.returnSmallLuggageCount || undefined,
        returnLargeLuggageCount: bookingState.returnLargeLuggageCount || undefined,
        notes: bookingState.notes || undefined,
      };

      // Safety net: if the autocomplete didn't capture coordinates, recover
      // them from the address so distance/price are never silently lost.
      let pickupCoords = bookingState.pickupCoordinates;
      let dropoffCoords = bookingState.dropoffCoordinates;
      if (!pickupCoords.lat || !pickupCoords.lng) {
        const g = await geocodeByAddress(bookingState.pickupAddress);
        if (g) { pickupCoords = g; payload.pickup.coordinates = g; }
      }
      if (!dropoffCoords.lat || !dropoffCoords.lng) {
        const g = await geocodeByAddress(bookingState.dropoffAddress);
        if (g) { dropoffCoords = g; payload.dropoff.coordinates = g; }
      }

      // Calculate and attach price based on distance (prefer Directions API distance)
      const haversineDist = estimateRoadDistanceFromCoords(
        pickupCoords.lat, pickupCoords.lng,
        dropoffCoords.lat, dropoffCoords.lng,
      );
      const dist = bookingState.directionsDistance ?? haversineDist;
      if (dist) {
        payload.distance = dist;
        payload.estimatedDuration = bookingState.directionsDuration ?? Math.max(30, Math.round((dist / 50) * 60));
        const base = calculatePrice(dist, bookingState.people, bookingState.smallLuggageCount, bookingState.largeLuggageCount);
        const price = base != null ? applyCardSurcharge(base, bookingState.paymentMethod) : null;
        if (price) payload.price = price;
      }

      const ride = await bookingService.createRide(payload);

      setBookingState((prev) => ({ ...prev, currentRide: ride }));
      return ride;
    } catch (err: unknown) {
      let errorMessage = 'Αποτυχία δημιουργίας κράτησης';
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'error' in err.response.data &&
        err.response.data.error &&
        typeof err.response.data.error === 'object' &&
        'message' in err.response.data.error
      ) {
        errorMessage = (err.response.data.error as { message: string }).message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    setBookingState((prev) => ({ ...prev, step: prev.step + 1 }));
  };

  const prevStep = () => {
    setBookingState((prev) => ({ ...prev, step: Math.max(1, prev.step - 1) }));
  };

  const resetBooking = () => {
    setBookingState(initialState);
    setError(null);
  };

  const value: BookingContextType = {
    bookingState,
    setPickupAddress,
    setDropoffAddress,
    setPickupCoordinates,
    setDropoffCoordinates,
    setCustomerInfo,
    setPeople,
    setScheduledFor,
    setIsRoundtrip,
    setReturnScheduledFor,
    setReturnPeople,
    setPaymentMethod,
    setChildSeat,
    setFlightNumber,
    setFlightTime,
    setLuggageCount,
    setSmallLuggageCount,
    setLargeLuggageCount,
    setReturnFlightNumber,
    setReturnFlightTime,
    setReturnLuggageCount,
    setReturnSmallLuggageCount,
    setReturnLargeLuggageCount,
    setDirectionsDistance,
    setDirectionsDuration,
    setNotes,
    createBooking,
    nextStep,
    prevStep,
    resetBooking,
    isLoading,
    error,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};

export { BookingProvider };
