# Commands Reference

Complete reference for all bot commands.

## Command Format

```
!<command> [arguments]
```

- **Prefix**: `!` (configurable via `BOT_PREFIX` in `.env`)
- **Arguments**: Space-separated values after the command name
- **Mentions**: Use `@user` to mention users in commands

---

## General Commands

### !ping

Check if the bot is responsive and measure latency.

**Usage**: `!ping`

**Response**: `Pong! Latency: XXms`

**Access**: Everyone

---

### !help

Display available commands.

**Usage**:
- `!help` - List all commands
- `!help <command>` - Get help for specific command

**Response**: List of commands with descriptions

**Access**: Everyone

---

### !info

Display bot information and statistics.

**Usage**: `!info`

**Response**:
```
Bot Information
---------------
Name: WhatsAppBot
Version: 1.0.0
Prefix: !
Uptime: 2h 30m 15s
Commands: 10
```

**Access**: Everyone

---

### !uptime

Show how long the bot has been running.

**Usage**: `!uptime`

**Response**: `Uptime: 2 hours, 30 minutes, 15 seconds`

**Access**: Everyone

---

## Owner Commands

These commands can only be used by the bot owner (configured in `.env`).

### !stats

Display detailed bot statistics.

**Usage**: `!stats`

**Response**:
```
Bot Statistics
--------------
Messages Received: 1,234
Messages Sent: 567
Commands Executed: 890
Errors: 5

Rate Limit Stats:
- Blocked: 12
- Current Load: 15/30

Queue Stats:
- Pending: 3
- Processed: 564
- Failed: 2

Anti-Spam Stats:
- Duplicates Detected: 45
- Variations Added: 23
```

**Access**: Owner only

---

### !ban

Ban a user from using the bot.

**Usage**:
- `!ban @user` - Ban mentioned user
- `!ban @user <reason>` - Ban with reason
- `!unban @user` - Unban a user

**Response**: `User @user has been banned. Reason: <reason>`

**Access**: Owner only

**Notes**:
- Banned users cannot use any bot commands
- Ban persists across restarts
- Use `!unban` to remove the ban

---

### !broadcast

Send a message to all contacts/groups.

**Usage**: `!broadcast <message>`

**Example**: `!broadcast Server maintenance in 1 hour!`

**Response**: `Broadcasting to X contacts...`

**Access**: Owner only

**Warning**: Use sparingly to avoid rate limits and bans.

---

### !reload

Reload commands without restarting the bot.

**Usage**: `!reload`

**Response**: `Commands reloaded successfully. Loaded X commands.`

**Access**: Owner only

**Use Case**: After adding/modifying commands, reload them without downtime.

---

## Creating Custom Commands

### Basic Command Structure

```typescript
// src/commands/mycommand.ts
import { Command, CommandContext } from '../types';

export const myCommand: Command = {
  name: 'mycommand',
  aliases: ['mc', 'mycmd'],
  description: 'Description of what this command does',
  usage: '!mycommand <required_arg> [optional_arg]',
  examples: [
    '!mycommand hello',
    '!mycommand hello world'
  ],
  cooldown: 5,           // Seconds between uses
  ownerOnly: false,      // Restrict to owner
  groupOnly: false,      // Only work in groups
  privateOnly: false,    // Only work in private chats

  async execute(ctx: CommandContext): Promise<void> {
    const { args, sender, isGroup, reply, react } = ctx;

    // Your command logic here
    await reply(`Hello, ${sender}!`);
    await react('👍');
  }
};
```

### Command Context Properties

| Property | Type | Description |
|----------|------|-------------|
| `message` | `WAMessage` | Raw Baileys message object |
| `sender` | `string` | Sender's JID |
| `senderName` | `string` | Sender's display name |
| `jid` | `string` | Chat JID (group or private) |
| `isGroup` | `boolean` | Is this a group chat? |
| `isOwner` | `boolean` | Is sender the bot owner? |
| `text` | `string` | Full message text |
| `command` | `string` | Command name used |
| `args` | `string[]` | Command arguments |
| `prefix` | `string` | Command prefix used |
| `quotedMessage` | `any` | Quoted/replied message |
| `mentions` | `string[]` | Mentioned users |
| `reply(text)` | `function` | Reply to the message |
| `react(emoji)` | `function` | React to the message |

### Registering Commands

Add your command to `src/commands/index.ts`:

```typescript
import { myCommand } from './mycommand';

export const commands = [
  // ... existing commands
  myCommand,
];
```

### Command Best Practices

1. **Input Validation**
```typescript
if (args.length < 1) {
  await reply('Usage: !mycommand <argument>');
  return;
}
```

2. **Error Handling**
```typescript
try {
  await someAsyncOperation();
} catch (error) {
  logger.error({ err: error }, 'Command failed');
  await reply('An error occurred. Please try again.');
}
```

3. **User Feedback**
```typescript
await react('⏳'); // Show processing
const result = await longOperation();
await react('✅'); // Show complete
await reply(result);
```

4. **Cooldowns**
```typescript
cooldown: 10, // Prevent spam with 10-second cooldown
```

5. **Permissions**
```typescript
if (!ctx.isOwner) {
  await reply('This command is owner-only.');
  return;
}
```

---

## Command Aliases

Commands can have multiple aliases:

| Command | Aliases |
|---------|---------|
| `!help` | `!h`, `!commands` |
| `!ping` | `!p` |
| `!info` | `!about`, `!bot` |
| `!stats` | `!statistics` |

---

## Command Cooldowns

Default cooldowns:

| Command | Cooldown |
|---------|----------|
| `!ping` | 3 seconds |
| `!help` | 5 seconds |
| `!info` | 5 seconds |
| `!stats` | 10 seconds |
| `!broadcast` | 60 seconds |

---

## Error Messages

| Error | Message |
|-------|---------|
| Unknown command | "Unknown command. Use !help for available commands." |
| Owner only | "This command can only be used by the bot owner." |
| Cooldown active | "Please wait X seconds before using this command again." |
| Rate limited | "You're sending too many commands. Please slow down." |
| Banned user | "You are banned from using this bot." |
