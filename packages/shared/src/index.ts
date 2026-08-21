// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  profileImage?: string;
  role: 'customer' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  emailVerified: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// ============================================================================
// DRIVER TYPES
// ============================================================================

export interface Driver {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  profileImage?: string;
  licenseNumber: string;
  rating: number;
  totalRides: number;
  vehicle?: string;
  status: 'available' | 'busy' | 'offline';
  currentLocation?: Coordinates;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  isVerified: boolean;
}

// ============================================================================
// VEHICLE TYPES
// ============================================================================

// ============================================================================
// LOCATION TYPES
// ============================================================================

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Location {
  address: string;
  coordinates: Coordinates;
}

// ============================================================================
// RIDE TYPES
// ============================================================================

export type RideStatus =
  | 'pending'
  | 'accepted'
  | 'driver_arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type SupportedLanguage = 'el' | 'en' | 'fr' | 'de' | 'it' | 'es';

export interface Ride {
  _id: string;
  user?: string | User;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerLanguage?: SupportedLanguage;
  driver?: string | Driver;
  pickup: Location;
  dropoff: Location;
  people?: number;
  distance?: number;
  estimatedDuration?: number;
  status: RideStatus;
  acceptedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  scheduledFor?: Date;
  isRoundtrip?: boolean;
  returnScheduledFor?: Date;
  returnPeople?: number;
  paymentMethod?: 'cash' | 'card';
  childSeat?: boolean;
  notes?: string;
  userRating?: number;
  driverRating?: number;
  userFeedback?: string;
  flightNumber?: string;
  flightTime?: string;
  luggageCount?: number;
  smallLuggageCount?: number;
  largeLuggageCount?: number;
  returnFlightNumber?: string;
  returnFlightTime?: string;
  returnLuggageCount?: number;
  returnSmallLuggageCount?: number;
  returnLargeLuggageCount?: number;
  price?: number;
  createdAt: Date;
  updatedAt: Date;
  rideNumber?: string;
}

// ============================================================================
// BOOKING TYPES
// ============================================================================

export interface CreateRideRequest {
  pickup: Location;
  dropoff: Location;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerLanguage?: SupportedLanguage;
  scheduledFor?: Date;
  isRoundtrip?: boolean;
  returnScheduledFor?: Date;
  returnPeople?: number;
  notes?: string;
  people?: number;
  paymentMethod?: 'cash' | 'card';
  childSeat?: boolean;
  flightNumber?: string;
  flightTime?: string;
  luggageCount?: number;
  smallLuggageCount?: number;
  largeLuggageCount?: number;
  returnFlightNumber?: string;
  returnFlightTime?: string;
  returnLuggageCount?: number;
  returnSmallLuggageCount?: number;
  returnLargeLuggageCount?: number;
  price?: number;
  distance?: number;
  estimatedDuration?: number;
}

export interface RateRideRequest {
  rating: number;
  feedback?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface RegisterResponse {
  email: string;
  message: string;
}

export interface VerifyOtpData {
  email: string;
  otp: string;
}

export interface ResendOtpData {
  email: string;
  language?: SupportedLanguage;
}

export interface ResendOtpResponse {
  message: string;
}

export interface StatusCounts {
  total: number;
  pending: number;
  accepted: number;
  completed: number;
  cancelled: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  statusCounts?: StatusCounts;
}

// ============================================================================
// QUERY TYPES
// ============================================================================

export interface RideFilters {
  status?: RideStatus;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ============================================================================
// CAROUSEL TYPES
// ============================================================================

export type CarouselCategory = 'hero' | 'van';

export interface CarouselImage {
  _id: string;
  category: CarouselCategory;
  url: string;
  alt?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// PRICING TYPES
// ============================================================================

export interface PricingEntry {
  maxKm: number;
  normalPrice: number;
  vanPrice: number;
}
