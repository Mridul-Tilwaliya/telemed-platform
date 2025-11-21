import { redis } from '../database/redis';
import { config } from '../config/env';

export class CacheService {
  private defaultTTL: number;

  constructor(defaultTTL: number = config.redis.ttl) {
    this.defaultTTL = defaultTTL;
  }

  async get<T>(key: string): Promise<T | null> {
    return redis.get<T>(key);
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    await redis.set(key, value, ttlSeconds || this.defaultTTL);
  }

  async del(key: string): Promise<void> {
    await redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return redis.exists(key);
  }

  // Cache key generators
  static userKey(userId: string): string {
    return `user:${userId}`;
  }

  static doctorKey(doctorId: string): string {
    return `doctor:${doctorId}`;
  }

  static consultationKey(consultationId: string): string {
    return `consultation:${consultationId}`;
  }

  static availableSlotsKey(doctorId: string, startDate: string, endDate: string): string {
    return `slots:${doctorId}:${startDate}:${endDate}`;
  }

  static doctorListKey(filters: Record<string, unknown>): string {
    const filterStr = JSON.stringify(filters);
    return `doctors:list:${Buffer.from(filterStr).toString('base64')}`;
  }
}

export const cache = new CacheService();

