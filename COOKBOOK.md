# WhatsApp Bot Cookbook

A comprehensive guide to setting up, configuring, and using the WhatsApp Bot.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Configuration Guide](#configuration-guide)
3. [Commands Reference](#commands-reference)
4. [CLI Command Center](#cli-command-center)
5. [Anti-Ban Features](#anti-ban-features)
6. [Customization](#customization)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- A WhatsApp account

### Installation

```bash
# Clone or navigate to the project
cd whatsapp-bot

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit configuration
nano .env  # or use your preferred editor

# Start the bot
npm run dev
```

### First Run

1. Run `npm run dev` to start the bot
2. A QR code will appear in your terminal
3. Open WhatsApp on your phone
4. Go to **Settings → Linked Devices → Link a Device**
5. Scan the QR code
6. The bot is now connected!

---

## Configuration Guide

### Environment Variables (.env)

All configuration is done through the `.env` file:

```env
# ═══════════════════════════════════════════════════════════════
# BOT SETTINGS
# ═══════════════════════════════════════════════════════════════

# Command prefix (default: !)
BOT_PREFIX=!

# Bot display name
BOT_NAME=WhatsAppBot

# Owner's phone number (with country code, no + or spaces)
# This number gets access to owner-only commands
OWNER_NUMBER=1234567890

# ═══════════════════════════════════════════════════════════════
# ANTI-BAN CONFIGURATION
# ═══════════════════════════════════════════════════════════════

# Maximum messages per minute globally (default: 30)
# Lower = safer, Higher = faster responses
RATE_LIMIT_PER_MINUTE=30

# Minimum delay before responding (milliseconds)
# Recommended: 1000-3000
MIN_RESPONSE_DELAY_MS=2000

# Maximum delay before responding (milliseconds)
# Recommended: 3000-6000
MAX_RESPONSE_DELAY_MS=5000

# Typing speed simulation (ms per character)
# Higher = slower, more human-like typing
TYPING_SPEED_MS=75

# Maximum typing duration (milliseconds)
MAX_TYPING_DURATION_MS=8000

# ═══════════════════════════════════════════════════════════════
# RATE LIMITING (per user/group)
# ═══════════════════════════════════════════════════════════════

# Messages per minute per user (default: 5)
RATE_LIMIT_PER_USER=5

# Messages per minute per group (default: 10)
RATE_LIMIT_PER_GROUP=10

# Block duration when rate limit exceeded (minutes)
RATE_LIMIT_BLOCK_DURATION=5

# ═══════════════════════════════════════════════════════════════
# FEATURES
# ═══════════════════════════════════════════════════════════════

# Enable/disable group message handling
ENABLE_GROUPS=true

# Automatically mark messages as read
ENABLE_AUTO_READ=true

# Show typing indicator before responding
ENABLE_TYPING_INDICATOR=true

# Enable presence updates (online status)
ENABLE_PRESENCE_UPDATES=true

# Presence update interval (minutes)
PRESENCE_UPDATE_INTERVAL=5

# ═══════════════════════════════════════════════════════════════
# ANTI-SPAM
# ═══════════════════════════════════════════════════════════════

# Enable duplicate message detection
ENABLE_DUPLICATE_DETECTION=true

# Time window for duplicate detection (seconds)
DUPLICATE_WINDOW_SECONDS=60

# Similarity threshold for near-duplicate detection (0.0-1.0)
SIMILARITY_THRESHOLD=0.85

# ═══════════════════════════════════════════════════════════════
# PATHS
# ═══════════════════════════════════════════════════════════════

# Session/auth data storage
AUTH_FOLDER=./data/auth

# Log files directory
LOG_FOLDER=./logs

# ═══════════════════════════════════════════════════════════════
# LOGGING
# ═══════════════════════════════════════════════════════════════

# Log level: trace, debug, info, warn, error, fatal
LOG_LEVEL=info

# Enable pretty printing for logs (disable in production)
LOG_PRETTY=true
```

### Configuration Tips

1. **For Personal Use**: Use default settings
2. **For High Traffic**: Increase rate limits, decrease delays
3. **For Maximum Safety**: Decrease rate limits, increase delays
4. **For Groups**: Ensure `ENABLE_GROUPS=true`

---

## Commands Reference

### General Commands (Everyone)

| Command | Aliases | Description |
|---------|---------|-------------|
| `!ping` | `!p`, `!latency` | Check bot response time |
| `!help` | `!h`, `!menu`, `!commands` | Show all commands |
| `!help <cmd>` | - | Get help for specific command |
| `!info` | `!status`, `!stats`, `!botinfo` | Show bot information |
| `!uptime` | `!up`, `!runtime` | Show how long bot has been running |

### Owner Commands

| Command | Aliases | Description |
|---------|---------|-------------|
| `!ban <number>` | `!block` | Ban a user from using the bot |
| `!unban <number>` | `!unblock` | Unban a user |
| `!banlist` | `!banned`, `!bans` | Show all banned users |
| `!broadcast <msg>` | `!bc`, `!announce` | Send message to all users |
| `!reload` | `!rl` | Hot reload all commands |
| `!stats` | `!statistics`, `!metrics` | Show detailed statistics |

### Command Examples

```
# Check if bot is alive
!ping

# Get help for a specific command
!help ban

# Ban a user
!ban 1234567890

# Broadcast to all users
!broadcast Hello everyone! Bot maintenance at 10 PM.

# View detailed stats
!stats
```

---

## CLI Command Center

The bot includes a CLI tool for management tasks.

### Using the CLI

```bash
# Show help
npm run help

# Check bot status
npm run status

# View configuration
npm run config

# Validate configuration
npm run config:check

# Show project info
npm run info

# Clean all cache
npm run clean

# Clean only auth data (requires new QR scan)
npm run clean:auth

# Clean only logs
npm run clean:logs

# Clean only build files
npm run clean:dist
```

### All NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start in development mode (hot reload) |
| `npm run build` | Build for production |
| `npm run start` | Run production build |
| `npm run clean` | Clean all cache |
| `npm run clean:auth` | Clean session data |
| `npm run clean:logs` | Clean log files |
| `npm run clean:dist` | Clean build output |
| `npm run status` | Check bot status |
| `npm run config` | Show configuration |
| `npm run config:check` | Validate configuration |
| `npm run info` | Show project information |
| `npm run help` | Show CLI help |
| `npm run typecheck` | Check TypeScript types |

---

## Anti-Ban Features

### Built-in Protections

1. **Rate Limiting**
   - Per-user limits (5 messages/minute default)
   - Per-group limits (10 messages/minute default)
   - Global limits (30 messages/minute default)
   - Auto-blocking on excessive requests

2. **Response Delays**
   - Random delays between 2-5 seconds
   - Configurable via `MIN_RESPONSE_DELAY_MS` and `MAX_RESPONSE_DELAY_MS`

3. **Typing Simulation**
   - Shows "typing..." indicator
   - Duration based on message length
   - Configurable speed via `TYPING_SPEED_MS`

4. **Duplicate Detection**
   - Exact match detection
   - Similarity-based detection (85% threshold)
   - Automatic message variation

5. **Presence Management**
   - Periodic "online" status updates
   - Configurable interval

### Best Practices

1. **Don't spam**: Keep rate limits reasonable
2. **Vary messages**: Avoid sending identical messages
3. **Use delays**: Don't respond instantly
4. **Limit broadcasts**: Use sparingly
5. **Monitor bans**: Watch for warning signs

---

## Customization

### Adding New Commands

1. Create a new file in `src/commands/`:

```typescript
// src/commands/mycommand.ts
import type { Command } from '../types'

const mycommand: Command = {
  name: 'mycommand',
  aliases: ['mc', 'mycmd'],
  description: 'My custom command',
  usage: '!mycommand <args>',
  example: '!mycommand hello',
  category: 'general', // or 'admin', 'owner', 'utility', 'fun'
  cooldown: 5, // seconds
  ownerOnly: false,
  groupOnly: false,
  privateOnly: false,
  adminOnly: false,

  async execute(ctx) {
    const { args, rawArgs, sender, senderName, isGroup } = ctx

    // Reply to the message
    await ctx.reply(`Hello ${senderName}! You said: ${rawArgs}`)

    // React with emoji
    await ctx.react('👍')

    // Send a separate message
    await ctx.sendMessage({ text: 'This is a separate message' })
  },
}

export default mycommand
```

2. Register in `src/commands/index.ts`:

```typescript
import mycommand from './mycommand'

const allCommands: Command[] = [
  // ... existing commands
  mycommand,
]
```

3. Run `!reload` to load the new command (or restart the bot)

### Command Context (ctx) Properties

| Property | Type | Description |
|----------|------|-------------|
| `socket` | WASocket | Baileys socket instance |
| `message` | WAMessage | Original message object |
| `sender` | string | Sender's JID |
| `senderName` | string | Sender's display name |
| `senderNumber` | string | Sender's phone number |
| `isGroup` | boolean | Is this a group message? |
| `groupId` | string | Group JID (if group) |
| `groupName` | string | Group name (if group) |
| `isOwner` | boolean | Is sender the bot owner? |
| `isGroupAdmin` | boolean | Is sender a group admin? |
| `args` | string[] | Command arguments as array |
| `rawArgs` | string | Raw arguments string |
| `prefix` | string | Command prefix used |
| `commandName` | string | Name of the command |

### Command Context (ctx) Methods

| Method | Description |
|--------|-------------|
| `ctx.reply(text)` | Reply to the message |
| `ctx.react(emoji)` | React with emoji |
| `ctx.sendMessage(content)` | Send any message content |

---

## Troubleshooting

### Common Issues

#### QR Code Not Appearing
```bash
# Clean auth data and restart
npm run clean:auth
npm run dev
```

#### "Session logged out" Error
```bash
# Your WhatsApp session expired. Clean and re-authenticate:
npm run clean:auth
npm run dev
# Scan new QR code
```

#### "Connection replaced" Errors
- Another WhatsApp Web session is active
- Close other WhatsApp Web tabs/apps
- The bot will auto-reconnect

#### Bot Not Responding
1. Check if connected: Look for "Connected to WhatsApp successfully!" in logs
2. Check if message has the prefix: Default is `!`
3. Check if user is banned: Use `!banlist`
4. Check rate limits: User may be rate-limited

#### TypeScript Errors
```bash
# Check for type errors
npm run typecheck

# Rebuild
npm run clean:dist
npm run build
```

### Getting Help

1. Check logs for error messages
2. Run `npm run status` to check configuration
3. Run `npm run config:check` to validate settings
4. Clean cache and restart: `npm run clean && npm run dev`

### Log Levels

Set `LOG_LEVEL` in `.env`:
- `trace`: Most verbose, all details
- `debug`: Debug information
- `info`: General information (default)
- `warn`: Warnings only
- `error`: Errors only
- `fatal`: Critical errors only

---

## Project Structure

```
whatsapp-bot/
├── src/
│   ├── index.ts          # Entry point
│   ├── config/
│   │   └── index.ts      # Configuration loader
│   ├── core/
│   │   ├── client.ts     # Bot client with anti-ban
│   │   ├── connection.ts # WhatsApp connection
│   │   └── session.ts    # Session management
│   ├── handlers/
│   │   ├── commands.ts   # Command registry
│   │   └── message.ts    # Message handler
│   ├── commands/
│   │   ├── index.ts      # Command loader
│   │   ├── ping.ts
│   │   ├── help.ts
│   │   ├── info.ts
│   │   ├── uptime.ts
│   │   ├── ban.ts
│   │   ├── broadcast.ts
│   │   ├── reload.ts
│   │   └── stats.ts
│   ├── services/
│   │   ├── index.ts      # Service exports
│   │   ├── rateLimit.ts  # Rate limiting
│   │   ├── queue.ts      # Message queue
│   │   ├── antiSpam.ts   # Duplicate detection
│   │   ├── presence.ts   # Presence management
│   │   └── users.ts      # User management
│   ├── utils/
│   │   ├── logger.ts     # Pino logger
│   │   ├── helpers.ts    # Utility functions
│   │   ├── parser.ts     # Command parser
│   │   └── errorHandler.ts
│   └── types/
│       └── index.ts      # TypeScript types
├── scripts/
│   └── cli.ts            # CLI command center
├── data/
│   └── auth/             # Session data (gitignored)
├── logs/                  # Log files (gitignored)
├── .env                   # Configuration (gitignored)
├── .env.example          # Configuration template
├── package.json
├── tsconfig.json
├── nodemon.json
├── COOKBOOK.md           # This file
└── PLAN.md               # Implementation plan
```

---

## License

MIT License - Feel free to use and modify!
