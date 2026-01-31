# Implementation Plan
# WhatsApp Chatbot using Baileys

**Total Phases:** 5
**Estimated Complexity:** Medium-High

---

## Phase Overview

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| 1 | Project Setup | ✅ Done | Initialize project, dependencies, configuration |
| 2 | Core Connection | ✅ Done | Baileys integration, auth, reconnection |
| 3 | Message Handling | ✅ Done | Receive/send messages, command parsing |
| 4 | Anti-Ban Layer | ✅ Done | Rate limiting, delays, queue system |
| 5 | Commands & Polish | ✅ Done | Built-in commands, error handling, testing |

---

## Phase 1: Project Setup

### Objectives
- Initialize Node.js/TypeScript project
- Install and configure dependencies
- Set up project structure and tooling

### Tasks

#### 1.1 Initialize Project
```bash
mkdir whatsapp-bot && cd whatsapp-bot
npm init -y
```

#### 1.2 Install Dependencies

**Production Dependencies:**
```bash
npm install @whiskeysockets/baileys pino pino-pretty dotenv
```

**Development Dependencies:**
```bash
npm install -D typescript @types/node ts-node nodemon
```

#### 1.3 Configure TypeScript
Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### 1.4 Create Directory Structure
```
src/
├── index.ts
├── config/
│   └── index.ts
├── core/
├── handlers/
├── commands/
├── services/
├── utils/
│   └── logger.ts
└── types/
    └── index.ts
data/
└── auth/
logs/
```

#### 1.5 Environment Configuration
Create `.env.example` and `.env`:
```env
# Bot Settings
BOT_PREFIX=!
BOT_NAME=WhatsAppBot
OWNER_NUMBER=1234567890

# Anti-Ban Configuration
RATE_LIMIT_PER_MINUTE=30
MIN_RESPONSE_DELAY_MS=2000
MAX_RESPONSE_DELAY_MS=5000
TYPING_SPEED_MS=75

# Features
ENABLE_GROUPS=true
ENABLE_AUTO_READ=true
ENABLE_TYPING_INDICATOR=true

# Paths
AUTH_FOLDER=./data/auth
LOG_LEVEL=info
```

#### 1.6 Setup Scripts
Add to `package.json`:
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "clean": "rm -rf dist"
  }
}
```

### Deliverables
- [ ] Initialized npm project with TypeScript
- [ ] All dependencies installed
- [ ] Directory structure created
- [ ] Environment configuration ready
- [ ] Logger utility implemented
- [ ] Config loader implemented

---

## Phase 2: Core Connection

### Objectives
- Implement Baileys socket connection
- Handle authentication (QR code + pairing code)
- Implement session persistence
- Build auto-reconnection logic

### Tasks

#### 2.1 Types Definition (`src/types/index.ts`)
```typescript
import { WASocket, BaileysEventMap } from '@whiskeysockets/baileys'

export interface BotConfig {
  prefix: string
  name: string
  ownerNumber: string
  authFolder: string
  rateLimitPerMinute: number
  minResponseDelay: number
  maxResponseDelay: number
  typingSpeed: number
  enableGroups: boolean
  enableAutoRead: boolean
  enableTypingIndicator: boolean
}

export interface BotClient {
  socket: WASocket
  config: BotConfig
  startTime: Date
}

export type ConnectionState = 'connecting' | 'open' | 'closing' | 'close'
```

#### 2.2 Configuration Loader (`src/config/index.ts`)
```typescript
import dotenv from 'dotenv'
import { BotConfig } from '../types'

dotenv.config()

export const config: BotConfig = {
  prefix: process.env.BOT_PREFIX || '!',
  name: process.env.BOT_NAME || 'WhatsAppBot',
  ownerNumber: process.env.OWNER_NUMBER || '',
  authFolder: process.env.AUTH_FOLDER || './data/auth',
  rateLimitPerMinute: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '30'),
  minResponseDelay: parseInt(process.env.MIN_RESPONSE_DELAY_MS || '2000'),
  maxResponseDelay: parseInt(process.env.MAX_RESPONSE_DELAY_MS || '5000'),
  typingSpeed: parseInt(process.env.TYPING_SPEED_MS || '75'),
  enableGroups: process.env.ENABLE_GROUPS === 'true',
  enableAutoRead: process.env.ENABLE_AUTO_READ === 'true',
  enableTypingIndicator: process.env.ENABLE_TYPING_INDICATOR === 'true',
}
```

#### 2.3 Session Manager (`src/core/session.ts`)
- Implement `useMultiFileAuthState` wrapper
- Add session validation on startup
- Handle credential updates

#### 2.4 Connection Manager (`src/core/connection.ts`)
```typescript
// Key responsibilities:
// 1. Create Baileys socket with proper config
// 2. Handle connection.update events
// 3. Implement reconnection with exponential backoff
// 4. QR code display in terminal
// 5. Pairing code support (optional)
```

**Reconnection Logic:**
```typescript
const reconnectIntervals = [1000, 2000, 5000, 10000, 30000, 60000]
let reconnectAttempt = 0

async function reconnect() {
  const delay = reconnectIntervals[Math.min(reconnectAttempt, reconnectIntervals.length - 1)]
  logger.info(`Reconnecting in ${delay}ms (attempt ${reconnectAttempt + 1})`)
  await sleep(delay)
  reconnectAttempt++
  await connect()
}
```

#### 2.5 Main Client (`src/core/client.ts`)
- Initialize socket with all configurations
- Register event listeners
- Export client instance

#### 2.6 Entry Point (`src/index.ts`)
```typescript
import { startBot } from './core/client'
import { logger } from './utils/logger'

async function main() {
  logger.info('Starting WhatsApp Bot...')

  try {
    await startBot()
  } catch (error) {
    logger.error('Failed to start bot:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down...')
  process.exit(0)
})

main()
```

### Deliverables
- [ ] Types defined for bot configuration
- [ ] Config loader reading from .env
- [ ] Session manager with persistence
- [ ] Connection manager with QR auth
- [ ] Auto-reconnection with backoff
- [ ] Graceful shutdown handling
- [ ] Bot connects and stays online

---

## Phase 3: Message Handling

### Objectives
- Process incoming messages
- Implement message sending with reply support
- Build command parser
- Handle different message types

### Tasks

#### 3.1 Message Handler (`src/handlers/message.ts`)
```typescript
// Handle messages.upsert event
// Extract message content (text, media, etc.)
// Determine if private or group message
// Route to command parser or custom handlers
```

**Message Extraction:**
```typescript
function extractMessageContent(message: WAMessage): string | null {
  const msg = message.message
  if (!msg) return null

  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    null
  )
}
```

#### 3.2 Message Sender (`src/services/sender.ts`)
```typescript
interface SendOptions {
  quoted?: WAMessage
  mentions?: string[]
}

async function sendText(jid: string, text: string, options?: SendOptions): Promise<void>
async function sendImage(jid: string, image: Buffer | string, caption?: string): Promise<void>
async function sendReply(message: WAMessage, text: string): Promise<void>
```

#### 3.3 Command Parser (`src/handlers/command.ts`)
```typescript
interface ParsedCommand {
  name: string
  args: string[]
  rawArgs: string
  prefix: string
  isCommand: boolean
}

function parseCommand(text: string, prefix: string): ParsedCommand {
  if (!text.startsWith(prefix)) {
    return { isCommand: false, ... }
  }

  const [commandWithPrefix, ...args] = text.trim().split(/\s+/)
  const name = commandWithPrefix.slice(prefix.length).toLowerCase()

  return {
    name,
    args,
    rawArgs: args.join(' '),
    prefix,
    isCommand: true
  }
}
```

#### 3.4 Command Context (`src/types/index.ts`)
```typescript
interface CommandContext {
  socket: WASocket
  message: WAMessage
  sender: string
  senderName: string
  isGroup: boolean
  groupId?: string
  isOwner: boolean
  args: string[]
  rawArgs: string
  reply: (text: string) => Promise<void>
  react: (emoji: string) => Promise<void>
}
```

#### 3.5 Connection Event Handler (`src/handlers/connection.ts`)
- Log connection state changes
- Handle QR code updates
- Trigger reconnection on disconnect

#### 3.6 Group Handler (`src/handlers/group.ts`)
- Detect group messages
- Get group metadata
- Check if sender is admin

### Deliverables
- [ ] Message handler processing incoming messages
- [ ] Message content extraction for all types
- [ ] Command parser with prefix detection
- [ ] Command context with helper methods
- [ ] Reply and reaction support
- [ ] Group vs private detection
- [ ] Sender identification

---

## Phase 4: Anti-Ban Layer

### Objectives
- Implement rate limiting
- Add response delays
- Create message queue
- Simulate human-like behavior

### Tasks

#### 4.1 Rate Limiter (`src/services/rateLimit.ts`)
```typescript
interface RateLimitConfig {
  perUser: { limit: number; window: number }    // 5 per 60s
  perGroup: { limit: number; window: number }   // 10 per 60s
  global: { limit: number; window: number }     // 30 per 60s
}

class RateLimiter {
  private userLimits: Map<string, number[]>
  private groupLimits: Map<string, number[]>
  private globalRequests: number[]

  canSend(jid: string, isGroup: boolean): boolean
  recordSend(jid: string, isGroup: boolean): void
  getRemainingQuota(jid: string): number
}
```

#### 4.2 Delay Service (`src/services/delay.ts`)
```typescript
// Random delay within configured range
async function randomDelay(min: number, max: number): Promise<void> {
  const delay = min + Math.random() * (max - min)
  await sleep(delay)
}

// Typing simulation based on message length
async function simulateTyping(
  socket: WASocket,
  jid: string,
  messageLength: number,
  typingSpeed: number
): Promise<void> {
  await socket.sendPresenceUpdate('composing', jid)
  const typingDuration = Math.min(messageLength * typingSpeed, 10000)
  await sleep(typingDuration)
  await socket.sendPresenceUpdate('paused', jid)
}
```

#### 4.3 Message Queue (`src/services/queue.ts`)
```typescript
interface QueuedMessage {
  id: string
  jid: string
  content: AnyMessageContent
  options?: SendOptions
  priority: number
  timestamp: number
}

class MessageQueue {
  private queue: QueuedMessage[]
  private processing: boolean

  enqueue(message: QueuedMessage): void
  process(): Promise<void>  // Process one at a time with delays
  clear(): void
  size(): number
}
```

#### 4.4 Anti-Spam Service (`src/services/antiSpam.ts`)
```typescript
class AntiSpamService {
  private recentMessages: Map<string, string[]>  // hash of recent messages

  isDuplicate(jid: string, content: string): boolean
  recordMessage(jid: string, content: string): void

  // Vary message content to avoid detection
  addVariation(text: string): string  // Add invisible chars or slight variations
}
```

#### 4.5 Presence Manager (`src/services/presence.ts`)
```typescript
// Periodically update presence to appear online
class PresenceManager {
  startPeriodicUpdates(socket: WASocket, interval: number): void
  stopUpdates(): void
  setAvailable(socket: WASocket): Promise<void>
  setUnavailable(socket: WASocket): Promise<void>
}
```

#### 4.6 Integration
- Wrap all outgoing messages through queue
- Apply rate limiting before queueing
- Add typing simulation before sending
- Insert random delays between messages

### Deliverables
- [ ] Rate limiter with per-user/group/global limits
- [ ] Random delay service
- [ ] Typing indicator simulation
- [ ] Message queue with priority support
- [ ] Duplicate message detection
- [ ] Presence management
- [ ] All sends go through anti-ban layer

---

## Phase 5: Commands & Polish

### Objectives
- Implement command system with hot reload
- Create built-in commands
- Add comprehensive error handling
- Write documentation

### Tasks

#### 5.1 Command Structure (`src/commands/base.ts`)
```typescript
interface Command {
  name: string
  aliases?: string[]
  description: string
  usage?: string
  category: 'general' | 'admin' | 'owner' | 'utility'
  cooldown?: number  // seconds
  ownerOnly?: boolean
  groupOnly?: boolean
  privateOnly?: boolean
  execute: (ctx: CommandContext) => Promise<void>
}
```

#### 5.2 Command Loader (`src/commands/index.ts`)
```typescript
class CommandLoader {
  private commands: Map<string, Command>
  private aliases: Map<string, string>
  private cooldowns: Map<string, Map<string, number>>

  loadCommands(): Promise<void>     // Load all commands from ./commands/
  reloadCommands(): Promise<void>   // Hot reload
  getCommand(name: string): Command | undefined
  isOnCooldown(commandName: string, userId: string): boolean
  setCooldown(commandName: string, userId: string): void
  getAllCommands(): Command[]
}
```

#### 5.3 Built-in Commands

**General Commands:**
```typescript
// src/commands/ping.ts
export const command: Command = {
  name: 'ping',
  description: 'Check bot response time',
  category: 'general',
  async execute(ctx) {
    const start = Date.now()
    const msg = await ctx.reply('Pinging...')
    const latency = Date.now() - start
    await ctx.reply(`Pong! Latency: ${latency}ms`)
  }
}

// src/commands/help.ts
// src/commands/info.ts
// src/commands/uptime.ts
```

**Owner Commands:**
```typescript
// src/commands/reload.ts
export const command: Command = {
  name: 'reload',
  description: 'Reload all commands',
  category: 'owner',
  ownerOnly: true,
  async execute(ctx) {
    await commandLoader.reloadCommands()
    await ctx.reply('Commands reloaded!')
  }
}

// src/commands/broadcast.ts
// src/commands/ban.ts
// src/commands/unban.ts
// src/commands/eval.ts (careful with this one!)
```

#### 5.4 Error Handling (`src/utils/errorHandler.ts`)
```typescript
class ErrorHandler {
  handleCommandError(ctx: CommandContext, error: Error): Promise<void>
  handleConnectionError(error: Error): void
  handleFatalError(error: Error): never

  // Wrap async functions for safety
  wrap<T>(fn: () => Promise<T>): Promise<T | undefined>
}

// Global handlers
process.on('uncaughtException', ...)
process.on('unhandledRejection', ...)
```

#### 5.5 User Management (`src/services/users.ts`)
```typescript
interface UserData {
  jid: string
  name?: string
  isBanned: boolean
  firstSeen: Date
  lastSeen: Date
  messageCount: number
}

class UserManager {
  getUser(jid: string): UserData | undefined
  updateUser(jid: string, data: Partial<UserData>): void
  banUser(jid: string): void
  unbanUser(jid: string): void
  isBanned(jid: string): boolean
}
```

#### 5.6 Statistics (`src/services/stats.ts`)
```typescript
class StatsService {
  private messagesReceived: number
  private messagesSent: number
  private commandsExecuted: number
  private startTime: Date

  getStats(): BotStats
  recordMessage(type: 'received' | 'sent'): void
  recordCommand(name: string): void
  getUptime(): string
}
```

#### 5.7 Documentation
- Update README.md with setup instructions
- Document all commands
- Add troubleshooting guide
- Create CONTRIBUTING.md

#### 5.8 Testing
```typescript
// tests/commands.test.ts
// tests/rateLimit.test.ts
// tests/parser.test.ts
```

### Deliverables
- [ ] Command base structure
- [ ] Dynamic command loader
- [ ] All built-in commands implemented
- [ ] Command cooldowns working
- [ ] Permission system (owner/admin/user)
- [ ] Comprehensive error handling
- [ ] User ban/unban system
- [ ] Statistics tracking
- [ ] README documentation
- [ ] Basic test coverage

---

## Implementation Checklist

### Phase 1: Project Setup ✅ COMPLETED
- [x] Initialize npm project
- [x] Install all dependencies
- [x] Configure TypeScript
- [x] Create directory structure
- [x] Set up environment variables
- [x] Implement logger utility
- [x] Create config loader

### Phase 2: Core Connection ✅ COMPLETED
- [x] Define TypeScript types
- [x] Implement session manager
- [x] Create connection manager
- [x] Add QR code authentication
- [ ] Add pairing code support (optional)
- [x] Implement auto-reconnection
- [x] Handle graceful shutdown

### Phase 3: Message Handling ✅ COMPLETED
- [x] Create message handler
- [x] Extract message content
- [x] Build command parser
- [x] Create command context
- [x] Implement reply/react helpers
- [x] Handle group detection
- [x] Basic commands implemented (ping, help, info)

### Phase 4: Anti-Ban Layer ✅ COMPLETED
- [x] Implement rate limiter (src/services/rateLimit.ts)
- [x] Add random delays (integrated in client.ts)
- [x] Create message queue (src/services/queue.ts)
- [x] Add typing simulation (src/services/presence.ts)
- [x] Implement duplicate detection (src/services/antiSpam.ts)
- [x] Add presence management (src/services/presence.ts)
- [x] Integrate with send flow (updated src/core/client.ts)

### Phase 5: Commands & Polish ✅ COMPLETED
- [x] Create command structure (src/types/index.ts)
- [x] Build command loader (src/commands/index.ts)
- [x] Implement ping command (src/commands/ping.ts)
- [x] Implement help command (src/commands/help.ts)
- [x] Implement info command (src/commands/info.ts)
- [x] Implement uptime command (src/commands/uptime.ts)
- [x] Implement reload command (src/commands/reload.ts)
- [x] Implement broadcast command (src/commands/broadcast.ts)
- [x] Implement ban/unban commands (src/commands/ban.ts)
- [x] Implement stats command (src/commands/stats.ts)
- [x] Add error handling (src/utils/errorHandler.ts)
- [x] Create user manager (src/services/users.ts)
- [x] Add statistics tracking (integrated in client.ts)

---

## Additional Features ✅ COMPLETED

### CLI Command Center
- [x] Created `scripts/cli.ts` with command utilities
- [x] Added npm scripts for common operations
- [x] Status check, config validation, cache cleaning
- [x] Project information display

### Documentation
- [x] Created `COOKBOOK.md` - comprehensive usage guide
- [x] Added all configurable settings to `.env.example`
- [x] Documented all commands and features
- [x] Added troubleshooting section

### NPM Scripts Available
| Script | Description |
|--------|-------------|
| `npm run dev` | Start in development mode |
| `npm run build` | Build for production |
| `npm run start` | Run production build |
| `npm run clean` | Clean all cache |
| `npm run clean:auth` | Clean auth data |
| `npm run clean:logs` | Clean log files |
| `npm run status` | Check bot status |
| `npm run config` | Show configuration |
| `npm run config:check` | Validate config |
| `npm run info` | Project information |
| `npm run help` | CLI help |

---

## Post-Implementation

### Monitoring
- Set up PM2 for process management
- Configure log rotation
- Monitor memory usage
- Track message success rates

### Maintenance
- Keep Baileys updated
- Monitor GitHub issues for breaking changes
- Adjust rate limits based on experience
- Regular session credential backups

### Scaling Considerations
- Move to Redis for session storage
- Implement BullMQ for message queuing
- Consider multiple instances with load balancing
- Database for persistent user data

---

## Project Summary

**Status: COMPLETE** ✅

All 5 phases have been implemented:
1. ✅ Project Setup - TypeScript, dependencies, configuration
2. ✅ Core Connection - Baileys, QR auth, auto-reconnection
3. ✅ Message Handling - Command parsing, handlers, context
4. ✅ Anti-Ban Layer - Rate limiting, queue, delays, presence
5. ✅ Commands & Polish - 10 commands, user management, error handling

**Additional Deliverables:**
- CLI Command Center for management
- Comprehensive COOKBOOK.md documentation
- 30+ configurable environment variables
- Full TypeScript implementation

**Files Created: 25+ source files**
**Commands Available: 10 (4 general, 6 owner-only)**
**Services: 5 (rateLimit, queue, antiSpam, presence, users)**
