import { Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { UserRepository } from '../repositories/user.repository';
import { ProfileRepository } from '../repositories/profile.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { AuthRequest } from '../middleware/auth.middleware';

export class UserController {
  private userService: UserService;

  constructor() {
    const userRepo = new UserRepository();
    const profileRepo = new ProfileRepository();
    const auditRepo = new AuditRepository();
    this.userService = new UserService(userRepo, profileRepo, auditRepo);
  }

  getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const result = await this.userService.getUserProfile(req.user.userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const profile = await this.userService.updateProfile(
        req.user.userId,
        req.body,
        req.user.userId
      );
      res.json(profile);
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { currentPassword, newPassword } = req.body;
      await this.userService.changePassword(req.user.userId, currentPassword, newPassword);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

