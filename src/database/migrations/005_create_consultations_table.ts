import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions = {};

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('consultations', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    patient_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    doctor_id: {
      type: 'uuid',
      notNull: true,
      references: 'doctors(id)',
      onDelete: 'CASCADE',
    },
    slot_id: {
      type: 'uuid',
      notNull: true,
      references: 'availability_slots(id)',
      onDelete: 'SET NULL',
    },
    status: {
      type: 'varchar(50)',
      notNull: true,
      default: 'scheduled',
    },
    scheduled_at: {
      type: 'timestamp',
      notNull: true,
    },
    started_at: {
      type: 'timestamp',
    },
    ended_at: {
      type: 'timestamp',
    },
    symptoms: {
      type: 'text',
    },
    diagnosis: {
      type: 'text',
    },
    notes: {
      type: 'text',
    },
    rating: {
      type: 'integer',
      check: 'rating >= 1 AND rating <= 5',
    },
    feedback: {
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

  pgm.createIndex('consultations', 'patient_id');
  pgm.createIndex('consultations', 'doctor_id');
  pgm.createIndex('consultations', 'slot_id');
  pgm.createIndex('consultations', 'status');
  pgm.createIndex('consultations', 'scheduled_at');
  pgm.createIndex('consultations', ['patient_id', 'status']);
  pgm.createIndex('consultations', ['doctor_id', 'status']);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('consultations');
}

