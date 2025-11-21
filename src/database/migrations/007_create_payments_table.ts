import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions = {};

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('payments', {
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
      unique: true,
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
    amount: {
      type: 'decimal(10,2)',
      notNull: true,
    },
    currency: {
      type: 'varchar(3)',
      notNull: true,
      default: 'USD',
    },
    status: {
      type: 'varchar(50)',
      notNull: true,
      default: 'pending',
    },
    payment_method: {
      type: 'varchar(50)',
    },
    transaction_id: {
      type: 'varchar(255)',
    },
    paid_at: {
      type: 'timestamp',
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

  pgm.createIndex('payments', 'consultation_id');
  pgm.createIndex('payments', 'patient_id');
  pgm.createIndex('payments', 'doctor_id');
  pgm.createIndex('payments', 'status');
  pgm.createIndex('payments', 'transaction_id');
  pgm.createIndex('payments', 'paid_at');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('payments');
}

