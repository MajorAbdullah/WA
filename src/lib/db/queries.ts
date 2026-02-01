import getDatabase from './index';
import type {
  Message,
  User,
  Broadcast,
  CommandLog,
  Setting,
  CreateMessageInput,
  CreateUserInput,
  CreateBroadcastInput,
  CreateCommandLogInput,
  MessageFilters,
  UserFilters,
  PaginationOptions,
  PaginatedResult,
  BroadcastStatus,
} from '@/types/database';

// ============================================================================
// MESSAGE QUERIES
// ============================================================================

/**
 * Create a new message
 */
export function createMessage(input: CreateMessageInput): Message {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO messages (id, jid, from_me, content, type, timestamp, status, media_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    input.id,
    input.jid,
    input.from_me ? 1 : 0,
    input.content ?? null,
    input.type,
    input.timestamp,
    input.status ?? null,
    input.media_url ?? null
  );

  return getMessageById(input.id)!;
}

/**
 * Get a message by ID
 */
export function getMessageById(id: string): Message | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM messages WHERE id = ?').get(id) as
    | (Omit<Message, 'from_me'> & { from_me: number })
    | undefined;

  if (!row) return null;

  return {
    ...row,
    from_me: Boolean(row.from_me),
  };
}

/**
 * Get messages with filtering and pagination
 */
export function getMessages(
  filters: MessageFilters = {},
  pagination: PaginationOptions = {}
): PaginatedResult<Message> {
  const db = getDatabase();
  const { page = 1, limit = 50 } = pagination;
  const offset = (page - 1) * limit;

  let whereClause = '1=1';
  const params: (string | number)[] = [];

  if (filters.jid) {
    whereClause += ' AND jid = ?';
    params.push(filters.jid);
  }

  if (filters.from_me !== undefined) {
    whereClause += ' AND from_me = ?';
    params.push(filters.from_me ? 1 : 0);
  }

  if (filters.type) {
    whereClause += ' AND type = ?';
    params.push(filters.type);
  }

  if (filters.startDate) {
    whereClause += ' AND timestamp >= ?';
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    whereClause += ' AND timestamp <= ?';
    params.push(filters.endDate);
  }

  if (filters.search) {
    whereClause += ' AND content LIKE ?';
    params.push(`%${filters.search}%`);
  }

  // Get total count
  const countRow = db
    .prepare(`SELECT COUNT(*) as count FROM messages WHERE ${whereClause}`)
    .get(...params) as { count: number };
  const total = countRow.count;

  // Get paginated results
  const rows = db
    .prepare(
      `SELECT * FROM messages WHERE ${whereClause} ORDER BY timestamp DESC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as Array<
    Omit<Message, 'from_me'> & { from_me: number }
  >;

  const data = rows.map((row) => ({
    ...row,
    from_me: Boolean(row.from_me),
  }));

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get messages for a specific JID (conversation)
 */
export function getMessagesByJid(
  jid: string,
  pagination: PaginationOptions = {}
): PaginatedResult<Message> {
  return getMessages({ jid }, pagination);
}

/**
 * Update message status
 */
export function updateMessageStatus(id: string, status: string): boolean {
  const db = getDatabase();
  const result = db
    .prepare('UPDATE messages SET status = ? WHERE id = ?')
    .run(status, id);
  return result.changes > 0;
}

/**
 * Delete a message
 */
export function deleteMessage(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM messages WHERE id = ?').run(id);
  return result.changes > 0;
}

/**
 * Get message count by date range
 */
export function getMessageCountByDateRange(
  startDate: number,
  endDate: number
): { incoming: number; outgoing: number } {
  const db = getDatabase();

  const incoming = db
    .prepare(
      'SELECT COUNT(*) as count FROM messages WHERE timestamp >= ? AND timestamp <= ? AND from_me = 0'
    )
    .get(startDate, endDate) as { count: number };

  const outgoing = db
    .prepare(
      'SELECT COUNT(*) as count FROM messages WHERE timestamp >= ? AND timestamp <= ? AND from_me = 1'
    )
    .get(startDate, endDate) as { count: number };

  return {
    incoming: incoming.count,
    outgoing: outgoing.count,
  };
}

/**
 * Get unique conversations (distinct JIDs with latest message)
 */
export function getConversations(
  pagination: PaginationOptions = {}
): PaginatedResult<{
  jid: string;
  lastMessage: Message;
  messageCount: number;
}> {
  const db = getDatabase();
  const { page = 1, limit = 50 } = pagination;
  const offset = (page - 1) * limit;

  // Get total count of unique conversations
  const countRow = db
    .prepare('SELECT COUNT(DISTINCT jid) as count FROM messages')
    .get() as { count: number };
  const total = countRow.count;

  // Get conversations with latest message
  const rows = db
    .prepare(
      `
    SELECT m.*,
           (SELECT COUNT(*) FROM messages WHERE jid = m.jid) as message_count
    FROM messages m
    INNER JOIN (
      SELECT jid, MAX(timestamp) as max_timestamp
      FROM messages
      GROUP BY jid
    ) latest ON m.jid = latest.jid AND m.timestamp = latest.max_timestamp
    ORDER BY m.timestamp DESC
    LIMIT ? OFFSET ?
  `
    )
    .all(limit, offset) as Array<
    Omit<Message, 'from_me'> & { from_me: number; message_count: number }
  >;

  const data = rows.map((row) => ({
    jid: row.jid,
    lastMessage: {
      ...row,
      from_me: Boolean(row.from_me),
    } as Message,
    messageCount: row.message_count,
  }));

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ============================================================================
// USER QUERIES
// ============================================================================

/**
 * Create or update a user
 */
export function upsertUser(input: CreateUserInput): User {
  const db = getDatabase();

  db.prepare(
    `
    INSERT INTO users (jid, name, phone, first_seen, last_seen)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(jid) DO UPDATE SET
      name = COALESCE(excluded.name, users.name),
      phone = COALESCE(excluded.phone, users.phone),
      last_seen = excluded.last_seen
  `
  ).run(
    input.jid,
    input.name ?? null,
    input.phone ?? null,
    input.first_seen,
    input.last_seen
  );

  return getUserByJid(input.jid)!;
}

/**
 * Get a user by JID
 */
export function getUserByJid(jid: string): User | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM users WHERE jid = ?').get(jid) as
    | (Omit<User, 'is_banned'> & { is_banned: number })
    | undefined;

  if (!row) return null;

  return {
    ...row,
    is_banned: Boolean(row.is_banned),
  };
}

/**
 * Get all users with filtering and pagination
 */
export function getUsers(
  filters: UserFilters = {},
  pagination: PaginationOptions = {}
): PaginatedResult<User> {
  const db = getDatabase();
  const { page = 1, limit = 20 } = pagination;
  const offset = (page - 1) * limit;

  let whereClause = '1=1';
  const params: (string | number)[] = [];

  if (filters.search) {
    whereClause += ' AND (name LIKE ? OR phone LIKE ? OR jid LIKE ?)';
    const searchPattern = `%${filters.search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  if (filters.is_banned !== undefined) {
    whereClause += ' AND is_banned = ?';
    params.push(filters.is_banned ? 1 : 0);
  }

  // Get total count
  const countRow = db
    .prepare(`SELECT COUNT(*) as count FROM users WHERE ${whereClause}`)
    .get(...params) as { count: number };
  const total = countRow.count;

  // Get paginated results
  const rows = db
    .prepare(
      `SELECT * FROM users WHERE ${whereClause} ORDER BY last_seen DESC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as Array<
    Omit<User, 'is_banned'> & { is_banned: number }
  >;

  const data = rows.map((row) => ({
    ...row,
    is_banned: Boolean(row.is_banned),
  }));

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Ban a user
 */
export function banUser(jid: string, reason?: string): boolean {
  const db = getDatabase();
  const result = db
    .prepare('UPDATE users SET is_banned = 1, ban_reason = ? WHERE jid = ?')
    .run(reason ?? null, jid);
  return result.changes > 0;
}

/**
 * Unban a user
 */
export function unbanUser(jid: string): boolean {
  const db = getDatabase();
  const result = db
    .prepare('UPDATE users SET is_banned = 0, ban_reason = NULL WHERE jid = ?')
    .run(jid);
  return result.changes > 0;
}

/**
 * Increment user message count
 */
export function incrementUserMessageCount(jid: string): void {
  const db = getDatabase();
  db.prepare(
    'UPDATE users SET message_count = message_count + 1 WHERE jid = ?'
  ).run(jid);
}

/**
 * Increment user command count
 */
export function incrementUserCommandCount(jid: string): void {
  const db = getDatabase();
  db.prepare(
    'UPDATE users SET command_count = command_count + 1 WHERE jid = ?'
  ).run(jid);
}

/**
 * Get user count
 */
export function getUserCount(banned?: boolean): number {
  const db = getDatabase();

  if (banned !== undefined) {
    const row = db
      .prepare('SELECT COUNT(*) as count FROM users WHERE is_banned = ?')
      .get(banned ? 1 : 0) as { count: number };
    return row.count;
  }

  const row = db.prepare('SELECT COUNT(*) as count FROM users').get() as {
    count: number;
  };
  return row.count;
}

// ============================================================================
// BROADCAST QUERIES
// ============================================================================

/**
 * Create a new broadcast
 */
export function createBroadcast(input: CreateBroadcastInput): Broadcast {
  const db = getDatabase();

  db.prepare(
    `
    INSERT INTO broadcasts (id, message, recipients, scheduled_at, status)
    VALUES (?, ?, ?, ?, 'pending')
  `
  ).run(
    input.id,
    input.message,
    JSON.stringify(input.recipients),
    input.scheduled_at ?? null
  );

  return getBroadcastById(input.id)!;
}

/**
 * Get a broadcast by ID
 */
export function getBroadcastById(id: string): Broadcast | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM broadcasts WHERE id = ?').get(id) as
    | Broadcast
    | undefined;
  return row ?? null;
}

/**
 * Get all broadcasts with pagination
 */
export function getBroadcasts(
  pagination: PaginationOptions = {}
): PaginatedResult<Broadcast> {
  const db = getDatabase();
  const { page = 1, limit = 20 } = pagination;
  const offset = (page - 1) * limit;

  const countRow = db
    .prepare('SELECT COUNT(*) as count FROM broadcasts')
    .get() as { count: number };
  const total = countRow.count;

  const data = db
    .prepare(
      'SELECT * FROM broadcasts ORDER BY created_at DESC LIMIT ? OFFSET ?'
    )
    .all(limit, offset) as Broadcast[];

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Update broadcast status
 */
export function updateBroadcastStatus(
  id: string,
  status: BroadcastStatus
): boolean {
  const db = getDatabase();
  const result = db
    .prepare('UPDATE broadcasts SET status = ? WHERE id = ?')
    .run(status, id);
  return result.changes > 0;
}

/**
 * Update broadcast progress
 */
export function updateBroadcastProgress(
  id: string,
  sentCount: number,
  failedCount: number
): boolean {
  const db = getDatabase();
  const result = db
    .prepare(
      'UPDATE broadcasts SET sent_count = ?, failed_count = ? WHERE id = ?'
    )
    .run(sentCount, failedCount, id);
  return result.changes > 0;
}

/**
 * Get pending broadcasts that should be sent
 */
export function getPendingBroadcasts(): Broadcast[] {
  const db = getDatabase();
  const now = Date.now();

  return db
    .prepare(
      `
    SELECT * FROM broadcasts
    WHERE status = 'pending'
    AND (scheduled_at IS NULL OR scheduled_at <= ?)
    ORDER BY created_at ASC
  `
    )
    .all(now) as Broadcast[];
}

/**
 * Cancel a broadcast
 */
export function cancelBroadcast(id: string): boolean {
  const db = getDatabase();
  const result = db
    .prepare(
      "UPDATE broadcasts SET status = 'cancelled' WHERE id = ? AND status IN ('pending', 'in_progress')"
    )
    .run(id);
  return result.changes > 0;
}

// ============================================================================
// COMMAND LOG QUERIES
// ============================================================================

/**
 * Create a command log entry
 */
export function createCommandLog(input: CreateCommandLogInput): CommandLog {
  const db = getDatabase();

  const result = db
    .prepare(
      `
    INSERT INTO command_logs (command, user_jid, args, success, response_time)
    VALUES (?, ?, ?, ?, ?)
  `
    )
    .run(
      input.command,
      input.user_jid,
      input.args ?? null,
      input.success ? 1 : 0,
      input.response_time ?? null
    );

  return getCommandLogById(Number(result.lastInsertRowid))!;
}

/**
 * Get a command log by ID
 */
export function getCommandLogById(id: number): CommandLog | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM command_logs WHERE id = ?').get(id) as
    | (Omit<CommandLog, 'success'> & { success: number })
    | undefined;

  if (!row) return null;

  return {
    ...row,
    success: Boolean(row.success),
  };
}

/**
 * Get command logs with pagination
 */
export function getCommandLogs(
  pagination: PaginationOptions = {}
): PaginatedResult<CommandLog> {
  const db = getDatabase();
  const { page = 1, limit = 50 } = pagination;
  const offset = (page - 1) * limit;

  const countRow = db
    .prepare('SELECT COUNT(*) as count FROM command_logs')
    .get() as { count: number };
  const total = countRow.count;

  const rows = db
    .prepare(
      'SELECT * FROM command_logs ORDER BY created_at DESC LIMIT ? OFFSET ?'
    )
    .all(limit, offset) as Array<
    Omit<CommandLog, 'success'> & { success: number }
  >;

  const data = rows.map((row) => ({
    ...row,
    success: Boolean(row.success),
  }));

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get command logs for a specific user
 */
export function getCommandLogsByUser(
  userJid: string,
  pagination: PaginationOptions = {}
): PaginatedResult<CommandLog> {
  const db = getDatabase();
  const { page = 1, limit = 50 } = pagination;
  const offset = (page - 1) * limit;

  const countRow = db
    .prepare('SELECT COUNT(*) as count FROM command_logs WHERE user_jid = ?')
    .get(userJid) as { count: number };
  const total = countRow.count;

  const rows = db
    .prepare(
      'SELECT * FROM command_logs WHERE user_jid = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    )
    .all(userJid, limit, offset) as Array<
    Omit<CommandLog, 'success'> & { success: number }
  >;

  const data = rows.map((row) => ({
    ...row,
    success: Boolean(row.success),
  }));

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get command usage statistics
 */
export function getCommandStats(): Array<{
  command: string;
  count: number;
  successRate: number;
}> {
  const db = getDatabase();

  return db
    .prepare(
      `
    SELECT
      command,
      COUNT(*) as count,
      ROUND(AVG(success) * 100, 2) as successRate
    FROM command_logs
    GROUP BY command
    ORDER BY count DESC
  `
    )
    .all() as Array<{
    command: string;
    count: number;
    successRate: number;
  }>;
}

// ============================================================================
// SETTINGS QUERIES
// ============================================================================

/**
 * Get a setting value
 */
export function getSetting(key: string): string | null {
  const db = getDatabase();
  const row = db
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

/**
 * Set a setting value
 */
export function setSetting(key: string, value: string): void {
  const db = getDatabase();
  db.prepare(
    `
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `
  ).run(key, value);
}

/**
 * Delete a setting
 */
export function deleteSetting(key: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM settings WHERE key = ?').run(key);
  return result.changes > 0;
}

/**
 * Get all settings
 */
export function getAllSettings(): Setting[] {
  const db = getDatabase();
  return db
    .prepare('SELECT * FROM settings ORDER BY key')
    .all() as Setting[];
}

// ============================================================================
// STATISTICS QUERIES
// ============================================================================

/**
 * Get dashboard statistics
 */
export function getDashboardStats(): {
  totalMessages: number;
  totalUsers: number;
  totalCommands: number;
  activeToday: number;
} {
  const db = getDatabase();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartTs = todayStart.getTime();

  const messages = db
    .prepare('SELECT COUNT(*) as count FROM messages')
    .get() as { count: number };
  const users = db.prepare('SELECT COUNT(*) as count FROM users').get() as {
    count: number;
  };
  const commands = db
    .prepare('SELECT COUNT(*) as count FROM command_logs')
    .get() as { count: number };
  const activeToday = db
    .prepare('SELECT COUNT(*) as count FROM users WHERE last_seen >= ?')
    .get(todayStartTs) as { count: number };

  return {
    totalMessages: messages.count,
    totalUsers: users.count,
    totalCommands: commands.count,
    activeToday: activeToday.count,
  };
}

/**
 * Get message volume data for charts
 */
export function getMessageVolumeByDay(
  days: number = 7
): Array<{ date: string; incoming: number; outgoing: number }> {
  const db = getDatabase();
  const startDate = Date.now() - days * 24 * 60 * 60 * 1000;

  const rows = db
    .prepare(
      `
    SELECT
      date(datetime(timestamp / 1000, 'unixepoch')) as date,
      SUM(CASE WHEN from_me = 0 THEN 1 ELSE 0 END) as incoming,
      SUM(CASE WHEN from_me = 1 THEN 1 ELSE 0 END) as outgoing
    FROM messages
    WHERE timestamp >= ?
    GROUP BY date(datetime(timestamp / 1000, 'unixepoch'))
    ORDER BY date ASC
  `
    )
    .all(startDate) as Array<{ date: string; incoming: number; outgoing: number }>;

  return rows;
}
