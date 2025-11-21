import Redis from 'ioredis';
import { config } from '../config/env';

class RedisClient {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
    });
  }

  async get<T = string>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch (error) {
      console.error('Redis get error', { key, error });
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      console.error('Redis set error', { key, error });
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Redis delete error', { key, error });
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error', { key, error });
      return false;
    }
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    try {
      const value = await this.client.incr(key);
      if (ttlSeconds && value === 1) {
        await this.client.expire(key, ttlSeconds);
      }
      return value;
    } catch (error) {
      console.error('Redis increment error', { key, error });
      throw error;
    }
  }

  async getClient(): Promise<Redis> {
    return this.client;
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}

export const redis = new RedisClient();

