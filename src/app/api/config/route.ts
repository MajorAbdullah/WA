/**
 * Config API Routes
 * GET: Retrieve all configuration settings
 * PATCH: Update configuration settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSetting, setSetting, getAllSettings } from '@/lib/db/queries';

// =============================================================================
// Configuration Keys and Defaults
// =============================================================================

export const CONFIG_KEYS = {
  // Bot Configuration
  BOT_NAME: 'bot.name',
  BOT_PREFIX: 'bot.prefix',
  BOT_OWNER: 'bot.owner',
  BOT_ENABLE_GROUPS: 'bot.enableGroups',
  BOT_AUTO_READ: 'bot.autoRead',
  BOT_SHOW_TYPING: 'bot.showTyping',

  // Rate Limiting
  RATE_LIMIT_USER: 'rateLimit.perUser',
  RATE_LIMIT_GROUP: 'rateLimit.perGroup',
  RATE_LIMIT_GLOBAL: 'rateLimit.global',
  RATE_LIMIT_BLOCK_DURATION: 'rateLimit.blockDuration',

  // Response Settings
  RESPONSE_MIN_DELAY: 'response.minDelay',
  RESPONSE_MAX_DELAY: 'response.maxDelay',
  RESPONSE_TYPING_SPEED: 'response.typingSpeed',
} as const;

export const DEFAULT_CONFIG: Record<string, string> = {
  [CONFIG_KEYS.BOT_NAME]: 'WhatsApp Bot',
  [CONFIG_KEYS.BOT_PREFIX]: '!',
  [CONFIG_KEYS.BOT_OWNER]: '',
  [CONFIG_KEYS.BOT_ENABLE_GROUPS]: 'true',
  [CONFIG_KEYS.BOT_AUTO_READ]: 'false',
  [CONFIG_KEYS.BOT_SHOW_TYPING]: 'true',

  [CONFIG_KEYS.RATE_LIMIT_USER]: '30',
  [CONFIG_KEYS.RATE_LIMIT_GROUP]: '60',
  [CONFIG_KEYS.RATE_LIMIT_GLOBAL]: '300',
  [CONFIG_KEYS.RATE_LIMIT_BLOCK_DURATION]: '60',

  [CONFIG_KEYS.RESPONSE_MIN_DELAY]: '500',
  [CONFIG_KEYS.RESPONSE_MAX_DELAY]: '2000',
  [CONFIG_KEYS.RESPONSE_TYPING_SPEED]: '50',
};

// =============================================================================
// Type Definitions
// =============================================================================

export interface BotConfig {
  name: string;
  prefix: string;
  owner: string;
  enableGroups: boolean;
  autoRead: boolean;
  showTyping: boolean;
}

export interface RateLimitConfig {
  perUser: number;
  perGroup: number;
  global: number;
  blockDuration: number;
}

export interface ResponseConfig {
  minDelay: number;
  maxDelay: number;
  typingSpeed: number;
}

export interface FullConfig {
  bot: BotConfig;
  rateLimit: RateLimitConfig;
  response: ResponseConfig;
}

// =============================================================================
// Helper Functions
// =============================================================================

function getConfigValue(key: string): string {
  return getSetting(key) ?? DEFAULT_CONFIG[key] ?? '';
}

function parseBoolean(value: string): boolean {
  return value === 'true' || value === '1';
}

function parseNumber(value: string, defaultValue: number): number {
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
}

function buildFullConfig(): FullConfig {
  return {
    bot: {
      name: getConfigValue(CONFIG_KEYS.BOT_NAME),
      prefix: getConfigValue(CONFIG_KEYS.BOT_PREFIX),
      owner: getConfigValue(CONFIG_KEYS.BOT_OWNER),
      enableGroups: parseBoolean(getConfigValue(CONFIG_KEYS.BOT_ENABLE_GROUPS)),
      autoRead: parseBoolean(getConfigValue(CONFIG_KEYS.BOT_AUTO_READ)),
      showTyping: parseBoolean(getConfigValue(CONFIG_KEYS.BOT_SHOW_TYPING)),
    },
    rateLimit: {
      perUser: parseNumber(getConfigValue(CONFIG_KEYS.RATE_LIMIT_USER), 30),
      perGroup: parseNumber(getConfigValue(CONFIG_KEYS.RATE_LIMIT_GROUP), 60),
      global: parseNumber(getConfigValue(CONFIG_KEYS.RATE_LIMIT_GLOBAL), 300),
      blockDuration: parseNumber(getConfigValue(CONFIG_KEYS.RATE_LIMIT_BLOCK_DURATION), 60),
    },
    response: {
      minDelay: parseNumber(getConfigValue(CONFIG_KEYS.RESPONSE_MIN_DELAY), 500),
      maxDelay: parseNumber(getConfigValue(CONFIG_KEYS.RESPONSE_MAX_DELAY), 2000),
      typingSpeed: parseNumber(getConfigValue(CONFIG_KEYS.RESPONSE_TYPING_SPEED), 50),
    },
  };
}

// =============================================================================
// GET - Retrieve all configuration
// =============================================================================

export async function GET() {
  try {
    const config = buildFullConfig();
    const rawSettings = getAllSettings();

    return NextResponse.json({
      success: true,
      config,
      raw: rawSettings,
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PATCH - Update configuration
// =============================================================================

interface ConfigUpdate {
  bot?: Partial<BotConfig>;
  rateLimit?: Partial<RateLimitConfig>;
  response?: Partial<ResponseConfig>;
}

export async function PATCH(request: NextRequest) {
  try {
    const body: ConfigUpdate = await request.json();
    const updates: Array<{ key: string; value: string }> = [];

    // Process bot config updates
    if (body.bot) {
      if (body.bot.name !== undefined) {
        updates.push({ key: CONFIG_KEYS.BOT_NAME, value: body.bot.name });
      }
      if (body.bot.prefix !== undefined) {
        updates.push({ key: CONFIG_KEYS.BOT_PREFIX, value: body.bot.prefix });
      }
      if (body.bot.owner !== undefined) {
        updates.push({ key: CONFIG_KEYS.BOT_OWNER, value: body.bot.owner });
      }
      if (body.bot.enableGroups !== undefined) {
        updates.push({ key: CONFIG_KEYS.BOT_ENABLE_GROUPS, value: String(body.bot.enableGroups) });
      }
      if (body.bot.autoRead !== undefined) {
        updates.push({ key: CONFIG_KEYS.BOT_AUTO_READ, value: String(body.bot.autoRead) });
      }
      if (body.bot.showTyping !== undefined) {
        updates.push({ key: CONFIG_KEYS.BOT_SHOW_TYPING, value: String(body.bot.showTyping) });
      }
    }

    // Process rate limit updates
    if (body.rateLimit) {
      if (body.rateLimit.perUser !== undefined) {
        updates.push({ key: CONFIG_KEYS.RATE_LIMIT_USER, value: String(body.rateLimit.perUser) });
      }
      if (body.rateLimit.perGroup !== undefined) {
        updates.push({ key: CONFIG_KEYS.RATE_LIMIT_GROUP, value: String(body.rateLimit.perGroup) });
      }
      if (body.rateLimit.global !== undefined) {
        updates.push({ key: CONFIG_KEYS.RATE_LIMIT_GLOBAL, value: String(body.rateLimit.global) });
      }
      if (body.rateLimit.blockDuration !== undefined) {
        updates.push({ key: CONFIG_KEYS.RATE_LIMIT_BLOCK_DURATION, value: String(body.rateLimit.blockDuration) });
      }
    }

    // Process response settings updates
    if (body.response) {
      if (body.response.minDelay !== undefined) {
        updates.push({ key: CONFIG_KEYS.RESPONSE_MIN_DELAY, value: String(body.response.minDelay) });
      }
      if (body.response.maxDelay !== undefined) {
        updates.push({ key: CONFIG_KEYS.RESPONSE_MAX_DELAY, value: String(body.response.maxDelay) });
      }
      if (body.response.typingSpeed !== undefined) {
        updates.push({ key: CONFIG_KEYS.RESPONSE_TYPING_SPEED, value: String(body.response.typingSpeed) });
      }
    }

    // Apply all updates
    for (const { key, value } of updates) {
      setSetting(key, value);
    }

    // Return updated config
    const config = buildFullConfig();

    return NextResponse.json({
      success: true,
      config,
      updatedKeys: updates.map((u) => u.key),
    });
  } catch (error) {
    console.error('Error updating config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}
