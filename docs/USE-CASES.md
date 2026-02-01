# Use Cases

This WhatsApp bot framework can be adapted for various use cases. Here are detailed examples and implementation guides.

## Table of Contents

1. [Customer Support Bot](#1-customer-support-bot)
2. [Notification System](#2-notification-system)
3. [Group Management Bot](#3-group-management-bot)
4. [Personal Assistant](#4-personal-assistant)
5. [E-commerce Integration](#5-e-commerce-integration)
6. [Appointment Booking](#6-appointment-booking)
7. [FAQ Bot](#7-faq-bot)
8. [Survey & Feedback Collection](#8-survey--feedback-collection)
9. [Order Tracking](#9-order-tracking)
10. [Educational Bot](#10-educational-bot)

---

## 1. Customer Support Bot

Automate customer support with instant responses and ticket management.

### Features
- Auto-reply to common questions
- Ticket creation and tracking
- Escalation to human agents
- Business hours handling

### Example Commands
```
!support <message>    - Create support ticket
!ticket <id>          - Check ticket status
!faq                  - View frequently asked questions
!hours                - Business hours info
```

### Implementation Ideas
```typescript
// src/commands/support.ts
export const supportCommand: Command = {
  name: 'support',
  description: 'Create a support ticket',
  async execute(ctx) {
    const ticketId = generateTicketId();
    await saveTicket(ctx.sender, ctx.args.join(' '), ticketId);
    await ctx.reply(`Ticket #${ticketId} created. We'll respond within 24 hours.`);
  }
};
```

---

## 2. Notification System

Send automated notifications, alerts, and reminders.

### Use Cases
- Order confirmations
- Shipping updates
- Payment reminders
- Event notifications
- System alerts

### Example Integration
```typescript
// External API integration
import { sendMessage } from './core/client';

async function sendOrderNotification(phoneNumber: string, orderId: string) {
  const jid = `${phoneNumber}@s.whatsapp.net`;
  await sendMessage(jid, {
    text: `Your order #${orderId} has been shipped! Track: example.com/track/${orderId}`
  });
}
```

### Broadcast Feature
```
!broadcast <message>  - Send to all contacts (owner only)
```

---

## 3. Group Management Bot

Manage WhatsApp groups with moderation tools.

### Features
- Welcome new members
- Auto-kick rule violators
- Announce group rules
- Poll creation
- Member statistics

### Example Commands
```
!welcome on/off       - Toggle welcome messages
!rules                - Display group rules
!kick @user           - Remove member (admin)
!warn @user           - Warn a member
!poll <question>      - Create a poll
!stats                - Group statistics
```

### Implementation
```typescript
// Auto-welcome new members
sock.ev.on('group-participants.update', async (update) => {
  if (update.action === 'add') {
    for (const participant of update.participants) {
      await sendMessage(update.id, {
        text: `Welcome @${participant.split('@')[0]}! Please read the group rules.`,
        mentions: [participant]
      });
    }
  }
});
```

---

## 4. Personal Assistant

A personal productivity assistant.

### Features
- Set reminders
- Create to-do lists
- Weather updates
- Calendar integration
- Note taking

### Example Commands
```
!remind <time> <msg>  - Set a reminder
!todo add <task>      - Add to-do item
!todo list            - View to-do list
!weather <city>       - Get weather
!note <text>          - Save a note
```

### Reminder Implementation
```typescript
// src/commands/remind.ts
export const remindCommand: Command = {
  name: 'remind',
  description: 'Set a reminder',
  async execute(ctx) {
    const [time, ...message] = ctx.args;
    const delay = parseTime(time); // e.g., "5m", "1h", "2d"

    setTimeout(async () => {
      await ctx.reply(`Reminder: ${message.join(' ')}`);
    }, delay);

    await ctx.reply(`Reminder set for ${time} from now.`);
  }
};
```

---

## 5. E-commerce Integration

Connect your online store to WhatsApp.

### Features
- Product catalog
- Order placement
- Payment links
- Inventory updates
- Customer queries

### Example Commands
```
!products             - View product catalog
!search <query>       - Search products
!order <product_id>   - Place an order
!cart                 - View shopping cart
!checkout             - Process payment
```

### Integration Example
```typescript
// Connect to your e-commerce API
async function getProducts() {
  const response = await fetch('https://your-store.com/api/products');
  return response.json();
}

export const productsCommand: Command = {
  name: 'products',
  description: 'View available products',
  async execute(ctx) {
    const products = await getProducts();
    const list = products.map(p => `${p.name} - $${p.price}`).join('\n');
    await ctx.reply(`Available Products:\n\n${list}`);
  }
};
```

---

## 6. Appointment Booking

Automate appointment scheduling.

### Features
- View available slots
- Book appointments
- Cancel/reschedule
- Reminders before appointments
- Calendar sync

### Example Commands
```
!slots <date>         - View available slots
!book <date> <time>   - Book appointment
!myappointments       - View your appointments
!cancel <id>          - Cancel appointment
```

### Calendar Integration
```typescript
// Google Calendar integration example
import { google } from 'googleapis';

async function getAvailableSlots(date: string) {
  const calendar = google.calendar({ version: 'v3', auth });
  const events = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date(date).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  });
  // Return available slots
}
```

---

## 7. FAQ Bot

Automated FAQ responses with AI integration.

### Features
- Keyword matching
- Fuzzy search
- AI-powered responses (GPT integration)
- Learning from interactions

### Implementation
```typescript
const faqs = [
  { keywords: ['hours', 'open', 'time'], answer: 'We are open Mon-Fri 9AM-6PM' },
  { keywords: ['price', 'cost', 'fee'], answer: 'View pricing at example.com/pricing' },
  { keywords: ['contact', 'email', 'phone'], answer: 'Email: support@example.com' },
];

function findAnswer(message: string): string | null {
  const words = message.toLowerCase().split(' ');
  for (const faq of faqs) {
    if (faq.keywords.some(k => words.includes(k))) {
      return faq.answer;
    }
  }
  return null;
}
```

---

## 8. Survey & Feedback Collection

Collect customer feedback and conduct surveys.

### Features
- Multi-question surveys
- Rating collection
- Response analytics
- Export to CSV/Excel

### Example Flow
```
Bot: How satisfied are you? (1-5)
User: 4
Bot: What could we improve?
User: Faster delivery
Bot: Thank you for your feedback!
```

### Implementation
```typescript
// Survey state management
const surveyStates = new Map<string, SurveyState>();

async function handleSurveyResponse(sender: string, response: string) {
  const state = surveyStates.get(sender);

  if (state.currentQuestion === 0) {
    state.rating = parseInt(response);
    state.currentQuestion++;
    return 'What could we improve?';
  }

  if (state.currentQuestion === 1) {
    state.feedback = response;
    await saveSurvey(state);
    surveyStates.delete(sender);
    return 'Thank you for your feedback!';
  }
}
```

---

## 9. Order Tracking

Real-time order tracking and updates.

### Features
- Track shipments
- Delivery notifications
- Estimated arrival times
- Delivery confirmation

### Example Commands
```
!track <order_id>     - Track your order
!orders               - View all orders
!status <order_id>    - Order status
```

### Courier Integration
```typescript
// DHL/FedEx/UPS API integration
async function trackShipment(trackingNumber: string) {
  const response = await fetch(
    `https://api.courier.com/track/${trackingNumber}`,
    { headers: { 'API-Key': process.env.COURIER_API_KEY } }
  );
  return response.json();
}
```

---

## 10. Educational Bot

Learning and educational content delivery.

### Features
- Course content delivery
- Quiz and assessments
- Progress tracking
- Certificates
- Study reminders

### Example Commands
```
!courses              - Available courses
!enroll <course>      - Enroll in course
!lesson               - Get next lesson
!quiz                 - Take a quiz
!progress             - View progress
```

### Quiz Implementation
```typescript
const quizzes = {
  javascript: [
    { question: 'What is typeof null?', answer: 'object' },
    { question: 'Is JavaScript single-threaded?', answer: 'yes' },
  ]
};

export const quizCommand: Command = {
  name: 'quiz',
  description: 'Take a quiz',
  async execute(ctx) {
    const topic = ctx.args[0] || 'javascript';
    const quiz = quizzes[topic];
    const question = quiz[Math.floor(Math.random() * quiz.length)];

    await ctx.reply(question.question);
    // Store expected answer in user state
    setUserState(ctx.sender, { expectedAnswer: question.answer });
  }
};
```

---

## Custom Use Case Template

To implement your own use case:

1. **Create command file**: `src/commands/yourcommand.ts`
2. **Define the command**:
```typescript
import { Command, CommandContext } from '../types';

export const yourCommand: Command = {
  name: 'yourcommand',
  aliases: ['yc'],
  description: 'Your command description',
  usage: '!yourcommand <args>',
  cooldown: 5,
  ownerOnly: false,

  async execute(ctx: CommandContext): Promise<void> {
    // Your implementation
    await ctx.reply('Response');
  }
};
```

3. **Register in index**: `src/commands/index.ts`
4. **Restart the bot** or use `!reload`

---

## Integration APIs

Common APIs that can be integrated:

| Service | Use Case | API |
|---------|----------|-----|
| OpenAI | AI responses | `api.openai.com` |
| Google Calendar | Scheduling | `googleapis.com` |
| Stripe | Payments | `api.stripe.com` |
| Twilio | Voice calls | `api.twilio.com` |
| SendGrid | Emails | `api.sendgrid.com` |
| Weather API | Weather | `api.openweathermap.org` |
| Google Maps | Location | `maps.googleapis.com` |

---

## Best Practices

1. **Rate Limiting**: Always respect rate limits to avoid bans
2. **User Consent**: Only message users who have opted in
3. **Data Privacy**: Handle personal data responsibly
4. **Error Handling**: Gracefully handle API failures
5. **Logging**: Log all interactions for debugging
6. **Testing**: Test thoroughly before production use
