import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions = {};

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('refresh_tokens', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    token: {
      type: 'text',
      notNull: true,
      unique: true,
    },
    expires_at: {
      type: 'timestamp',
      notNull: true,
    },
    is_revoked: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('refresh_tokens', 'user_id');
  pgm.createIndex('refresh_tokens', 'token');
  pgm.createIndex('refresh_tokens', 'expires_at');
  pgm.createIndex('refresh_tokens', 'is_revoked');
  
  // Auto-cleanup expired tokens (runs periodically via cron job)
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('refresh_tokens');
}

