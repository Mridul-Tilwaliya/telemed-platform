import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/authorization.middleware';
import { UserRole } from '../types';

const router = Router();
const analyticsController = new AnalyticsController();

// All analytics routes require admin role
router.use(authenticate);
router.use(requireRole(UserRole.ADMIN));

router.get('/dashboard/stats', analyticsController.getDashboardStats);
router.get('/dashboard/trends', analyticsController.getConsultationTrends);

export default router;

