# API Reference

Internal API reference for developers extending the bot.

## Core Modules

### Client (`src/core/client.ts`)

Main bot client interface.

#### Functions

##### `startBot(): Promise<WASocket>`
Start the bot and connect to WhatsApp.

```typescript
import { startBot } from './core/client';

const socket = await startBot();
```

##### `stopBot(): Promise<void>`
Gracefully stop the bot (keeps session).

```typescript
import { stopBot } from './core/client';

await stopBot();
```

##### `logoutBot(): Promise<void>`
Stop the bot and clear session (requires re-authentication).

```typescript
import { logoutBot } from './core/client';

await logoutBot();
```

##### `sendMessage(jid, content, options?): Promise<void>`
Send a message with anti-ban protections.

```typescript
import { sendMessage } from './core/client';

// Text message
await sendMessage('1234567890@s.whatsapp.net', { text: 'Hello!' });

// Image
await sendMessage(jid, {
  image: { url: './image.jpg' },
  caption: 'Check this out!'
});

// Reply to a message
await sendMessage(jid, { text: 'Reply' }, { quoted: originalMessage });
```

##### `sendText(jid, text, options?): Promise<void>`
Shorthand for sending text messages.

```typescript
import { sendText } from './core/client';

await sendText('1234567890@s.whatsapp.net', 'Hello!');
```

##### `sendReaction(jid, emoji, messageKey): Promise<void>`
React to a message.

```typescript
import { sendReaction } from './core/client';

await sendReaction(jid, '👍', message.key);
```

##### `getStats(): BotStats`
Get bot statistics.

```typescript
import { getStats } from './core/client';

const stats = getStats();
console.log(stats.messagesReceived);
```

##### `getExtendedStats()`
Get detailed statistics including anti-ban services.

```typescript
import { getExtendedStats } from './core/client';

const { bot, rateLimit, queue, antiSpam } = getExtendedStats();
```

##### `isConnected(): boolean`
Check if bot is connected.

```typescript
import { isConnected } from './core/client';

if (isConnected()) {
  // Bot is online
}
```

##### `getSocket(): WASocket | null`
Get raw Baileys socket for advanced operations.

```typescript
import { getSocket } from './core/client';

const socket = getSocket();
if (socket) {
  // Direct Baileys API access
  await socket.sendMessage(jid, content);
}
```

---

### Connection (`src/core/connection.ts`)

Connection management.

#### Functions

##### `connect(): Promise<WASocket>`
Establish WhatsApp connection.

##### `disconnect(): Promise<void>`
Disconnect and logout.

##### `close(): Promise<void>`
Close connection without logout.

#### Events

```typescript
import { setConnectionCallback, setMessageCallback } from './core/client';

// Connection state changes
setConnectionCallback((update) => {
  if (update.connection === 'open') {
    console.log('Connected!');
  }
});

// Incoming messages
setMessageCallback((upsert) => {
  const { messages } = upsert;
  for (const msg of messages) {
    console.log('New message:', msg);
  }
});
```

---

### Services

#### Rate Limit (`src/services/rateLimit.ts`)

```typescript
import { canSend, recordSend, getStats } from './services/rateLimit';

// Check if can send
if (canSend(jid, isGroup)) {
  await sendMessage(jid, content);
  recordSend(jid, isGroup);
}

// Get stats
const stats = getStats();
console.log(stats.blocked); // Number of blocked requests
```

#### Message Queue (`src/services/queue.ts`)

```typescript
import { enqueue, Priority } from './services/queue';

// Add to queue
const messageId = enqueue(jid, content, options, Priority.HIGH);

// Priority levels
Priority.HIGH    // Owner messages, errors
Priority.NORMAL  // Regular messages
Priority.LOW     // Broadcasts, bulk messages
```

#### Anti-Spam (`src/services/antiSpam.ts`)

```typescript
import { isDuplicate, recordMessage, addVariation } from './services/antiSpam';

// Check for duplicate
if (isDuplicate(jid, text)) {
  text = addVariation(text); // Add slight variation
}

// Record message
recordMessage(jid, text);
```

#### Presence (`src/services/presence.ts`)

```typescript
import {
  setAvailable,
  setUnavailable,
  simulateTyping,
  showTyping,
  hideTyping
} from './services/presence';

// Set online status
await setAvailable();
await setUnavailable();

// Typing indicator
await showTyping(jid);
await simulateTyping(jid, messageLength); // Auto duration
await hideTyping(jid);
```

#### User Management (`src/services/users.ts`)

```typescript
import {
  banUser,
  unbanUser,
  isBanned,
  getUser,
  updateUser,
  warnUser
} from './services/users';

// Ban management
await banUser(userId, 'Spam');
await unbanUser(userId);
const banned = isBanned(userId);

// User data
const user = getUser(userId);
console.log(user.messageCount);

// Warnings
await warnUser(userId, 'First warning');
```

---

### Types (`src/types/index.ts`)

```typescript
// Bot client
interface BotClient {
  socket: WASocket;
  startTime: Date;
  isConnected: boolean;
}

// Bot statistics
interface BotStats {
  startTime: Date;
  uptime: number;
  messagesReceived: number;
  messagesSent: number;
  commandsExecuted: number;
  errors: number;
}

// Command definition
interface Command {
  name: string;
  aliases?: string[];
  description: string;
  usage?: string;
  examples?: string[];
  cooldown?: number;
  ownerOnly?: boolean;
  groupOnly?: boolean;
  privateOnly?: boolean;
  execute: (ctx: CommandContext) => Promise<void>;
}

// Command context
interface CommandContext {
  message: WAMessage;
  sender: string;
  senderName: string;
  jid: string;
  isGroup: boolean;
  isOwner: boolean;
  text: string;
  command: string;
  args: string[];
  prefix: string;
  quotedMessage?: any;
  mentions: string[];
  reply: (text: string) => Promise<void>;
  react: (emoji: string) => Promise<void>;
}

// User data
interface UserData {
  jid: string;
  name: string;
  firstSeen: Date;
  lastSeen: Date;
  messageCount: number;
  commandCount: number;
  isBanned: boolean;
  banReason?: string;
  warnings: string[];
}
```

---

### Utilities (`src/utils/`)

#### Logger (`src/utils/logger.ts`)

```typescript
import { createLogger } from './utils/logger';

const logger = createLogger('mymodule');

logger.info('Information message');
logger.warn({ data: 'value' }, 'Warning message');
logger.error({ err: error }, 'Error occurred');
logger.debug('Debug info');
```

#### Helpers (`src/utils/helpers.ts`)

```typescript
import {
  sleep,
  randomDelay,
  isGroupJid,
  formatDuration,
  formatNumber,
  extractPhoneNumber
} from './utils/helpers';

// Async delay
await sleep(1000); // 1 second

// Random delay between min and max
const delay = randomDelay(2000, 5000);
await sleep(delay);

// Check if JID is group
const isGroup = isGroupJid(jid); // true if ends with @g.us

// Format duration
const formatted = formatDuration(3661000); // "1h 1m 1s"

// Format number
const num = formatNumber(1234567); // "1,234,567"

// Extract phone from JID
const phone = extractPhoneNumber('1234567890@s.whatsapp.net'); // "1234567890"
```

#### Parser (`src/utils/parser.ts`)

```typescript
import { parseCommand } from './utils/parser';

const parsed = parseCommand('!help ping');
// { command: 'help', args: ['ping'], prefix: '!' }
```

---

## Events

### Connection Events

```typescript
sock.ev.on('connection.update', (update) => {
  const { connection, lastDisconnect, qr } = update;

  if (qr) {
    // Display QR code
  }

  if (connection === 'close') {
    // Handle disconnect
  }

  if (connection === 'open') {
    // Connected successfully
  }
});
```

### Message Events

```typescript
sock.ev.on('messages.upsert', ({ messages, type }) => {
  if (type !== 'notify') return; // Only new messages

  for (const message of messages) {
    // Handle message
  }
});
```

### Group Events

```typescript
sock.ev.on('group-participants.update', (update) => {
  const { id, participants, action } = update;
  // action: 'add', 'remove', 'promote', 'demote'
});
```

---

## Error Handling

```typescript
import { handleError, BotError } from './utils/errorHandler';

try {
  await someOperation();
} catch (error) {
  const handled = handleError(error);

  if (handled.shouldRetry) {
    // Retry the operation
  }

  if (handled.userMessage) {
    await reply(handled.userMessage);
  }
}

// Custom errors
throw new BotError('Something went wrong', 'USER_ERROR');
```
