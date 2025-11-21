import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions = {};

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('availability_slots', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    doctor_id: {
      type: 'uuid',
      notNull: true,
      references: 'doctors(id)',
      onDelete: 'CASCADE',
    },
    start_time: {
      type: 'timestamp',
      notNull: true,
    },
    end_time: {
      type: 'timestamp',
      notNull: true,
    },
    is_booked: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    consultation_id: {
      type: 'uuid',
      references: 'consultations(id)',
      onDelete: 'SET NULL',
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

  pgm.createIndex('availability_slots', 'doctor_id');
  pgm.createIndex('availability_slots', 'start_time');
  pgm.createIndex('availability_slots', 'is_booked');
  pgm.createIndex('availability_slots', ['doctor_id', 'start_time', 'end_time']);
  
  // Prevent overlapping slots for the same doctor
  pgm.createIndex('availability_slots', ['doctor_id', 'start_time', 'end_time'], {
    unique: true,
    where: 'is_booked = false',
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('availability_slots');
}

