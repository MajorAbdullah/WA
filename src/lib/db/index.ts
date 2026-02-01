import Database from 'better-sqlite3';
import path from 'path';
import { initializeSchema } from './schema';

// Database path from environment or default
const DB_PATH = process.env.DATABASE_PATH || './data/dashboard.db';

// Singleton database instance
let db: Database.Database | null = null;

/**
 * Get the database instance (singleton pattern)
 * Creates and initializes the database if it doesn't exist
 */
export function getDatabase(): Database.Database {
  if (!db) {
    // Ensure the directory exists
    const dbDir = path.dirname(DB_PATH);
    const fs = require('fs');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Create database connection
    db = new Database(DB_PATH);

    // Enable WAL mode for better concurrent access
    db.pragma('journal_mode = WAL');

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Initialize schema
    initializeSchema(db);
  }

  return db;
}

/**
 * Close the database connection
 * Should be called when the application shuts down
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Reset the database (for testing purposes)
 * WARNING: This will delete all data
 */
export function resetDatabase(): void {
  const database = getDatabase();

  // Drop all tables
  database.exec(`
    DROP TABLE IF EXISTS command_logs;
    DROP TABLE IF EXISTS messages;
    DROP TABLE IF EXISTS broadcasts;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS settings;
  `);

  // Re-initialize schema
  initializeSchema(database);
}

// Export the database getter as default
export default getDatabase;
