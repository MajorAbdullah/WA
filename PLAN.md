# WhatsApp Bot Dashboard - Implementation Plan

## Overview

A modern web dashboard for managing and monitoring WhatsApp bots powered by `@majorabdullah/wa-bot-cli`. This dashboard provides a visual interface to control bot connections, manage users, view analytics, configure settings, and monitor real-time message activity.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | Next.js 14+ (App Router) | Full-stack React framework |
| **Language** | TypeScript | Type safety |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **UI Components** | shadcn/ui | Accessible, customizable components |
| **Icons** | Lucide React | Modern icon library |
| **State Management** | Zustand | Lightweight global state |
| **Real-time** | Socket.io | WebSocket for live updates |
| **Charts** | Recharts | Data visualization |
| **Forms** | React Hook Form + Zod | Form handling & validation |
| **Bot Engine** | @majorabdullah/wa-bot-cli | WhatsApp bot core |
| **Database** | SQLite (better-sqlite3) | Local data persistence |
| **Auth** | NextAuth.js | Dashboard authentication |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Next.js Frontend                         │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │ │
│  │  │Dashboard │ │ Messages │ │  Users   │ │   Settings   │   │ │
│  │  │  Home    │ │   View   │ │  Mgmt    │ │    Panel     │   │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP / WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js API Routes                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │  /api/bot/*  │ │ /api/users/* │ │   /api/messages/*        │ │
│  │  /api/stats/*│ │ /api/config/*│ │   /api/ws (Socket.io)    │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Bot Service Layer                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               @majorabdullah/wa-bot-cli                   │   │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │   │
│  │  │ Client  │ │Connection│ │ Services │ │   Commands   │  │   │
│  │  │ Session │ │ Handlers │ │(RateLimit│ │   Registry   │  │   │
│  │  │         │ │          │ │Queue,etc)│ │              │  │   │
│  │  └─────────┘ └──────────┘ └──────────┘ └──────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │   SQLite     │ │  File-based  │ │    WhatsApp Servers      │ │
│  │  (Messages,  │ │   Session    │ │    (via Baileys)         │ │
│  │   Users,     │ │  (data/auth) │ │                          │ │
│  │   Logs)      │ │              │ │                          │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Features Breakdown

### 1. Authentication & Security
- [ ] Login page with username/password
- [ ] Session management with JWT
- [ ] Role-based access (Admin, Viewer)
- [ ] Protected API routes
- [ ] Secure WebSocket connections

### 2. Dashboard Home
- [ ] Connection status indicator (Connected/Disconnected/Connecting)
- [ ] QR code display for authentication
- [ ] Pairing code input option
- [ ] Quick stats cards:
  - Messages sent/received today
  - Active users count
  - Commands executed
  - Uptime
- [ ] Recent activity feed
- [ ] System health indicators

### 3. Messages View
- [ ] Real-time message feed (incoming/outgoing)
- [ ] Message search and filter
- [ ] Send message form:
  - Recipient selector (contacts/groups)
  - Message input with emoji picker
  - Media attachment support
- [ ] Message history by contact/group
- [ ] Export message logs

### 4. Users Management
- [ ] User list with search/filter
- [ ] User details view:
  - Phone number
  - First seen / Last seen
  - Message count
  - Command usage
  - Ban status
- [ ] Ban/Unban actions
- [ ] User activity timeline
- [ ] Bulk actions (ban multiple, export)

### 5. Groups Management
- [ ] List all groups bot is in
- [ ] Group details:
  - Name, description, member count
  - Admin list
  - Bot permissions
- [ ] Leave group action
- [ ] Group message history
- [ ] Group-specific settings

### 6. Commands Management
- [ ] List all available commands
- [ ] Command usage statistics
- [ ] Enable/Disable commands
- [ ] Command cooldown configuration
- [ ] Custom command creator (future)

### 7. Analytics & Statistics
- [ ] Message volume charts (hourly/daily/weekly)
- [ ] Command usage pie chart
- [ ] User growth timeline
- [ ] Rate limit hit frequency
- [ ] Queue status visualization
- [ ] Response time metrics
- [ ] Export reports (CSV/PDF)

### 8. Broadcast Center
- [ ] Create new broadcast
- [ ] Select recipients (all users, specific groups, filtered)
- [ ] Schedule broadcasts
- [ ] Broadcast history
- [ ] Delivery status tracking

### 9. Settings Panel
- [ ] Bot Configuration:
  - Bot name
  - Command prefix
  - Owner number
- [ ] Rate Limiting:
  - Per-user limit
  - Per-group limit
  - Global limit
- [ ] Response Settings:
  - Min/Max delay
  - Typing speed
  - Auto-read toggle
- [ ] Features Toggle:
  - Enable groups
  - Typing indicator
  - Anti-spam
- [ ] Session Management:
  - View session info
  - Logout/Reset session
  - Backup session

### 10. Logs Viewer
- [ ] Real-time log streaming
- [ ] Filter by log level (info, warn, error)
- [ ] Search logs
- [ ] Download log files
- [ ] Log retention settings

### 11. Notifications
- [ ] In-app notifications for:
  - New messages
  - Connection status changes
  - Errors
  - Rate limit warnings
- [ ] Browser push notifications (optional)
- [ ] Email alerts for critical events (optional)

---

## Page Structure

```
/                       → Dashboard Home (overview, stats, QR code)
/messages              → Message Center (live feed, send messages)
/messages/[id]         → Conversation view with specific contact/group
/users                 → User Management (list, search, actions)
/users/[id]            → User Detail page
/groups                → Groups Management
/groups/[id]           → Group Detail page
/commands              → Commands Management
/analytics             → Analytics & Charts
/broadcast             → Broadcast Center
/broadcast/new         → Create new broadcast
/settings              → Settings Panel
/settings/bot          → Bot configuration
/settings/rate-limit   → Rate limiting config
/settings/session      → Session management
/logs                  → Log Viewer
/login                 → Authentication page
```

---

## API Endpoints

### Bot Control
```
GET    /api/bot/status          → Get connection status
POST   /api/bot/connect         → Initiate connection
POST   /api/bot/disconnect      → Disconnect bot
GET    /api/bot/qr              → Get current QR code
POST   /api/bot/pair            → Request pairing code
GET    /api/bot/stats           → Get bot statistics
```

### Messages
```
GET    /api/messages            → Get message history (paginated)
GET    /api/messages/:jid       → Get messages for specific chat
POST   /api/messages/send       → Send a message
DELETE /api/messages/:id        → Delete a message
GET    /api/messages/search     → Search messages
```

### Users
```
GET    /api/users               → List all users (paginated)
GET    /api/users/:id           → Get user details
POST   /api/users/:id/ban       → Ban a user
POST   /api/users/:id/unban     → Unban a user
GET    /api/users/banned        → List banned users
DELETE /api/users/:id           → Remove user data
```

### Groups
```
GET    /api/groups              → List all groups
GET    /api/groups/:id          → Get group details
GET    /api/groups/:id/members  → Get group members
POST   /api/groups/:id/leave    → Leave a group
```

### Commands
```
GET    /api/commands            → List all commands
GET    /api/commands/:name      → Get command details
PATCH  /api/commands/:name      → Update command settings
GET    /api/commands/stats      → Command usage statistics
```

### Configuration
```
GET    /api/config              → Get current configuration
PATCH  /api/config              → Update configuration
POST   /api/config/reset        → Reset to defaults
```

### Broadcast
```
GET    /api/broadcast           → List broadcasts
POST   /api/broadcast           → Create new broadcast
GET    /api/broadcast/:id       → Get broadcast status
DELETE /api/broadcast/:id       → Cancel broadcast
```

### WebSocket Events
```
connection:status      → Bot connection state changes
message:incoming       → New message received
message:outgoing       → Message sent
message:status         → Message delivery status
user:update            → User data changed
stats:update           → Statistics updated
log:entry              → New log entry
```

---

## Database Schema (SQLite)

### messages
```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  jid TEXT NOT NULL,
  from_me BOOLEAN NOT NULL,
  content TEXT,
  type TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  status TEXT,
  media_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_messages_jid ON messages(jid);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
```

### users
```sql
CREATE TABLE users (
  jid TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT,
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  message_count INTEGER DEFAULT 0,
  command_count INTEGER DEFAULT 0,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### broadcasts
```sql
CREATE TABLE broadcasts (
  id TEXT PRIMARY KEY,
  message TEXT NOT NULL,
  recipients TEXT NOT NULL, -- JSON array
  scheduled_at INTEGER,
  status TEXT NOT NULL, -- pending, in_progress, completed, cancelled
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### command_logs
```sql
CREATE TABLE command_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  command TEXT NOT NULL,
  user_jid TEXT NOT NULL,
  args TEXT,
  success BOOLEAN NOT NULL,
  response_time INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_command_logs_command ON command_logs(command);
CREATE INDEX idx_command_logs_created ON command_logs(created_at);
```

### settings
```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## File Structure

```
wa-bot-dashboard/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   │   ├── page.tsx              # Home/Overview
│   │   │   ├── messages/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── users/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── groups/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── commands/
│   │   │   │   └── page.tsx
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx
│   │   │   ├── broadcast/
│   │   │   │   ├── page.tsx
│   │   │   │   └── new/page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── bot/page.tsx
│   │   │   │   ├── rate-limit/page.tsx
│   │   │   │   └── session/page.tsx
│   │   │   └── logs/
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   ├── bot/
│   │   │   │   ├── status/route.ts
│   │   │   │   ├── connect/route.ts
│   │   │   │   ├── disconnect/route.ts
│   │   │   │   ├── qr/route.ts
│   │   │   │   ├── pair/route.ts
│   │   │   │   └── stats/route.ts
│   │   │   ├── messages/
│   │   │   │   ├── route.ts
│   │   │   │   ├── send/route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   ├── users/
│   │   │   │   ├── route.ts
│   │   │   │   ├── [id]/route.ts
│   │   │   │   ├── [id]/ban/route.ts
│   │   │   │   └── banned/route.ts
│   │   │   ├── groups/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   ├── commands/
│   │   │   │   ├── route.ts
│   │   │   │   └── [name]/route.ts
│   │   │   ├── broadcast/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   ├── config/
│   │   │   │   └── route.ts
│   │   │   └── socket/
│   │   │       └── route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── nav-item.tsx
│   │   │   └── user-menu.tsx
│   │   ├── dashboard/
│   │   │   ├── stats-card.tsx
│   │   │   ├── connection-status.tsx
│   │   │   ├── qr-display.tsx
│   │   │   ├── activity-feed.tsx
│   │   │   └── quick-actions.tsx
│   │   ├── messages/
│   │   │   ├── message-list.tsx
│   │   │   ├── message-item.tsx
│   │   │   ├── message-input.tsx
│   │   │   ├── chat-list.tsx
│   │   │   └── emoji-picker.tsx
│   │   ├── users/
│   │   │   ├── user-table.tsx
│   │   │   ├── user-card.tsx
│   │   │   └── ban-dialog.tsx
│   │   ├── analytics/
│   │   │   ├── message-chart.tsx
│   │   │   ├── command-pie.tsx
│   │   │   └── stats-overview.tsx
│   │   └── shared/
│   │       ├── loading.tsx
│   │       ├── error.tsx
│   │       ├── empty-state.tsx
│   │       └── pagination.tsx
│   │
│   ├── lib/
│   │   ├── bot/
│   │   │   ├── index.ts              # Bot singleton manager
│   │   │   ├── events.ts             # Event emitter for real-time
│   │   │   └── adapter.ts            # Adapter for wa-bot-cli
│   │   ├── db/
│   │   │   ├── index.ts              # Database connection
│   │   │   ├── schema.ts             # Schema definitions
│   │   │   └── queries.ts            # Query helpers
│   │   ├── socket/
│   │   │   ├── server.ts             # Socket.io server setup
│   │   │   └── events.ts             # Event definitions
│   │   ├── auth/
│   │   │   └── index.ts              # Auth utilities
│   │   └── utils/
│   │       ├── format.ts             # Formatting helpers
│   │       ├── date.ts               # Date utilities
│   │       └── validation.ts         # Zod schemas
│   │
│   ├── hooks/
│   │   ├── use-bot-status.ts
│   │   ├── use-messages.ts
│   │   ├── use-users.ts
│   │   ├── use-socket.ts
│   │   └── use-stats.ts
│   │
│   ├── stores/
│   │   ├── bot-store.ts              # Bot state
│   │   ├── message-store.ts          # Messages state
│   │   └── ui-store.ts               # UI state (sidebar, modals)
│   │
│   └── types/
│       ├── bot.ts
│       ├── message.ts
│       ├── user.ts
│       └── api.ts
│
├── public/
│   ├── logo.svg
│   └── favicon.ico
│
├── data/
│   ├── auth/                         # Bot session (from wa-bot-cli)
│   └── dashboard.db                  # SQLite database
│
├── .env.example
├── .env.local
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [x] Create dashboard branch
- [x] Create implementation plan
- [ ] Initialize Next.js project
- [ ] Setup Tailwind CSS + shadcn/ui
- [ ] Create basic layout (sidebar, header)
- [ ] Setup SQLite database
- [ ] Integrate @majorabdullah/wa-bot-cli package
- [ ] Create bot adapter/service layer
- [ ] Implement WebSocket server

### Phase 2: Core Dashboard (Week 2)
- [ ] Dashboard home page
  - [ ] Connection status component
  - [ ] QR code display
  - [ ] Stats cards
  - [ ] Activity feed
- [ ] Bot control API endpoints
- [ ] Real-time connection updates

### Phase 3: Messages (Week 3)
- [ ] Messages page with live feed
- [ ] Chat list sidebar
- [ ] Conversation view
- [ ] Send message functionality
- [ ] Message search
- [ ] Message persistence to database

### Phase 4: Users & Groups (Week 4)
- [ ] Users list page
- [ ] User detail page
- [ ] Ban/Unban functionality
- [ ] Groups list page
- [ ] Group detail page
- [ ] User/Group data persistence

### Phase 5: Analytics & Commands (Week 5)
- [ ] Analytics dashboard
- [ ] Message volume charts
- [ ] Command usage statistics
- [ ] Commands management page
- [ ] Command enable/disable

### Phase 6: Settings & Broadcast (Week 6)
- [ ] Settings panel (all sections)
- [ ] Configuration API
- [ ] Broadcast center
- [ ] Scheduled broadcasts
- [ ] Logs viewer

### Phase 7: Polish & Deploy (Week 7)
- [ ] Authentication (login page)
- [ ] Error handling improvements
- [ ] Loading states
- [ ] Responsive design fixes
- [ ] Documentation
- [ ] Docker support
- [ ] Production deployment guide

---

## Environment Variables

```env
# App
NEXT_PUBLIC_APP_NAME="WhatsApp Bot Dashboard"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Authentication
AUTH_SECRET="your-secret-key-here"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="secure-password"

# Bot Configuration (passed to wa-bot-cli)
BOT_NAME="WhatsAppBot"
BOT_PREFIX="!"
OWNER_NUMBER="1234567890"

# Database
DATABASE_PATH="./data/dashboard.db"

# Session
AUTH_FOLDER="./data/auth"
```

---

## Getting Started (After Implementation)

```bash
# Clone the repository
git clone https://github.com/MajorAbdullah/WA.git
cd WA
git checkout dashboard

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your settings

# Initialize database
npm run db:init

# Start development server
npm run dev

# Open http://localhost:3000
```

---

## Future Enhancements

1. **Multi-Bot Support**: Manage multiple WhatsApp accounts
2. **Custom Commands Builder**: Visual command creator
3. **Webhook Integration**: External service notifications
4. **Auto-Reply Rules**: Configurable automatic responses
5. **Contact Sync**: Import/Export contacts
6. **Message Templates**: Reusable message templates
7. **API Keys**: External API access for integrations
8. **Audit Log**: Track all dashboard actions
9. **Backup/Restore**: Full data backup functionality
10. **Mobile App**: React Native companion app

---

## Notes

- The dashboard uses `@majorabdullah/wa-bot-cli` as a dependency, not forking or copying code
- All bot functionality comes from the CLI package
- Dashboard adds persistence, real-time updates, and visual interface
- SQLite is used for simplicity; can be swapped for PostgreSQL for production
- WebSocket provides real-time updates without polling
