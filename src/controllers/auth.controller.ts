import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { AuthRequest } from '../middleware/auth.middleware';

export class AuthController {
  private authService: AuthService;

  constructor() {
    const userRepo = new UserRepository();
    const refreshTokenRepo = new RefreshTokenRepository();
    const auditRepo = new AuditRepository();
    this.authService = new AuthService(userRepo, refreshTokenRepo, auditRepo);
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, role } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await this.authService.register(
        email,
        password,
        role,
        ipAddress,
        userAgent
      );

      res.status(201).json({
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
        },
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, mfaToken } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await this.authService.login(email, password, mfaToken, ipAddress, userAgent);

      res.json({
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
        },
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const result = await this.authService.refreshAccessToken(refreshToken);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      await this.authService.logout(refreshToken, req.user.userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  logoutAll = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      await this.authService.logoutAll(req.user.userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  setupMFA = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const result = await this.authService.setupMFA(req.user.userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  enableMFA = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { token } = req.body;
      await this.authService.enableMFA(req.user.userId, token);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  disableMFA = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { password } = req.body;
      await this.authService.disableMFA(req.user.userId, password);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

