import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions = {};

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Function to update updated_at timestamp
  pgm.createFunction(
    'update_updated_at_column',
    [],
    {
      returns: 'trigger',
      language: 'plpgsql',
      replace: true,
    },
    `
    BEGIN
      NEW.updated_at = current_timestamp;
      RETURN NEW;
    END;
    `
  );

  // Apply trigger to all tables with updated_at
  const tables = [
    'users',
    'profiles',
    'doctors',
    'availability_slots',
    'consultations',
    'prescriptions',
    'payments',
  ];

  tables.forEach((table) => {
    pgm.createTrigger(table, 'update_updated_at', {
      when: 'BEFORE',
      operation: 'UPDATE',
      function: 'update_updated_at_column',
      level: 'ROW',
    });
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  const tables = [
    'users',
    'profiles',
    'doctors',
    'availability_slots',
    'consultations',
    'prescriptions',
    'payments',
  ];

  tables.forEach((table) => {
    pgm.dropTrigger(table, 'update_updated_at');
  });

  pgm.dropFunction('update_updated_at_column', []);
}

