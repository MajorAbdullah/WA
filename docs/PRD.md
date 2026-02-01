# Product Requirements Document (PRD)
# WhatsApp Chatbot using Baileys

**Version:** 1.0
**Date:** February 2026
**Status:** Draft

---

## 1. Executive Summary

This document outlines the requirements for building a WhatsApp chatbot using the Baileys library (WhatsApp Web API). The bot will enable automated messaging, command handling, and conversational interactions while implementing best practices to minimize account ban risks.

---

## 2. Problem Statement

Businesses and developers need a way to automate WhatsApp interactions for:
- Customer support automation
- Notification delivery
- Interactive command-based services
- Group management

The official WhatsApp Business API has high barriers (approval process, costs, limitations). Baileys provides an alternative for personal projects, internal tools, and low-volume use cases.

---

## 3. Goals & Objectives

### Primary Goals
1. Create a functional WhatsApp chatbot that can send and receive messages
2. Implement robust session management and auto-reconnection
3. Build with anti-ban best practices baked in
4. Provide extensible command/plugin architecture

### Success Metrics
- Bot maintains stable connection for 24+ hours
- Response latency under 3 seconds
- Zero crashes from unhandled errors
- Configurable rate limiting prevents spam detection

---

## 4. Target Users

| User Type | Use Case |
|-----------|----------|
| Developers | Personal automation projects |
| Small businesses | Low-volume customer notifications |
| Communities | Group management and moderation |
| Hobbyists | Learning and experimentation |

---

## 5. Functional Requirements

### 5.1 Core Features

#### FR-1: Authentication & Connection
- **FR-1.1:** Support QR code authentication (scan with phone)
- **FR-1.2:** Support pairing code authentication (8-digit code)
- **FR-1.3:** Persist session credentials to survive restarts
- **FR-1.4:** Auto-reconnect on connection loss with exponential backoff
- **FR-1.5:** Graceful shutdown handling

#### FR-2: Message Handling
- **FR-2.1:** Receive and process incoming text messages
- **FR-2.2:** Receive and process media messages (images, videos, audio, documents)
- **FR-2.3:** Send text messages to individuals and groups
- **FR-2.4:** Send media messages (images, videos, audio, documents)
- **FR-2.5:** Reply/quote messages
- **FR-2.6:** Support message mentions (@user)
- **FR-2.7:** Handle message reactions

#### FR-3: Command System
- **FR-3.1:** Prefix-based command parsing (e.g., `!help`, `/start`)
- **FR-3.2:** Command aliases support
- **FR-3.3:** Command cooldowns per user
- **FR-3.4:** Permission levels (owner, admin, user)
- **FR-3.5:** Help command with dynamic command listing

#### FR-4: Anti-Ban Protection
- **FR-4.1:** Configurable rate limiting (messages per minute/hour)
- **FR-4.2:** Random delay injection between messages
- **FR-4.3:** Typing indicator simulation before responses
- **FR-4.4:** Message queue with controlled dispatch
- **FR-4.5:** Duplicate message detection and prevention

#### FR-5: Group Features
- **FR-5.1:** Detect group vs private messages
- **FR-5.2:** Group admin detection
- **FR-5.3:** Group metadata retrieval
- **FR-5.4:** Optional: Group-specific command restrictions

### 5.2 Built-in Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `!help` | List available commands | All |
| `!ping` | Check bot responsiveness | All |
| `!info` | Bot information and stats | All |
| `!uptime` | Show bot uptime | All |
| `!owner` | Show owner contact | All |
| `!reload` | Reload commands (hot reload) | Owner |
| `!broadcast` | Send message to all chats | Owner |
| `!ban` | Ban user from bot | Owner |
| `!unban` | Unban user | Owner |

---

## 6. Non-Functional Requirements

### 6.1 Performance
- **NFR-1:** Message processing latency < 500ms
- **NFR-2:** Memory usage < 200MB under normal operation
- **NFR-3:** Support 100+ concurrent conversations

### 6.2 Reliability
- **NFR-4:** Auto-recovery from crashes
- **NFR-5:** Session persistence across restarts
- **NFR-6:** Comprehensive error logging

### 6.3 Security
- **NFR-7:** Credentials stored securely (not in plain text config)
- **NFR-8:** Owner-only commands properly restricted
- **NFR-9:** Input sanitization for all user inputs
- **NFR-10:** No sensitive data in logs

### 6.4 Maintainability
- **NFR-11:** Modular architecture with separation of concerns
- **NFR-12:** TypeScript for type safety
- **NFR-13:** Comprehensive inline documentation
- **NFR-14:** Unit tests for core logic

---

## 7. Technical Architecture

### 7.1 Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20+ |
| Language | TypeScript 5.x |
| WhatsApp Library | @whiskeysockets/baileys |
| Database | SQLite (local) or Redis (production) |
| Logger | Pino |
| Queue | BullMQ (optional, for high volume) |
| Process Manager | PM2 (production) |

### 7.2 Project Structure

```
whatsapp-bot/
├── src/
│   ├── index.ts              # Entry point
│   ├── config/
│   │   └── index.ts          # Configuration management
│   ├── core/
│   │   ├── client.ts         # Baileys socket wrapper
│   │   ├── connection.ts     # Connection management
│   │   └── session.ts        # Session/auth handling
│   ├── handlers/
│   │   ├── message.ts        # Message event handler
│   │   ├── connection.ts     # Connection event handler
│   │   └── group.ts          # Group event handler
│   ├── commands/
│   │   ├── index.ts          # Command loader
│   │   ├── help.ts           # Help command
│   │   ├── ping.ts           # Ping command
│   │   └── ...               # Other commands
│   ├── services/
│   │   ├── queue.ts          # Message queue service
│   │   ├── rateLimit.ts      # Rate limiting service
│   │   └── antiSpam.ts       # Anti-spam protection
│   ├── utils/
│   │   ├── logger.ts         # Logging utility
│   │   ├── helpers.ts        # General helpers
│   │   └── validators.ts     # Input validation
│   └── types/
│       └── index.ts          # TypeScript interfaces
├── data/
│   └── auth/                 # Session credentials
├── logs/                     # Application logs
├── tests/                    # Unit tests
├── .env.example              # Environment template
├── .env                      # Environment variables
├── package.json
├── tsconfig.json
└── README.md
```

### 7.3 Data Flow

```
[WhatsApp] <--WebSocket--> [Baileys Client]
                               |
                               v
                      [Message Handler]
                               |
                               v
                      [Rate Limiter] --> [Queue]
                               |
                               v
                      [Command Parser]
                               |
                               v
                      [Command Executor]
                               |
                               v
                      [Response Builder]
                               |
                               v
                      [Anti-Ban Delay]
                               |
                               v
                      [Send Message]
```

---

## 8. Anti-Ban Strategy

### 8.1 Rate Limiting Rules

| Scope | Limit | Window |
|-------|-------|--------|
| Per user | 5 messages | 1 minute |
| Per group | 10 messages | 1 minute |
| Global | 30 messages | 1 minute |
| Daily | 500 messages | 24 hours |

### 8.2 Behavioral Mimicry

- **Typing simulation:** 50-100ms per character before sending
- **Response delay:** Random 2-5 seconds before responding
- **Read receipts:** Mark as read with natural delay
- **Online presence:** Periodic presence updates

### 8.3 Content Guidelines

- No identical messages to multiple recipients
- Dynamic message templates with variations
- Respect user opt-out requests immediately
- No unsolicited broadcast messages

---

## 9. Configuration

### 9.1 Environment Variables

```env
# Bot Configuration
BOT_PREFIX=!
BOT_NAME=MyBot
OWNER_NUMBER=1234567890

# Anti-Ban Settings
RATE_LIMIT_PER_MINUTE=30
MIN_RESPONSE_DELAY_MS=2000
MAX_RESPONSE_DELAY_MS=5000
TYPING_SPEED_MS=75

# Features
ENABLE_GROUPS=true
ENABLE_AUTO_READ=true
ENABLE_TYPING_INDICATOR=true

# Storage
AUTH_FOLDER=./data/auth
DATABASE_PATH=./data/bot.db

# Logging
LOG_LEVEL=info
```

---

## 10. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Account ban | High | Medium | Implement all anti-ban measures |
| WhatsApp API changes | High | Medium | Pin Baileys version, monitor updates |
| Connection instability | Medium | Medium | Robust reconnection logic |
| Memory leaks | Medium | Low | Proper cleanup, monitoring |
| Credential theft | High | Low | Secure storage, access control |

---

## 11. Out of Scope (v1.0)

- Web dashboard for management
- Multi-account support
- WhatsApp Business API integration
- Payment processing
- AI/LLM integration
- Database clustering
- Kubernetes deployment

---

## 12. Future Considerations (v2.0+)

- Plugin system for third-party commands
- Webhook support for external integrations
- Analytics dashboard
- Multi-language support (i18n)
- AI-powered auto-responses
- Scheduled message support

---

## 13. Acceptance Criteria

1. Bot successfully authenticates via QR code
2. Bot responds to `!ping` with latency information
3. Bot auto-reconnects after network interruption
4. Rate limiting prevents more than configured messages/minute
5. Session persists after bot restart
6. Commands execute only for permitted users
7. No unhandled exceptions crash the bot

---

## 14. Appendix

### A. WhatsApp JID Formats
- Individual: `[country][number]@s.whatsapp.net` (e.g., `14155552671@s.whatsapp.net`)
- Group: `[id]@g.us` (e.g., `120363123456789012@g.us`)

### B. References
- [Baileys GitHub Repository](https://github.com/WhiskeySockets/Baileys)
- [Baileys Documentation](https://baileys.wiki)
- [WhatsApp Terms of Service](https://www.whatsapp.com/legal/terms-of-service)
