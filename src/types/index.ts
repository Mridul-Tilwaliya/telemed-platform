export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  ADMIN = 'admin',
  SUPPORT = 'support',
}

export enum ConsultationStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  BOOKING = 'booking',
  PRESCRIPTION = 'prescription',
  PAYMENT = 'payment',
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isEmailVerified: boolean;
  isMfaEnabled: boolean;
  mfaSecret?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Profile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  avatarUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Doctor {
  id: string;
  userId: string;
  licenseNumber: string;
  specialization: string;
  yearsOfExperience: number;
  consultationFee: number;
  bio?: string;
  qualifications?: string[];
  languages?: string[];
  isAvailable: boolean;
  rating?: number;
  totalConsultations?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailabilitySlot {
  id: string;
  doctorId: string;
  startTime: Date;
  endTime: Date;
  isBooked: boolean;
  consultationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Consultation {
  id: string;
  patientId: string;
  doctorId: string;
  slotId: string;
  status: ConsultationStatus;
  scheduledAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  symptoms?: string;
  diagnosis?: string;
  notes?: string;
  rating?: number;
  feedback?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Prescription {
  id: string;
  consultationId: string;
  doctorId: string;
  patientId: string;
  medications: Medication[];
  instructions?: string;
  followUpDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Payment {
  id: string;
  consultationId: string;
  patientId: string;
  doctorId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod?: string;
  transactionId?: string;
  paidAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

