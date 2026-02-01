# WhatsApp Bot

A powerful, anti-ban protected WhatsApp bot built with [Baileys](https://github.com/WhiskeySockets/Baileys) library.

## Features

- **Multiple Authentication Methods**: QR code or pairing code (phone number)
- **Anti-Ban Protection**: Rate limiting, typing simulation, human-like delays
- **Session Persistence**: Automatic session save/restore
- **Auto-Reconnection**: Handles disconnects with exponential backoff
- **Command System**: Extensible command framework with permissions
- **User Management**: Ban/unban users, track interactions
- **Message Queue**: Priority-based message queuing with retry logic
- **Duplicate Detection**: Prevents spam with similarity matching

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- WhatsApp account

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd WA

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your settings
nano .env
```

### Configuration

Edit `.env` file:

```env
# Bot Settings
BOT_PREFIX=!
BOT_NAME=MyBot
OWNER_NUMBER=1234567890

# Authentication (choose one)
USE_PAIRING_CODE=false    # Set to true for phone number auth
PHONE_NUMBER=1234567890   # Required if USE_PAIRING_CODE=true
```

### Running the Bot

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

### Authentication

**QR Code (default)**:
1. Run `npm run dev`
2. Scan the QR code with WhatsApp (Settings > Linked Devices > Link a Device)

**Pairing Code** (alternative):
1. Set `USE_PAIRING_CODE=true` and `PHONE_NUMBER=your_number` in `.env`
2. Run `npm run dev`
3. Enter the 8-digit code in WhatsApp (Settings > Linked Devices > Link with phone number)

## Commands

| Command | Description | Access |
|---------|-------------|--------|
| `!ping` | Check if bot is responsive | Everyone |
| `!help` | List all available commands | Everyone |
| `!info` | Show bot information | Everyone |
| `!uptime` | Show bot uptime | Everyone |
| `!stats` | Show detailed statistics | Owner |
| `!ban @user` | Ban a user from using the bot | Owner |
| `!broadcast <msg>` | Broadcast message to all chats | Owner |
| `!reload` | Reload commands without restart | Owner |

## Project Structure

```
WA/
├── src/
│   ├── commands/        # Bot commands
│   ├── config/          # Configuration
│   ├── core/            # Connection & client
│   ├── handlers/        # Message handlers
│   ├── services/        # Anti-ban services
│   ├── types/           # TypeScript types
│   └── utils/           # Utilities
├── docs/                # Documentation
├── data/auth/           # Session storage
├── logs/                # Log files
└── scripts/             # CLI tools
```

## Use Cases

See [docs/USE-CASES.md](docs/USE-CASES.md) for detailed use cases including:
- Customer Support Bot
- Notification System
- Group Management
- Personal Assistant
- E-commerce Integration

## Documentation

- [Configuration Guide](docs/CONFIGURATION.md)
- [Commands Reference](docs/COMMANDS.md)
- [Use Cases](docs/USE-CASES.md)
- [API Reference](docs/API.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## CLI Commands

```bash
npm run dev          # Start in development mode
npm run build        # Build for production
npm run start        # Start production build
npm run clean        # Clean all cache
npm run clean:auth   # Clean auth data only
npm run status       # Check bot status
npm run config       # Show current configuration
```

## Anti-Ban Features

This bot includes multiple anti-ban protections:

1. **Rate Limiting**: Per-user, per-group, and global limits
2. **Response Delays**: Randomized delays (2-5 seconds)
3. **Typing Simulation**: Shows typing indicator before responding
4. **Duplicate Detection**: Prevents sending duplicate messages
5. **Presence Updates**: Periodic online status updates
6. **Message Queue**: Spreads messages over time

## Environment Variables

See [docs/CONFIGURATION.md](docs/CONFIGURATION.md) for all available options.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Disclaimer

This bot is for educational purposes. Use responsibly and in accordance with WhatsApp's Terms of Service. The developers are not responsible for any misuse or account bans.
