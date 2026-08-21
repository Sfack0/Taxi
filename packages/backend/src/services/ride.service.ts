import { CreateRideRequest, Ride as IRide, RateRideRequest, RideFilters, PaginationParams } from '@cts/shared';
import { Ride } from '../models/Ride.model';
import { AppError } from '../middleware/error.middleware';
import { sendBookingConfirmation, sendAdminNotification, sendCancellationNotification } from './email.service';

import logger from '../utils/logger';

// Map each Greek vowel (accented or not) to a character class matching all its variants
const greekDiacriticMap: Record<string, string> = {};
const groups = [
  'αάΑΆ', 'εέΕΈ', 'ηήΗΉ', 'ιίϊΐΙΊΪ', 'οόΟΌ', 'υύϋΰΥΎΫ', 'ωώΩΏ',
];
for (const group of groups) {
  const charClass = `[${group}]`;
  for (const ch of group) {
    greekDiacriticMap[ch] = charClass;
  }
}

/** Escape regex specials, then replace Greek vowels with accent-insensitive character classes */
const toAccentInsensitiveRegex = (input: string): RegExp => {
  const escaped = input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = Array.from(escaped)
    .map((ch) => greekDiacriticMap[ch] || ch)
    .join('');
  return new RegExp(pattern, 'i');
};

export const createRide = async (userId: string | undefined, data: CreateRideRequest): Promise<IRide> => {
  logger.info('Creating ride with customerLanguage:', data.customerLanguage);

  // Create ride with only allowed fields
  const ride = await Ride.create({
    user: userId || undefined,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerEmail: data.customerEmail,
    customerLanguage: data.customerLanguage || 'el',
    pickup: {
      address: data.pickup.address,
      coordinates: {
        type: 'Point',
        coordinates: [data.pickup.coordinates.lng, data.pickup.coordinates.lat],
      },
    },
    dropoff: {
      address: data.dropoff.address,
      coordinates: {
        type: 'Point',
        coordinates: [data.dropoff.coordinates.lng, data.dropoff.coordinates.lat],
      },
    },
    people: data.people,
    scheduledFor: data.scheduledFor,
    isRoundtrip: data.isRoundtrip,
    returnScheduledFor: data.returnScheduledFor,
    returnPeople: data.returnPeople,
    notes: data.notes,
    paymentMethod: data.paymentMethod || 'cash',
    childSeat: data.childSeat ?? false,
    flightNumber: data.flightNumber || undefined,
    flightTime: data.flightTime || undefined,
    luggageCount: data.luggageCount != null ? data.luggageCount : undefined,
    smallLuggageCount: data.smallLuggageCount != null ? data.smallLuggageCount : undefined,
    largeLuggageCount: data.largeLuggageCount != null ? data.largeLuggageCount : undefined,
    returnFlightNumber: data.returnFlightNumber || undefined,
    returnFlightTime: data.returnFlightTime || undefined,
    returnLuggageCount: data.returnLuggageCount != null ? data.returnLuggageCount : undefined,
    returnSmallLuggageCount: data.returnSmallLuggageCount != null ? data.returnSmallLuggageCount : undefined,
    returnLargeLuggageCount: data.returnLargeLuggageCount != null ? data.returnLargeLuggageCount : undefined,
    price: data.price != null ? data.price : undefined,
    distance: data.distance != null ? data.distance : undefined,
    estimatedDuration: data.estimatedDuration != null ? data.estimatedDuration : undefined,
  });

  const rideJSON = ride.toJSON() as IRide;

  // Await the emails before returning. In serverless (Netlify Functions) the
  // container freezes as soon as the HTTP response is sent, so fire-and-forget
  // promises get killed before the Brevo request completes and no email is sent.
  const [confirmation, adminNotification] = await Promise.allSettled([
    sendBookingConfirmation(rideJSON),
    sendAdminNotification(rideJSON),
  ]);
  if (confirmation.status === 'rejected') {
    logger.error('Failed to send customer confirmation email:', confirmation.reason);
  }
  if (adminNotification.status === 'rejected') {
    logger.error('Failed to send admin notification email:', adminNotification.reason);
  }

  return rideJSON;
};

export const getRideById = async (rideId: string, userId?: string): Promise<IRide> => {
  const ride = await Ride.findById(rideId)
    .populate('user', 'firstName lastName phone profileImage')
    .populate('driver', 'firstName lastName phone profileImage rating');

  if (!ride) {
    throw new AppError('Ride not found', 404, 'RIDE_NOT_FOUND');
  }

  // If userId provided, verify ownership (skip for guest bookings)
  if (userId && ride.user && ride.user.toString() !== userId) {
    throw new AppError('Access denied', 403, 'ACCESS_DENIED');
  }

  return ride.toJSON() as IRide;
};

const SORT_OPTIONS: Record<string, Record<string, 1 | -1>> = {
  dateDesc: { scheduledFor: -1 },
  dateAsc: { scheduledFor: 1 },
  createdDesc: { createdAt: -1 },
};

export const getUserRides = async (
  userId: string,
  userEmail: string,
  filters?: RideFilters,
  pagination?: PaginationParams,
  sortBy?: string
) => {
  const page = pagination?.page || 1;
  const limit = pagination?.limit || 10;
  const skip = (page - 1) * limit;

  // Base query: ownership + date + search (NO status filter)
  const baseQuery: any = {
    $or: [
      { user: userId },
      { customerEmail: userEmail }
    ]
  };

  if (filters?.startDate || filters?.endDate) {
    baseQuery.scheduledFor = {};
    if (filters.startDate) {
      baseQuery.scheduledFor.$gte = filters.startDate;
    }
    if (filters.endDate) {
      baseQuery.scheduledFor.$lte = filters.endDate;
    }
  }

  // Location search (accent-insensitive for Greek)
  if (filters?.search) {
    const regex = toAccentInsensitiveRegex(filters.search);
    const ownershipCondition = baseQuery.$or;
    delete baseQuery.$or;
    baseQuery.$and = [
      { $or: ownershipCondition },
      { $or: [{ 'pickup.address': regex }, { 'dropoff.address': regex }] }
    ];
  }

  // Full query adds status filter on top of base
  const query: any = { ...baseQuery };
  if (filters?.status) {
    if ((filters.status as string) === 'active') {
      query.status = { $in: ['pending', 'accepted', 'driver_arrived', 'in_progress'] };
    } else {
      query.status = filters.status;
    }
  }

  const sort = SORT_OPTIONS[sortBy || 'dateDesc'] || SORT_OPTIONS.dateDesc;

  // Status counts aggregation on base query (all statuses)
  const [rides, total, statusAgg] = await Promise.all([
    Ride.find(query)
      .populate('driver', 'firstName lastName phone profileImage rating')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Ride.countDocuments(query),
    Ride.aggregate([
      { $match: baseQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
  ]);

  const statusCounts: Record<string, number> = { total: 0, pending: 0, accepted: 0, completed: 0, cancelled: 0 };
  for (const s of statusAgg) {
    if (s._id in statusCounts) statusCounts[s._id as string] = s.count;
    statusCounts.total += s.count;
  }

  return {
    items: rides.map((r) => r.toJSON()),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    statusCounts,
  };
};

export const cancelRide = async (rideId: string, userId: string, userEmail?: string): Promise<IRide> => {
  const ride = await Ride.findById(rideId);

  if (!ride) {
    throw new AppError('Ride not found', 404, 'RIDE_NOT_FOUND');
  }

  // Allow if: user owns the ride (by user ID or by email match)
  const ownsById = ride.user && ride.user.toString() === userId;
  const ownsByEmail = userEmail && ride.customerEmail === userEmail;
  if (!ownsById && !ownsByEmail) {
    throw new AppError('Access denied', 403, 'ACCESS_DENIED');
  }

  // Only allow cancellation of pending or accepted rides
  if (!['pending', 'accepted'].includes(ride.status)) {
    throw new AppError(
      `Cannot cancel ride with status: ${ride.status}`,
      400,
      'INVALID_STATUS'
    );
  }

  ride.status = 'cancelled';
  ride.cancelledAt = new Date();
  await ride.save();

  const rideJSON = ride.toJSON() as IRide;

  // Await before returning — serverless freezes once the response is sent.
  try {
    await sendCancellationNotification(rideJSON);
  } catch (error) {
    logger.error('Failed to send cancellation notification:', error);
  }

  return rideJSON;
};

export const rateRide = async (
  rideId: string,
  userId: string,
  data: RateRideRequest
): Promise<IRide> => {
  const ride = await Ride.findById(rideId);

  if (!ride) {
    throw new AppError('Ride not found', 404, 'RIDE_NOT_FOUND');
  }

  if (!ride.user || ride.user.toString() !== userId) {
    throw new AppError('Access denied', 403, 'ACCESS_DENIED');
  }

  if (ride.status !== 'completed') {
    throw new AppError('Can only rate completed rides', 400, 'RIDE_NOT_COMPLETED');
  }

  if (ride.userRating) {
    throw new AppError('Ride already rated', 400, 'ALREADY_RATED');
  }

  ride.userRating = data.rating;
  ride.userFeedback = data.feedback;
  await ride.save();

  // TODO: Update driver's average rating

  return ride.toJSON() as IRide;
};

// Admin functions
export const getAllRides = async (
  filters?: RideFilters & { customer?: string },
  pagination?: PaginationParams,
  sortBy?: string
) => {
  const page = pagination?.page || 1;
  const limit = pagination?.limit || 20;
  const skip = (page - 1) * limit;

  // Base query: date + search (NO status filter)
  const baseQuery: any = {};

  if (filters?.startDate || filters?.endDate) {
    baseQuery.scheduledFor = {};
    if (filters.startDate) {
      baseQuery.scheduledFor.$gte = filters.startDate;
    }
    if (filters.endDate) {
      baseQuery.scheduledFor.$lte = filters.endDate;
    }
  }

  // Customer + location search (accent-insensitive for Greek)
  if (filters?.customer) {
    const searchRegex = toAccentInsensitiveRegex(filters.customer);
    baseQuery.$or = [
      { customerName: searchRegex },
      { customerEmail: searchRegex },
      { customerPhone: searchRegex },
      { 'pickup.address': searchRegex },
      { 'dropoff.address': searchRegex },
    ];
  }

  // Full query adds status filter
  const query: any = { ...baseQuery };
  if (filters?.status) {
    query.status = filters.status;
  }

  const sort = SORT_OPTIONS[sortBy || 'dateDesc'] || SORT_OPTIONS.dateDesc;

  // Status counts aggregation on base query (all statuses)
  const [rides, total, statusAgg] = await Promise.all([
    Ride.find(query)
      .populate('user', 'firstName lastName phone email')
      .populate('driver', 'firstName lastName phone rating')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Ride.countDocuments(query),
    Ride.aggregate([
      { $match: baseQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
  ]);

  const statusCounts: Record<string, number> = { total: 0, pending: 0, accepted: 0, completed: 0, cancelled: 0 };
  for (const s of statusAgg) {
    if (s._id in statusCounts) statusCounts[s._id as string] = s.count;
    statusCounts.total += s.count;
  }

  return {
    items: rides.map((r) => r.toJSON()),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    statusCounts,
  };
};

export const acceptRide = async (rideId: string): Promise<IRide> => {
  const ride = await Ride.findById(rideId);

  if (!ride) {
    throw new AppError('Ride not found', 404, 'RIDE_NOT_FOUND');
  }

  if (ride.status !== 'pending') {
    throw new AppError(
      `Cannot accept ride with status: ${ride.status}`,
      400,
      'INVALID_STATUS'
    );
  }

  ride.status = 'accepted';
  ride.acceptedAt = new Date();
  await ride.save();

  return ride.toJSON() as IRide;
};

export const rejectRide = async (rideId: string, reason?: string): Promise<IRide> => {
  const ride = await Ride.findById(rideId);

  if (!ride) {
    throw new AppError('Ride not found', 404, 'RIDE_NOT_FOUND');
  }

  if (ride.status !== 'pending') {
    throw new AppError(
      `Cannot reject ride with status: ${ride.status}`,
      400,
      'INVALID_STATUS'
    );
  }

  ride.status = 'cancelled';
  ride.cancelledAt = new Date();
  if (reason) {
    ride.notes = ride.notes ? `${ride.notes}\n\nΛόγος ακύρωσης: ${reason}` : `Λόγος ακύρωσης: ${reason}`;
  }
  await ride.save();

  return ride.toJSON() as IRide;
};

export const completeRide = async (rideId: string, price: number): Promise<IRide> => {
  const ride = await Ride.findById(rideId);

  if (!ride) {
    throw new AppError('Ride not found', 404, 'RIDE_NOT_FOUND');
  }

  if (ride.status !== 'accepted') {
    throw new AppError(
      `Cannot complete ride with status: ${ride.status}`,
      400,
      'INVALID_STATUS'
    );
  }

  ride.status = 'completed';
  ride.completedAt = new Date();
  ride.price = price;
  await ride.save();

  return ride.toJSON() as IRide;
};

export const updateRide = async (
  rideId: string,
  updateData: {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    pickup?: { address: string };
    dropoff?: { address: string };
    scheduledFor?: Date | string;
    people?: number;
    isRoundtrip?: boolean;
    returnScheduledFor?: Date | string;
    returnPeople?: number;
    notes?: string;
    paymentMethod?: 'cash' | 'card';
    childSeat?: boolean;
    flightNumber?: string;
    flightTime?: string;
    luggageCount?: number;
    smallLuggageCount?: number;
    largeLuggageCount?: number;
    returnSmallLuggageCount?: number;
    returnLargeLuggageCount?: number;
  }
): Promise<IRide> => {
  const ride = await Ride.findById(rideId);

  if (!ride) {
    throw new AppError('Ride not found', 404, 'RIDE_NOT_FOUND');
  }

  // Update allowed fields
  if (updateData.customerName) ride.customerName = updateData.customerName;
  if (updateData.customerPhone) ride.customerPhone = updateData.customerPhone;
  if (updateData.customerEmail) ride.customerEmail = updateData.customerEmail;
  if (updateData.pickup?.address) {
    ride.pickup = { address: updateData.pickup.address, coordinates: { type: 'Point', coordinates: [0, 0] } };
  }
  if (updateData.dropoff?.address) {
    ride.dropoff = { address: updateData.dropoff.address, coordinates: { type: 'Point', coordinates: [0, 0] } };
  }
  if (updateData.scheduledFor) ride.scheduledFor = new Date(updateData.scheduledFor);
  if (updateData.people !== undefined) ride.people = updateData.people;
  if (updateData.isRoundtrip !== undefined) ride.isRoundtrip = updateData.isRoundtrip;
  if (updateData.returnScheduledFor) ride.returnScheduledFor = new Date(updateData.returnScheduledFor);
  if (updateData.returnPeople !== undefined) ride.returnPeople = updateData.returnPeople;
  if (updateData.notes !== undefined) ride.notes = updateData.notes;
  if (updateData.paymentMethod !== undefined) ride.paymentMethod = updateData.paymentMethod;
  if (updateData.childSeat !== undefined) ride.childSeat = updateData.childSeat;
  if (updateData.flightNumber !== undefined) ride.flightNumber = updateData.flightNumber;
  if (updateData.flightTime !== undefined) ride.flightTime = updateData.flightTime;
  if (updateData.luggageCount !== undefined) ride.luggageCount = updateData.luggageCount;
  if (updateData.smallLuggageCount !== undefined) ride.smallLuggageCount = updateData.smallLuggageCount;
  if (updateData.largeLuggageCount !== undefined) ride.largeLuggageCount = updateData.largeLuggageCount;
  if (updateData.returnSmallLuggageCount !== undefined) ride.returnSmallLuggageCount = updateData.returnSmallLuggageCount;
  if (updateData.returnLargeLuggageCount !== undefined) ride.returnLargeLuggageCount = updateData.returnLargeLuggageCount;

  await ride.save();

  return ride.toJSON() as IRide;
};
