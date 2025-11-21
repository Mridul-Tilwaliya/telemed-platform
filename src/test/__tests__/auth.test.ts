import { AuthService } from '../../services/auth.service';
import { UserRepository } from '../../repositories/user.repository';
import { RefreshTokenRepository } from '../../repositories/refresh-token.repository';
import { AuditRepository } from '../../repositories/audit.repository';
import { UserRole } from '../../types';

describe('AuthService', () => {
  let authService: AuthService;
  let userRepo: UserRepository;
  let refreshTokenRepo: RefreshTokenRepository;
  let auditRepo: AuditRepository;

  beforeEach(() => {
    userRepo = new UserRepository();
    refreshTokenRepo = new RefreshTokenRepository();
    auditRepo = new AuditRepository();
    authService = new AuthService(userRepo, refreshTokenRepo, auditRepo);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const result = await authService.register(
        'newuser@test.com',
        'Test1234!',
        UserRole.PATIENT
      );

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('newuser@test.com');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should reject weak passwords', async () => {
      await expect(
        authService.register('user@test.com', 'weak', UserRole.PATIENT)
      ).rejects.toThrow();
    });

    it('should reject duplicate emails', async () => {
      await authService.register('duplicate@test.com', 'Test1234!', UserRole.PATIENT);
      await expect(
        authService.register('duplicate@test.com', 'Test1234!', UserRole.PATIENT)
      ).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login with correct credentials', async () => {
      await authService.register('login@test.com', 'Test1234!', UserRole.PATIENT);
      const result = await authService.login('login@test.com', 'Test1234!');

      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should reject incorrect password', async () => {
      await authService.register('login2@test.com', 'Test1234!', UserRole.PATIENT);
      await expect(
        authService.login('login2@test.com', 'WrongPassword!')
      ).rejects.toThrow();
    });
  });
});

