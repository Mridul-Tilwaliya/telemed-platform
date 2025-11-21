import { UserRepository } from '../repositories/user.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { generateMFASecret, verifyMFAToken } from '../utils/mfa';
import { AuthenticationError, ValidationError, NotFoundError } from '../utils/errors';
import { User, UserRole, AuditAction } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { addDays } from 'date-fns';

export class AuthService {
  constructor(
    private userRepo: UserRepository,
    private refreshTokenRepo: RefreshTokenRepository,
    private auditRepo: AuditRepository
  ) {}

  async register(
    email: string,
    password: string,
    role: UserRole = UserRole.PATIENT,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      throw new ValidationError('Password does not meet requirements', {
        password: passwordValidation.errors.join(', '),
      });
    }

    // Check if user already exists
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new ValidationError('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await this.userRepo.create({
      email,
      passwordHash,
      role,
      isEmailVerified: false,
      isMfaEnabled: false,
      isActive: true,
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Store refresh token
    await this.refreshTokenRepo.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: addDays(new Date(), 7),
      isRevoked: false,
    });

    // Audit log
    await this.auditRepo.create({
      userId: user.id,
      action: AuditAction.CREATE,
      resourceType: 'user',
      resourceId: user.id,
      details: { email, role },
      ipAddress,
      userAgent,
    });

    return { user, accessToken, refreshToken };
  }

  async login(
    email: string,
    password: string,
    mfaToken?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated');
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      await this.auditRepo.create({
        userId: user.id,
        action: AuditAction.LOGIN,
        resourceType: 'auth',
        details: { email, success: false, reason: 'invalid_password' },
        ipAddress,
        userAgent,
      });
      throw new AuthenticationError('Invalid credentials');
    }

    // Check MFA if enabled
    if (user.isMfaEnabled) {
      if (!mfaToken || !user.mfaSecret) {
        throw new AuthenticationError('MFA token required');
      }

      const isValidMFA = verifyMFAToken(user.mfaSecret, mfaToken);
      if (!isValidMFA) {
        await this.auditRepo.create({
          userId: user.id,
          action: AuditAction.LOGIN,
          resourceType: 'auth',
          details: { email, success: false, reason: 'invalid_mfa' },
          ipAddress,
          userAgent,
        });
        throw new AuthenticationError('Invalid MFA token');
      }
    }

    // Update last login
    await this.userRepo.update(user.id, { lastLoginAt: new Date() });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Store refresh token
    await this.refreshTokenRepo.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: addDays(new Date(), 7),
      isRevoked: false,
    });

    // Audit log
    await this.auditRepo.create({
      userId: user.id,
      action: AuditAction.LOGIN,
      resourceType: 'auth',
      details: { email, success: true },
      ipAddress,
      userAgent,
    });

    return { user, accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    const tokenData = verifyRefreshToken(refreshToken);
    const storedToken = await this.refreshTokenRepo.findByToken(refreshToken);

    if (!storedToken || storedToken.userId !== tokenData.userId) {
      throw new AuthenticationError('Invalid refresh token');
    }

    const user = await this.userRepo.findById(tokenData.userId);
    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or inactive');
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { accessToken };
  }

  async logout(refreshToken: string, userId: string): Promise<void> {
    await this.refreshTokenRepo.revokeToken(refreshToken);
    await this.auditRepo.create({
      userId,
      action: AuditAction.LOGOUT,
      resourceType: 'auth',
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.refreshTokenRepo.revokeAllUserTokens(userId);
    await this.auditRepo.create({
      userId,
      action: AuditAction.LOGOUT,
      resourceType: 'auth',
      details: { allDevices: true },
    });
  }

  async setupMFA(userId: string): Promise<{ secret: string; qrCodeUrl: string }> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const mfaData = generateMFASecret(user.email);
    await this.userRepo.update(userId, {
      mfaSecret: mfaData.secret,
    });

    return mfaData;
  }

  async enableMFA(userId: string, token: string): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user || !user.mfaSecret) {
      throw new NotFoundError('User or MFA secret');
    }

    const isValid = verifyMFAToken(user.mfaSecret, token);
    if (!isValid) {
      throw new ValidationError('Invalid MFA token');
    }

    await this.userRepo.update(userId, { isMfaEnabled: true });
  }

  async disableMFA(userId: string, password: string): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid password');
    }

    await this.userRepo.update(userId, {
      isMfaEnabled: false,
      mfaSecret: undefined,
    });
  }
}

