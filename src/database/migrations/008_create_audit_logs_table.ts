import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions = {};

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('audit_logs', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      references: 'users(id)',
      onDelete: 'SET NULL',
    },
    action: {
      type: 'varchar(50)',
      notNull: true,
    },
    resource_type: {
      type: 'varchar(100)',
      notNull: true,
    },
    resource_id: {
      type: 'uuid',
    },
    details: {
      type: 'jsonb',
    },
    ip_address: {
      type: 'varchar(45)',
    },
    user_agent: {
      type: 'text',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('audit_logs', 'user_id');
  pgm.createIndex('audit_logs', 'action');
  pgm.createIndex('audit_logs', 'resource_type');
  pgm.createIndex('audit_logs', 'resource_id');
  pgm.createIndex('audit_logs', 'created_at');
  
  // Composite index for common queries
  pgm.createIndex('audit_logs', ['resource_type', 'resource_id', 'created_at']);
  
  // Partitioning by month for better performance (optional, can be added later)
  // For now, we'll rely on indexing and archiving old logs
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('audit_logs');
}

