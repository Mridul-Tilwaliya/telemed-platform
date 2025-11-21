import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions = {};

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('profiles', {
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
    first_name: {
      type: 'varchar(100)',
      notNull: true,
    },
    last_name: {
      type: 'varchar(100)',
      notNull: true,
    },
    phone: {
      type: 'varchar(20)',
    },
    date_of_birth: {
      type: 'date',
    },
    gender: {
      type: 'varchar(20)',
    },
    address: {
      type: 'text',
    },
    city: {
      type: 'varchar(100)',
    },
    state: {
      type: 'varchar(100)',
    },
    zip_code: {
      type: 'varchar(20)',
    },
    country: {
      type: 'varchar(100)',
    },
    avatar_url: {
      type: 'text',
    },
    metadata: {
      type: 'jsonb',
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

  pgm.createIndex('profiles', 'user_id', { unique: true });
  pgm.createIndex('profiles', 'phone');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('profiles');
}

