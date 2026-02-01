#!/usr/bin/env npx tsx

/**
 * Database initialization script
 * Run with: npm run db:init
 */

import { getDatabase, closeDatabase } from '../src/lib/db';
import { setSetting } from '../src/lib/db/queries';

async function main() {
  console.log('Initializing database...');

  try {
    // This will create the database and all tables
    const db = getDatabase();

    console.log('Database connection established');
    console.log('Tables created successfully');

    // Set initial settings
    setSetting('schema_version', '1');
    setSetting('bot_name', 'WhatsAppBot');
    setSetting('command_prefix', '!');
    setSetting('enable_groups', 'true');
    setSetting('auto_read', 'false');
    setSetting('typing_indicator', 'true');
    setSetting('rate_limit_user', '10');
    setSetting('rate_limit_group', '20');
    setSetting('rate_limit_global', '100');
    setSetting('response_delay_min', '500');
    setSetting('response_delay_max', '2000');

    console.log('Default settings initialized');

    // Close the database
    closeDatabase();

    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

main();
