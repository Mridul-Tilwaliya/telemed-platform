import { Pool, PoolClient } from 'pg';
import { config } from '../config/env';
import { retryDatabaseOperation } from '../utils/retry';

class Database {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      ssl: config.db.ssl,
      max: config.db.poolSize,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  async query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
    const start = Date.now();
    try {
      const res = await retryDatabaseOperation(async () => {
        return await this.pool.query(text, params);
      });
      const duration = Date.now() - start;
      
      // Log slow queries in development
      if (config.nodeEnv === 'development' && duration > 1000) {
        console.warn('Slow query detected', { text, duration, rows: res.rowCount });
      }
      
      return res.rows as T[];
    } catch (error) {
      console.error('Database query error', { text, error });
      throw error;
    }
  }

  async queryOne<T = unknown>(text: string, params?: unknown[]): Promise<T | null> {
    const rows = await this.query<T>(text, params);
    return rows[0] || null;
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  getPool(): Pool {
    return this.pool;
  }
}

export const db = new Database();

