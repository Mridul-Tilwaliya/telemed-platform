import { UserRepository } from '../repositories/user.repository';
import { ProfileRepository } from '../repositories/profile.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors';
import { User, Profile, UserRole, AuditAction } from '../types';

export class UserService {
  constructor(
    private userRepo: UserRepository,
    private profileRepo: ProfileRepository,
    private auditRepo: AuditRepository
  ) {}

  async getUserProfile(userId: string): Promise<{ user: User; profile: Profile | null }> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const profile = await this.profileRepo.findByUserId(userId);
    return { user, profile };
  }

  async updateProfile(
    userId: string,
    updates: Partial<Profile>,
    actorId: string
  ): Promise<Profile> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Check authorization
    if (userId !== actorId && !this.isAdmin(actorId)) {
      throw new AuthorizationError();
    }

    let profile = await this.profileRepo.findByUserId(userId);
    
    if (profile) {
      profile = await this.profileRepo.update(userId, updates);
    } else {
      profile = await this.profileRepo.create({
        userId,
        firstName: updates.firstName || '',
        lastName: updates.lastName || '',
        ...updates,
      });
    }

    await this.auditRepo.create({
      userId: actorId,
      action: AuditAction.UPDATE,
      resourceType: 'profile',
      resourceId: profile.id,
      details: { updatedFields: Object.keys(updates) },
    });

    return profile;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const isValidPassword = await comparePassword(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new ValidationError('Current password is incorrect');
    }

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      throw new ValidationError('New password does not meet requirements', {
        password: passwordValidation.errors.join(', '),
      });
    }

    const passwordHash = await hashPassword(newPassword);
    await this.userRepo.update(userId, { passwordHash });

    await this.auditRepo.create({
      userId,
      action: AuditAction.UPDATE,
      resourceType: 'user',
      resourceId: userId,
      details: { field: 'password' },
    });
  }

  async deactivateUser(userId: string, actorId: string): Promise<void> {
    if (userId !== actorId && !(await this.isAdmin(actorId))) {
      throw new AuthorizationError();
    }

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    await this.userRepo.update(userId, { isActive: false });

    await this.auditRepo.create({
      userId: actorId,
      action: AuditAction.UPDATE,
      resourceType: 'user',
      resourceId: userId,
      details: { action: 'deactivate' },
    });
  }

  async activateUser(userId: string, actorId: string): Promise<void> {
    if (!(await this.isAdmin(actorId))) {
      throw new AuthorizationError();
    }

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    await this.userRepo.update(userId, { isActive: true });

    await this.auditRepo.create({
      userId: actorId,
      action: AuditAction.UPDATE,
      resourceType: 'user',
      resourceId: userId,
      details: { action: 'activate' },
    });
  }

  private async isAdmin(userId: string): Promise<boolean> {
    const user = await this.userRepo.findById(userId);
    return user?.role === UserRole.ADMIN;
  }
}

