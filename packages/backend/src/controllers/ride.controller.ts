import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  ApiResponse,
  CreateRideRequest,
  Ride,
  RateRideRequest,
  PaginatedResponse,
} from '@cts/shared';
import * as rideService from '../services/ride.service';
import { verifyRideAction } from '../utils/rideActionToken';
import logger from '../utils/logger';

// Minimal styled HTML page for one-click email actions (Greek — admin-facing).
const actionResultPage = (title: string, message: string, color: string): string => `<!DOCTYPE html>
<html lang="el"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title></head>
<body style="font-family: Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 24px; color: #111827;">
  <div style="max-width: 440px; margin: 40px auto; background: #fff; border-radius: 12px; padding: 32px 24px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,.1);">
    <div style="width: 64px; height: 64px; border-radius: 50%; background: ${color}1a; color: ${color}; display: inline-flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; margin-bottom: 16px;">✓</div>
    <h1 style="font-size: 20px; margin: 0 0 8px 0; color: ${color};">${title}</h1>
    <p style="color: #4b5563; font-size: 15px; margin: 0;">${message}</p>
    <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">Comfort Transfer Services</p>
  </div>
</body></html>`;

// Greece is UTC+2 (winter) / UTC+3 (summer EEST). Offset the date-only filter
// strings so that "2026-06-04" means 00:00–23:59 Greek local time, not UTC.
const GREECE_OFFSET_HOURS = 3; // EEST (summer); conservative — errs toward inclusion

const parseDateFilter = (dateStr: string, isEnd: boolean): Date => {
  // dateStr is "YYYY-MM-DD" sent by the frontend's toLocalDateString()
  const [y, m, d] = dateStr.split('-').map(Number);
  if (isEnd) {
    // End of that day in Greek time = 23:59:59 EEST → UTC: subtract offset
    return new Date(Date.UTC(y, m - 1, d, 23 - GREECE_OFFSET_HOURS, 59, 59, 999));
  }
  // Start of that day in Greek time = 00:00:00 EEST → UTC: subtract offset
  return new Date(Date.UTC(y, m - 1, d, -GREECE_OFFSET_HOURS, 0, 0, 0));
};

export const createRide = async (
  req: Request<{}, {}, CreateRideRequest>,
  res: Response<ApiResponse<{ ride: Ride }>>,
  next: NextFunction
): Promise<void> => {
  try {
    // Support both authenticated and guest bookings
    const userId = (req as AuthRequest).user?.id;
    // Only keep allowed fields
    const {
      pickup,
      dropoff,
      customerName,
      customerPhone,
      customerEmail,
      customerLanguage,
      people,
      scheduledFor,
      isRoundtrip,
      returnScheduledFor,
      returnPeople,
      notes,
      paymentMethod,
      childSeat,
      babySeat,
      flightNumber,
      flightTime,
      luggageCount,
      smallLuggageCount,
      largeLuggageCount,
      returnFlightNumber,
      returnFlightTime,
      returnLuggageCount,
      returnSmallLuggageCount,
      returnLargeLuggageCount,
      price,
      distance,
      estimatedDuration,
    } = req.body;
    const ride = await rideService.createRide(userId, {
      pickup,
      dropoff,
      customerName,
      customerPhone,
      customerEmail,
      customerLanguage,
      people,
      scheduledFor,
      isRoundtrip,
      returnScheduledFor,
      returnPeople,
      notes,
      paymentMethod,
      childSeat,
      babySeat,
      flightNumber,
      flightTime,
      luggageCount,
      smallLuggageCount,
      largeLuggageCount,
      returnFlightNumber,
      returnFlightTime,
      returnLuggageCount,
      returnSmallLuggageCount,
      returnLargeLuggageCount,
      price,
      distance,
      estimatedDuration,
    });

    res.status(201).json({
      success: true,
      data: { ride },
    });
  } catch (error) {
    logger.error('Ride creation error:', error);
    next(error);
  }
};

export const getRide = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<{ ride: Ride }>>,
  next: NextFunction
): Promise<void> => {
  try {
    // Support both authenticated and guest access
    const userId = (req as AuthRequest).user?.id;
    const rideId = req.params.id;

    const ride = await rideService.getRideById(rideId, userId);

    res.status(200).json({
      success: true,
      data: { ride },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserRides = async (
  req: AuthRequest,
  res: Response<ApiResponse<{ rides: PaginatedResponse<Ride> }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userEmail = req.user!.email;
    const { status, startDate, endDate, search, sortBy, page, limit } = req.query;

    const filters = {
      status: status as any,
      startDate: startDate ? parseDateFilter(startDate as string, false) : undefined,
      endDate: endDate ? parseDateFilter(endDate as string, true) : undefined,
      search: search as string | undefined,
    };

    const pagination = {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    };

    const rides = await rideService.getUserRides(userId, userEmail, filters, pagination, sortBy as string | undefined);

    res.status(200).json({
      success: true,
      data: { rides },
    });
  } catch (error) {
    next(error);
  }
};

export const cancelRide = async (
  req: AuthRequest<{ id: string }>,
  res: Response<ApiResponse<{ ride: Ride }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userEmail = req.user!.email;
    const rideId = req.params.id;

    const ride = await rideService.cancelRide(rideId, userId, userEmail);

    res.status(200).json({
      success: true,
      data: { ride },
    });
  } catch (error) {
    next(error);
  }
};

export const rateRide = async (
  req: AuthRequest<{ id: string }, {}, RateRideRequest>,
  res: Response<ApiResponse<{ ride: Ride }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const rideId = req.params.id;

    const ride = await rideService.rateRide(rideId, userId, req.body);

    res.status(200).json({
      success: true,
      data: { ride },
    });
  } catch (error) {
    next(error);
  }
};

export const getRideStatus = async (
  req: AuthRequest<{ id: string }>,
  res: Response<ApiResponse<{ status: string; ride: Ride }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const rideId = req.params.id;

    const ride = await rideService.getRideById(rideId, userId);

    res.status(200).json({
      success: true,
      data: {
        status: ride.status,
        ride,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin endpoints
export const getAllRides = async (
  req: AuthRequest,
  res: Response<ApiResponse<{ rides: PaginatedResponse<Ride> }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, startDate, endDate, customer, sortBy, page, limit } = req.query;

    const filters = {
      status: status as any,
      startDate: startDate ? parseDateFilter(startDate as string, false) : undefined,
      endDate: endDate ? parseDateFilter(endDate as string, true) : undefined,
      customer: customer as string | undefined,
    };

    const pagination = {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    };

    const rides = await rideService.getAllRides(filters, pagination, sortBy as string | undefined);

    res.status(200).json({
      success: true,
      data: { rides },
    });
  } catch (error) {
    next(error);
  }
};

export const acceptRide = async (
  req: AuthRequest<{ id: string }>,
  res: Response<ApiResponse<{ ride: Ride }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const rideId = req.params.id;
    const ride = await rideService.acceptRide(rideId);

    res.status(200).json({
      success: true,
      data: { ride },
    });
  } catch (error) {
    next(error);
  }
};

// One-click accept from the admin notification email. Public route secured by a
// signed token bound to the ride id + action; behaves exactly like the in-app
// accept (sets status to accepted AND emails the customer their confirmation).
export const acceptRideByEmail = async (
  req: Request<{ id: string }, any, any, { token?: string }>,
  res: Response
): Promise<void> => {
  const rideId = req.params.id;
  const token = req.query.token;

  if (!verifyRideAction(rideId, 'accept', token)) {
    res.status(403).send(actionResultPage('Μη έγκυρος σύνδεσμος', 'Ο σύνδεσμος αποδοχής δεν είναι έγκυρος ή έχει αλλοιωθεί.', '#dc2626'));
    return;
  }

  try {
    await rideService.acceptRide(rideId);
    res.status(200).send(actionResultPage('Η κράτηση έγινε αποδεκτή', 'Ο πελάτης ειδοποιήθηκε με email επιβεβαίωσης.', '#16a34a'));
  } catch (error: any) {
    if (error?.code === 'INVALID_STATUS') {
      res.status(200).send(actionResultPage('Ήδη επεξεργασμένη', 'Αυτή η κράτηση δεν είναι πλέον σε εκκρεμότητα (ίσως έχει ήδη γίνει αποδεκτή).', '#d97706'));
      return;
    }
    if (error?.code === 'RIDE_NOT_FOUND') {
      res.status(404).send(actionResultPage('Δεν βρέθηκε', 'Η κράτηση δεν βρέθηκε.', '#dc2626'));
      return;
    }
    logger.error('accept-email error:', error);
    res.status(500).send(actionResultPage('Σφάλμα', 'Παρουσιάστηκε σφάλμα. Δοκιμάστε ξανά ή κάντε αποδοχή από την εφαρμογή.', '#dc2626'));
  }
};

export const rejectRide = async (
  req: AuthRequest<{ id: string }>,
  res: Response<ApiResponse<{ ride: Ride }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const rideId = req.params.id;
    const { reason } = req.body;

    const ride = await rideService.rejectRide(rideId, reason);

    res.status(200).json({
      success: true,
      data: { ride },
    });
  } catch (error) {
    next(error);
  }
};

export const completeRide = async (
  req: AuthRequest<{ id: string }>,
  res: Response<ApiResponse<{ ride: Ride }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const rideId = req.params.id;
    const { price } = req.body;
    const ride = await rideService.completeRide(rideId, price);

    res.status(200).json({
      success: true,
      data: { ride },
    });
  } catch (error) {
    next(error);
  }
};

export const updateRide = async (
  req: AuthRequest<{ id: string }>,
  res: Response<ApiResponse<{ ride: Ride }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const rideId = req.params.id;
    const updateData = req.body;

    const ride = await rideService.updateRide(rideId, updateData);

    res.status(200).json({
      success: true,
      data: { ride },
    });
  } catch (error) {
    next(error);
  }
};
