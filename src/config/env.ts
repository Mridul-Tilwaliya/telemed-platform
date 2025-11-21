import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  db: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    ssl?: boolean;
    poolSize: number;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    ttl: number;
  };
  jwt: {
    secret: string;
    refreshSecret: string;
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
  };
  mfa: {
    secret: string;
    issuer: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  encryption: {
    algorithm: string;
    keyLength: number;
  };
  logging: {
    level: string;
    filePath: string;
  };
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value !== undefined ? value : (defaultValue || '');
}

export const config: Config = {
  port: parseInt(getEnvVar('PORT', '5000'), 10),
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  db: {
    host: getEnvVar('DB_HOST', 'localhost'),
    port: parseInt(getEnvVar('DB_PORT', '5432'), 10),
    user: getEnvVar('DB_USER', 'amrutam'),
    password: getEnvVar('DB_PASSWORD', 'amrutam123'),
    database: getEnvVar('DB_NAME', 'amrutam_db'),
    ssl: getEnvVar('DB_SSL', 'false') === 'true',
    poolSize: parseInt(getEnvVar('DB_POOL_SIZE', '20'), 10),
  },
  redis: {
    host: getEnvVar('REDIS_HOST', 'localhost'),
    port: parseInt(getEnvVar('REDIS_PORT', '6379'), 10),
    password: process.env.REDIS_PASSWORD || undefined,
    ttl: parseInt(getEnvVar('REDIS_TTL', '3600'), 10),
  },
  jwt: {
    secret: getEnvVar('JWT_SECRET', 'change-me-in-production'),
    refreshSecret: getEnvVar('JWT_REFRESH_SECRET', 'change-me-in-production'),
    accessTokenExpiry: getEnvVar('JWT_ACCESS_EXPIRY', '15m'),
    refreshTokenExpiry: getEnvVar('JWT_REFRESH_EXPIRY', '7d'),
  },
  mfa: {
    secret: getEnvVar('MFA_SECRET', 'change-me-in-production'),
    issuer: getEnvVar('MFA_ISSUER', 'Amrutam Telemed'),
  },
  rateLimit: {
    windowMs: parseInt(getEnvVar('RATE_LIMIT_WINDOW_MS', '900000'), 10), // 15 minutes
    maxRequests: parseInt(getEnvVar('RATE_LIMIT_MAX', '100'), 10),
  },
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
  },
  logging: {
    level: getEnvVar('LOG_LEVEL', 'info'),
    filePath: getEnvVar('LOG_PATH', './logs'),
  },
};

