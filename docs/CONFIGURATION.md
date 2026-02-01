# Configuration Guide

Complete reference for all configuration options in the WhatsApp Bot.

## Environment Variables

All configuration is done through the `.env` file in the project root.

### Bot Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `BOT_PREFIX` | `!` | Command prefix (e.g., `!help`) |
| `BOT_NAME` | `WhatsAppBot` | Bot display name |
| `OWNER_NUMBER` | - | Owner's phone number (for admin commands) |

### Connection Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `USE_PAIRING_CODE` | `false` | Use pairing code instead of QR code |
| `PHONE_NUMBER` | - | Phone number for pairing code auth (without +) |

### Rate Limiting (Anti-Ban)

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_PER_MINUTE` | `30` | Global messages per minute |
| `RATE_LIMIT_PER_USER` | `5` | Messages per user per minute |
| `RATE_LIMIT_PER_GROUP` | `10` | Messages per group per minute |
| `RATE_LIMIT_BLOCK_DURATION` | `5` | Block duration in minutes when limit exceeded |

### Response Delays (Anti-Ban)

| Variable | Default | Description |
|----------|---------|-------------|
| `MIN_RESPONSE_DELAY_MS` | `2000` | Minimum delay before responding (ms) |
| `MAX_RESPONSE_DELAY_MS` | `5000` | Maximum delay before responding (ms) |
| `TYPING_SPEED_MS` | `75` | Milliseconds per character for typing simulation |
| `MAX_TYPING_DURATION_MS` | `8000` | Maximum typing indicator duration (ms) |

### Anti-Spam

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_DUPLICATE_DETECTION` | `true` | Detect and modify duplicate messages |
| `DUPLICATE_WINDOW_SECONDS` | `60` | Window for duplicate detection |
| `SIMILARITY_THRESHOLD` | `0.85` | Message similarity threshold (0-1) |

### Features

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_GROUPS` | `true` | Allow bot to respond in groups |
| `ENABLE_AUTO_READ` | `true` | Automatically mark messages as read |
| `ENABLE_TYPING_INDICATOR` | `true` | Show typing indicator before responding |
| `ENABLE_PRESENCE_UPDATES` | `true` | Send periodic presence updates |
| `PRESENCE_UPDATE_INTERVAL` | `5` | Presence update interval in minutes |

### Message Queue

| Variable | Default | Description |
|----------|---------|-------------|
| `QUEUE_MAX_RETRIES` | `3` | Max retry attempts for failed messages |
| `QUEUE_RETRY_DELAY` | `5000` | Delay between retries (ms) |
| `QUEUE_MIN_DELAY` | `1000` | Minimum delay between queued messages (ms) |
| `QUEUE_MAX_DELAY` | `3000` | Maximum delay between queued messages (ms) |

### Paths

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTH_FOLDER` | `./data/auth` | Session storage path |
| `LOG_FOLDER` | `./logs` | Log files path |

### Logging

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Log level: `trace`, `debug`, `info`, `warn`, `error`, `fatal` |
| `LOG_PRETTY` | `true` | Pretty print logs (disable in production) |

### Reconnection

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_RECONNECT_ATTEMPTS` | `10` | Maximum reconnection attempts before giving up |

## Example Configurations

### Minimal Configuration

```env
BOT_PREFIX=!
BOT_NAME=MyBot
OWNER_NUMBER=1234567890
```

### High Security (Anti-Ban Focused)

```env
BOT_PREFIX=!
BOT_NAME=SecureBot
OWNER_NUMBER=1234567890

# Strict rate limiting
RATE_LIMIT_PER_MINUTE=15
RATE_LIMIT_PER_USER=3
RATE_LIMIT_PER_GROUP=5

# Longer delays
MIN_RESPONSE_DELAY_MS=3000
MAX_RESPONSE_DELAY_MS=8000
TYPING_SPEED_MS=100

# Enable all protections
ENABLE_DUPLICATE_DETECTION=true
ENABLE_TYPING_INDICATOR=true
ENABLE_PRESENCE_UPDATES=true
```

### High Performance (Less Protection)

```env
BOT_PREFIX=!
BOT_NAME=FastBot
OWNER_NUMBER=1234567890

# Relaxed rate limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_USER=15
RATE_LIMIT_PER_GROUP=30

# Minimal delays
MIN_RESPONSE_DELAY_MS=500
MAX_RESPONSE_DELAY_MS=1500

# Disable some protections
ENABLE_TYPING_INDICATOR=false
ENABLE_PRESENCE_UPDATES=false
```

### Pairing Code Authentication

```env
BOT_PREFIX=!
BOT_NAME=MyBot
OWNER_NUMBER=923314378123

# Use pairing code instead of QR
USE_PAIRING_CODE=true
PHONE_NUMBER=923314378123
```

## Configuration Validation

The bot validates configuration on startup. Invalid values will cause the bot to exit with an error message.

Run configuration check:

```bash
npm run config:check
```

## Hot Reload

Some settings can be changed without restarting the bot:

- Rate limit values
- Delay values
- Feature toggles

Use the `!reload` command (owner only) to apply changes.

## Security Notes

1. **Never commit `.env` file** - It contains sensitive information
2. **Use strong owner number** - Only you should have access to admin commands
3. **Enable rate limiting** - Protects against abuse and bans
4. **Regular session cleanup** - Run `npm run clean:auth` if having connection issues
