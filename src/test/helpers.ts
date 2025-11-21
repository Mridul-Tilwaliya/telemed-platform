import { UserRepository } from '../repositories/user.repository';
import { ProfileRepository } from '../repositories/profile.repository';
import { DoctorRepository } from '../repositories/doctor.repository';
import { hashPassword } from '../utils/password';
import { UserRole } from '../types';

export async function createTestUser(
  email: string = 'test@example.com',
  role: UserRole = UserRole.PATIENT
) {
  const userRepo = new UserRepository();
  const profileRepo = new ProfileRepository();

  const passwordHash = await hashPassword('Test1234!');
  const user = await userRepo.create({
    email,
    passwordHash,
    role,
    isEmailVerified: true,
    isMfaEnabled: false,
    isActive: true,
  });

  const profile = await profileRepo.create({
    userId: user.id,
    firstName: 'Test',
    lastName: 'User',
  });

  return { user, profile };
}

export async function createTestDoctor(userId: string) {
  const doctorRepo = new DoctorRepository();
  return doctorRepo.create({
    userId,
    licenseNumber: `LIC-${Date.now()}`,
    specialization: 'General Medicine',
    yearsOfExperience: 5,
    consultationFee: 100.0,
    isAvailable: true,
  });
}

