import { db } from '../database/connection';
import { ConsultationStatus, PaymentStatus } from '../types';

export interface DashboardStats {
  totalUsers: number;
  totalDoctors: number;
  totalConsultations: number;
  activeConsultations: number;
  completedConsultations: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageRating: number;
  topSpecializations: Array<{ specialization: string; count: number }>;
}

export interface ConsultationTrends {
  date: string;
  scheduled: number;
  completed: number;
  cancelled: number;
}

export class AnalyticsService {
  async getDashboardStats(): Promise<DashboardStats> {
    const [
      totalUsers,
      totalDoctors,
      totalConsultations,
      activeConsultations,
      completedConsultations,
      totalRevenue,
      monthlyRevenue,
      averageRating,
      topSpecializations,
    ] = await Promise.all([
      this.getTotalUsers(),
      this.getTotalDoctors(),
      this.getTotalConsultations(),
      this.getActiveConsultations(),
      this.getCompletedConsultations(),
      this.getTotalRevenue(),
      this.getMonthlyRevenue(),
      this.getAverageRating(),
      this.getTopSpecializations(),
    ]);

    return {
      totalUsers,
      totalDoctors,
      totalConsultations,
      activeConsultations,
      completedConsultations,
      totalRevenue,
      monthlyRevenue,
      averageRating,
      topSpecializations,
    };
  }

  async getConsultationTrends(days: number = 30): Promise<ConsultationTrends[]> {
    const result = await db.query<{
      date: string;
      scheduled: string;
      completed: string;
      cancelled: string;
    }>(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
       FROM consultations
       WHERE created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    return result.map((r) => ({
      date: r.date,
      scheduled: parseInt(r.scheduled, 10),
      completed: parseInt(r.completed, 10),
      cancelled: parseInt(r.cancelled, 10),
    }));
  }

  private async getTotalUsers(): Promise<number> {
    const result = await db.queryOne<{ count: string }>('SELECT COUNT(*) as count FROM users');
    return result ? parseInt(result.count, 10) : 0;
  }

  private async getTotalDoctors(): Promise<number> {
    const result = await db.queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM doctors WHERE is_available = true"
    );
    return result ? parseInt(result.count, 10) : 0;
  }

  private async getTotalConsultations(): Promise<number> {
    const result = await db.queryOne<{ count: string }>('SELECT COUNT(*) as count FROM consultations');
    return result ? parseInt(result.count, 10) : 0;
  }

  private async getActiveConsultations(): Promise<number> {
    const result = await db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM consultations 
       WHERE status IN ('scheduled', 'in_progress')`
    );
    return result ? parseInt(result.count, 10) : 0;
  }

  private async getCompletedConsultations(): Promise<number> {
    const result = await db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM consultations 
       WHERE status = '${ConsultationStatus.COMPLETED}'`
    );
    return result ? parseInt(result.count, 10) : 0;
  }

  private async getTotalRevenue(): Promise<number> {
    const result = await db.queryOne<{ sum: string }>(
      `SELECT COALESCE(SUM(amount), 0) as sum FROM payments 
       WHERE status = '${PaymentStatus.COMPLETED}'`
    );
    return result ? parseFloat(result.sum) : 0;
  }

  private async getMonthlyRevenue(): Promise<number> {
    const result = await db.queryOne<{ sum: string }>(
      `SELECT COALESCE(SUM(amount), 0) as sum FROM payments 
       WHERE status = '${PaymentStatus.COMPLETED}' 
       AND paid_at >= DATE_TRUNC('month', CURRENT_DATE)`
    );
    return result ? parseFloat(result.sum) : 0;
  }

  private async getAverageRating(): Promise<number> {
    const result = await db.queryOne<{ avg: string }>(
      `SELECT COALESCE(AVG(rating), 0) as avg FROM consultations 
       WHERE rating IS NOT NULL`
    );
    return result ? Math.round(parseFloat(result.avg) * 100) / 100 : 0;
  }

  private async getTopSpecializations(): Promise<Array<{ specialization: string; count: number }>> {
    const result = await db.query<{ specialization: string; count: string }>(
      `SELECT specialization, COUNT(*) as count 
       FROM doctors 
       WHERE is_available = true 
       GROUP BY specialization 
       ORDER BY count DESC 
       LIMIT 10`
    );

    return result.map((r) => ({
      specialization: r.specialization,
      count: parseInt(r.count, 10),
    }));
  }
}

