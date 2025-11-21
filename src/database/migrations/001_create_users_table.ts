import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions = {};

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    email: {
      type: 'varchar(255)',
      notNull: true,
      unique: true,
    },
    password_hash: {
      type: 'varchar(255)',
      notNull: true,
    },
    role: {
      type: 'varchar(50)',
      notNull: true,
      default: 'patient',
    },
    is_email_verified: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    is_mfa_enabled: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    mfa_secret: {
      type: 'varchar(255)',
    },
    is_active: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
    last_login_at: {
      type: 'timestamp',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('users', 'email');
  pgm.createIndex('users', 'role');
  pgm.createIndex('users', 'is_active');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('users');
}

