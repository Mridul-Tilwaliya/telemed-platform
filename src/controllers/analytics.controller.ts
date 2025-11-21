import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { requireRole } from '../middleware/authorization.middleware';
import { UserRole } from '../types';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.analyticsService.getDashboardStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  };

  getConsultationTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const trends = await this.analyticsService.getConsultationTrends(days);
      res.json(trends);
    } catch (error) {
      next(error);
    }
  };
}

