import { Router } from 'express';
import * as rideController from '../controllers/ride.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/admin.middleware';

const router = Router();

// Public routes (no authentication required)
router.post('/', rideController.createRide); // Guest bookings allowed
router.get('/:id', rideController.getRide); // Guest access to their booking

// Admin routes (require authentication + admin role)
router.get('/admin/all', authenticateToken, isAdmin, rideController.getAllRides);
router.patch('/:id/accept', authenticateToken, isAdmin, rideController.acceptRide);
router.patch('/:id/reject', authenticateToken, isAdmin, rideController.rejectRide);
router.patch('/:id/complete', authenticateToken, isAdmin, rideController.completeRide);
router.patch('/:id/update', authenticateToken, isAdmin, rideController.updateRide);

// Protected routes (authentication required)
router.get('/', authenticateToken, rideController.getUserRides);
router.get('/:id/status', authenticateToken, rideController.getRideStatus);
router.patch('/:id/cancel', authenticateToken, rideController.cancelRide);
router.post('/:id/rate', authenticateToken, rideController.rateRide);

export default router;
