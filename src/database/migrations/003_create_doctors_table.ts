import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions = {};

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('doctors', {
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
      unique: true,
    },
    license_number: {
      type: 'varchar(100)',
      notNull: true,
      unique: true,
    },
    specialization: {
      type: 'varchar(100)',
      notNull: true,
    },
    years_of_experience: {
      type: 'integer',
      notNull: true,
      default: 0,
    },
    consultation_fee: {
      type: 'decimal(10,2)',
      notNull: true,
    },
    bio: {
      type: 'text',
    },
    qualifications: {
      type: 'text[]',
    },
    languages: {
      type: 'text[]',
    },
    is_available: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
    rating: {
      type: 'decimal(3,2)',
    },
    total_consultations: {
      type: 'integer',
      default: 0,
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

  pgm.createIndex('doctors', 'user_id');
  pgm.createIndex('doctors', 'specialization');
  pgm.createIndex('doctors', 'is_available');
  pgm.createIndex('doctors', 'rating');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('doctors');
}

