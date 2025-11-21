import { Request, Response, NextFunction } from 'express';
import { checkIdempotency, setIdempotency, generateIdempotencyKey } from '../utils/idempotency';
import { AuthRequest } from './auth.middleware';

// Only apply to POST, PUT, PATCH methods
const IDEMPOTENT_METHODS = ['POST', 'PUT', 'PATCH'];

export async function idempotency(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Only apply to write operations
  if (!IDEMPOTENT_METHODS.includes(req.method)) {
    return next();
  }

  // Get idempotency key from header or generate one
  const idempotencyKey =
    req.headers['idempotency-key']?.toString() || generateIdempotencyKey();

  // Check if we've seen this request before
  const cachedResponse = await checkIdempotency(idempotencyKey);
  if (cachedResponse) {
    res.setHeader('Idempotency-Key', idempotencyKey);
    return res.status(200).json(JSON.parse(cachedResponse));
  }

  // Store original json method
  const originalJson = res.json.bind(res);
  
  // Override json to cache response
  res.json = function (body: unknown) {
    // Cache successful responses (2xx)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      setIdempotency(idempotencyKey, body).catch((err) => {
        console.error('Failed to cache idempotency response', err);
      });
    }
    res.setHeader('Idempotency-Key', idempotencyKey);
    return originalJson(body);
  };

  next();
}

