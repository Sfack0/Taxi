import { Router } from 'express';
import * as carouselController from '../controllers/carousel.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/admin.middleware';

const router = Router();

// Public routes (no authentication required)
router.get('/', carouselController.getActiveImages);

// Admin routes (require authentication + admin role)
router.get('/admin/all', authenticateToken, isAdmin, carouselController.getAllImages);
router.post('/admin', authenticateToken, isAdmin, carouselController.addImage);
router.patch('/admin/:id', authenticateToken, isAdmin, carouselController.updateImage);
router.delete('/admin/:id', authenticateToken, isAdmin, carouselController.deleteImage);
router.put('/admin/reorder', authenticateToken, isAdmin, carouselController.reorderImages);

export default router;
