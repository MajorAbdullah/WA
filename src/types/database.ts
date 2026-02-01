// Database entity types for the WA Bot Dashboard

export interface Message {
  id: string;
  jid: string;
  from_me: boolean;
  content: string | null;
  type: string;
  timestamp: number;
  status: string | null;
  media_url: string | null;
  created_at: string;
}

export interface User {
  jid: string;
  name: string | null;
  phone: string | null;
  first_seen: number;
  last_seen: number;
  message_count: number;
  command_count: number;
  is_banned: boolean;
  ban_reason: string | null;
  created_at: string;
}

export interface Broadcast {
  id: string;
  message: string;
  recipients: string; // JSON array stored as string
  scheduled_at: number | null;
  status: BroadcastStatus;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

export type BroadcastStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface CommandLog {
  id: number;
  command: string;
  user_jid: string;
  args: string | null;
  success: boolean;
  response_time: number | null;
  created_at: string;
}

export interface Setting {
  key: string;
  value: string;
  updated_at: string;
}

export interface Command {
  name: string;
  description: string;
  aliases: string; // JSON array stored as string
  category: CommandCategory;
  cooldown: number;
  owner_only: boolean;
  enabled: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export type CommandCategory = 'general' | 'admin' | 'owner' | 'utility' | 'fun';

// Input types for creating new records
export interface CreateMessageInput {
  id: string;
  jid: string;
  from_me: boolean;
  content?: string | null;
  type: string;
  timestamp: number;
  status?: string | null;
  media_url?: string | null;
}

export interface CreateUserInput {
  jid: string;
  name?: string | null;
  phone?: string | null;
  first_seen: number;
  last_seen: number;
}

export interface CreateBroadcastInput {
  id: string;
  message: string;
  recipients: string[];
  scheduled_at?: number | null;
}

export interface CreateCommandLogInput {
  command: string;
  user_jid: string;
  args?: string | null;
  success: boolean;
  response_time?: number | null;
}

export interface CreateCommandInput {
  name: string;
  description: string;
  aliases?: string[];
  category?: CommandCategory;
  cooldown?: number;
  owner_only?: boolean;
  enabled?: boolean;
}

export interface UpdateCommandInput {
  enabled?: boolean;
  cooldown?: number;
}

// Query filter types
export interface MessageFilters {
  jid?: string;
  from_me?: boolean;
  type?: string;
  startDate?: number;
  endDate?: number;
  search?: string;
}

export interface UserFilters {
  search?: string;
  is_banned?: boolean;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
