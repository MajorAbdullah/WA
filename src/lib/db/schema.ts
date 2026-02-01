import type Database from 'better-sqlite3';

/**
 * Initialize all database tables and indexes
 */
export function initializeSchema(db: Database.Database): void {
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      jid TEXT PRIMARY KEY,
      name TEXT,
      phone TEXT,
      first_seen INTEGER NOT NULL,
      last_seen INTEGER NOT NULL,
      message_count INTEGER DEFAULT 0,
      command_count INTEGER DEFAULT 0,
      is_banned INTEGER DEFAULT 0,
      ban_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      jid TEXT NOT NULL,
      from_me INTEGER NOT NULL,
      content TEXT,
      type TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      status TEXT,
      media_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (jid) REFERENCES users(jid) ON DELETE CASCADE
    )
  `);

  // Create broadcasts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS broadcasts (
      id TEXT PRIMARY KEY,
      message TEXT NOT NULL,
      recipients TEXT NOT NULL,
      scheduled_at INTEGER,
      status TEXT NOT NULL DEFAULT 'pending',
      sent_count INTEGER DEFAULT 0,
      failed_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create command_logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS command_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      command TEXT NOT NULL,
      user_jid TEXT NOT NULL,
      args TEXT,
      success INTEGER NOT NULL,
      response_time INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_jid) REFERENCES users(jid) ON DELETE CASCADE
    )
  `);

  // Create settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for frequently queried columns
  createIndexes(db);
}

/**
 * Create database indexes for better query performance
 */
function createIndexes(db: Database.Database): void {
  // Messages indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_messages_jid ON messages(jid);
    CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);
    CREATE INDEX IF NOT EXISTS idx_messages_jid_timestamp ON messages(jid, timestamp DESC);
  `);

  // Users indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen DESC);
    CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned);
    CREATE INDEX IF NOT EXISTS idx_users_message_count ON users(message_count DESC);
  `);

  // Broadcasts indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_broadcasts_status ON broadcasts(status);
    CREATE INDEX IF NOT EXISTS idx_broadcasts_scheduled_at ON broadcasts(scheduled_at);
    CREATE INDEX IF NOT EXISTS idx_broadcasts_created_at ON broadcasts(created_at DESC);
  `);

  // Command logs indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_command_logs_command ON command_logs(command);
    CREATE INDEX IF NOT EXISTS idx_command_logs_user_jid ON command_logs(user_jid);
    CREATE INDEX IF NOT EXISTS idx_command_logs_created_at ON command_logs(created_at DESC);
  `);
}

/**
 * Get the current schema version
 */
export function getSchemaVersion(db: Database.Database): number {
  const result = db.prepare(
    "SELECT value FROM settings WHERE key = 'schema_version'"
  ).get() as { value: string } | undefined;

  return result ? parseInt(result.value, 10) : 0;
}

/**
 * Set the schema version
 */
export function setSchemaVersion(db: Database.Database, version: number): void {
  db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES ('schema_version', ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `).run(version.toString());
}
