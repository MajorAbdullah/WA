/**
 * Config Reset API Route
 * POST: Reset configuration to default values
 */

import { NextRequest, NextResponse } from 'next/server';
import { setSetting, deleteSetting, getAllSettings } from '@/lib/db/queries';
import { CONFIG_KEYS, DEFAULT_CONFIG } from '../route';

// =============================================================================
// POST - Reset configuration to defaults
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { section } = body as { section?: 'bot' | 'rateLimit' | 'response' | 'all' };

    let keysToReset: string[] = [];

    switch (section) {
      case 'bot':
        keysToReset = [
          CONFIG_KEYS.BOT_NAME,
          CONFIG_KEYS.BOT_PREFIX,
          CONFIG_KEYS.BOT_OWNER,
          CONFIG_KEYS.BOT_ENABLE_GROUPS,
          CONFIG_KEYS.BOT_AUTO_READ,
          CONFIG_KEYS.BOT_SHOW_TYPING,
        ];
        break;

      case 'rateLimit':
        keysToReset = [
          CONFIG_KEYS.RATE_LIMIT_USER,
          CONFIG_KEYS.RATE_LIMIT_GROUP,
          CONFIG_KEYS.RATE_LIMIT_GLOBAL,
          CONFIG_KEYS.RATE_LIMIT_BLOCK_DURATION,
        ];
        break;

      case 'response':
        keysToReset = [
          CONFIG_KEYS.RESPONSE_MIN_DELAY,
          CONFIG_KEYS.RESPONSE_MAX_DELAY,
          CONFIG_KEYS.RESPONSE_TYPING_SPEED,
        ];
        break;

      case 'all':
      default:
        keysToReset = Object.values(CONFIG_KEYS);
        break;
    }

    // Reset each key to its default value
    for (const key of keysToReset) {
      const defaultValue = DEFAULT_CONFIG[key];
      if (defaultValue !== undefined) {
        setSetting(key, defaultValue);
      } else {
        deleteSetting(key);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Configuration reset for section: ${section || 'all'}`,
      resetKeys: keysToReset,
    });
  } catch (error) {
    console.error('Error resetting config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset configuration' },
      { status: 500 }
    );
  }
}
