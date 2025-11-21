import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions = {};

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('prescriptions', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    consultation_id: {
      type: 'uuid',
      notNull: true,
      references: 'consultations(id)',
      onDelete: 'CASCADE',
    },
    doctor_id: {
      type: 'uuid',
      notNull: true,
      references: 'doctors(id)',
      onDelete: 'CASCADE',
    },
    patient_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    medications: {
      type: 'jsonb',
      notNull: true,
    },
    instructions: {
      type: 'text',
    },
    follow_up_date: {
      type: 'date',
    },
    is_active: {
      type: 'boolean',
      notNull: true,
      default: true,
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

  pgm.createIndex('prescriptions', 'consultation_id');
  pgm.createIndex('prescriptions', 'doctor_id');
  pgm.createIndex('prescriptions', 'patient_id');
  pgm.createIndex('prescriptions', 'is_active');
  pgm.createIndex('prescriptions', 'follow_up_date');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('prescriptions');
}

