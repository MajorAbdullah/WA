<div align="center">

# 💬 WhatsApp Bot CLI

### A powerful, anti-ban protected WhatsApp bot

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Baileys](https://img.shields.io/badge/Baileys-Latest-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://github.com/WhiskeySockets/Baileys)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-commands">Commands</a> •
  <a href="#-documentation">Documentation</a>
</p>

---

</div>

## ✨ Features

<table>
<tr>
<td>

---

## 🚀 Quick Start

### 📋 Prerequisites

| Requirement                                                                                             | Version        |
| ------------------------------------------------------------------------------------------------------- | -------------- |
| ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)  | 18+            |
| ![npm](https://img.shields.io/badge/npm-CB3837?style=flat-square&logo=npm&logoColor=white)                | Latest         |
| ![WhatsApp](https://img.shields.io/badge/WhatsApp-25D366?style=flat-square&logo=whatsapp&logoColor=white) | Active Account |

### 📦 Installation

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

### ⚙️ Configuration

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

### ▶️ Running the Bot

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

### 🔑 Authentication

**QR Code (default)**:

1. Run `npm run dev`
2. Scan the QR code with WhatsApp (Settings > Linked Devices > Link a Device)

**Pairing Code** (alternative):

1. Set `USE_PAIRING_CODE=true` and `PHONE_NUMBER=your_number` in `.env`
2. Run `npm run dev`
3. Enter the 8-digit code in WhatsApp (Settings > Linked Devices > Link with phone number)

---

## 📝 Commands

| Command              | Description                     | Access      |
| -------------------- | ------------------------------- | ----------- |
| `!ping`            | Check if bot is responsive      | 🌐 Everyone |
| `!help`            | List all available commands     | 🌐 Everyone |
| `!info`            | Show bot information            | 🌐 Everyone |
| `!uptime`          | Show bot uptime                 | 🌐 Everyone |
| `!stats`           | Show detailed statistics        | 👑 Owner    |
| `!ban @user`       | Ban a user from using the bot   | 👑 Owner    |
| `!broadcast <msg>` | Broadcast message to all chats  | 👑 Owner    |
| `!reload`          | Reload commands without restart | 👑 Owner    |

---

## 📁 Project Structure

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

---

## 💡 Use Cases

See [docs/USE-CASES.md](docs/USE-CASES.md) for detailed use cases including:

| Use Case               | Description                    |
| ---------------------- | ------------------------------ |
| 🎧 Customer Support    | Automated customer service bot |
| 🔔 Notification System | Send alerts and notifications  |
| 👥 Group Management    | Manage WhatsApp groups         |
| 🤖 Personal Assistant  | AI-powered personal helper     |
| 🛒 E-commerce          | Order tracking and support     |

---

## 📚 Documentation

| Document                                    | Description               |
| ------------------------------------------- | ------------------------- |
| 📖[Configuration Guide](docs/CONFIGURATION.md) | All configuration options |
| 📋[Commands Reference](docs/COMMANDS.md)       | Complete command list     |
| 💡[Use Cases](docs/USE-CASES.md)               | Implementation examples   |
| 🔧[API Reference](docs/API.md)                 | Developer API docs        |
| 🔍[Troubleshooting](docs/TROUBLESHOOTING.md)   | Common issues & fixes     |

---

## 🖥️ CLI Commands

```bash
npm run dev          # Start in development mode
npm run build        # Build for production
npm run start        # Start production build
npm run clean        # Clean all cache
npm run clean:auth   # Clean auth data only
npm run status       # Check bot status
npm run config       # Show current configuration
```

---

## 🛡️ Anti-Ban Features

This bot includes multiple anti-ban protections:

```
┌─────────────────────────────────────────────────────────────────┐
│                     ANTI-BAN PROTECTION LAYERS                  │
├─────────────────────────────────────────────────────────────────┤
│  ⏱️  Rate Limiting      │  Per-user, per-group, and global     │
│  ⏳  Response Delays    │  Randomized delays (2-5 seconds)      │
│  ⌨️  Typing Simulation  │  Shows typing indicator               │
│  🔍  Duplicate Detection│  Prevents sending duplicates          │
│  🟢  Presence Updates   │  Periodic online status updates       │
│  📬  Message Queue      │  Spreads messages over time           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Environment Variables

See [docs/CONFIGURATION.md](docs/CONFIGURATION.md) for all available options.

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. 🍴 Fork the repository
2. 🌿 Create your feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit your changes (`git commit -m 'Add amazing feature'`)
4. 📤 Push to the branch (`git push origin feature/amazing-feature`)
5. 🔃 Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Disclaimer

> **Note**: This bot is for educational purposes only. Use responsibly and in accordance with WhatsApp's Terms of Service. The developers are not responsible for any misuse or account bans.

---

<div align="center">

**Built with ❤️ using [Baileys](https://github.com/WhiskeySockets/Baileys)**

[![Star this repo](https://img.shields.io/github/stars/your-username/WA?style=social)](https://github.com/your-username/WA)

</div>
