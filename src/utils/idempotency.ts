import { v4 as uuidv4 } from 'uuid';
import { redis } from '../database/redis';

const IDEMPOTENCY_TTL = 24 * 60 * 60; // 24 hours

export async function checkIdempotency(key: string): Promise<string | null> {
  const existing = await redis.get<string>(`idempotency:${key}`);
  return existing;
}

export async function setIdempotency(
  key: string,
  response: unknown
): Promise<void> {
  await redis.set(`idempotency:${key}`, response, IDEMPOTENCY_TTL);
}

export function generateIdempotencyKey(): string {
  return uuidv4();
}

