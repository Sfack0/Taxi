import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import rideRoutes from './ride.routes';
import carouselRoutes from './carousel.routes';
import pricingRoutes from './pricing.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/rides', rideRoutes);
router.use('/carousel', carouselRoutes);
router.use('/pricing', pricingRoutes);

export default router;
