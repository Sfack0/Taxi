import { Router } from 'express';
import * as pricingController from '../controllers/pricing.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/admin.middleware';

const router = Router();

// Public routes
router.get('/', pricingController.getPricing);

// Admin routes
router.put('/admin', authenticateToken, isAdmin, pricingController.updatePricing);

export default router;
