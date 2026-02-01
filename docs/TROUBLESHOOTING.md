# Troubleshooting Guide

Solutions for common issues with the WhatsApp Bot.

## Table of Contents

1. [Connection Issues](#connection-issues)
2. [Authentication Issues](#authentication-issues)
3. [Message Issues](#message-issues)
4. [Performance Issues](#performance-issues)
5. [Command Issues](#command-issues)
6. [Error Codes](#error-codes)

---

## Connection Issues

### Bot won't connect

**Symptoms**: Bot starts but doesn't connect to WhatsApp.

**Solutions**:
1. Check internet connection
2. Clear auth folder: `npm run clean:auth`
3. Wait and retry (WhatsApp may be rate limiting)
4. Check if WhatsApp servers are down

```bash
# Clear auth and restart
npm run clean:auth
npm run dev
```

### Connection keeps dropping

**Symptoms**: Bot connects but disconnects frequently.

**Solutions**:
1. Check for multiple bot instances:
```bash
ps aux | grep "ts-node"
pkill -f "ts-node src/index.ts"  # Kill all instances
npm run dev  # Start fresh
```

2. Check Linked Devices on phone - remove duplicates
3. Close WhatsApp Web in all browsers
4. Increase reconnection delay in config

### "connectionReplaced" error (440)

**Cause**: Another WhatsApp Web session is active.

**Solutions**:
1. Close all WhatsApp Web tabs
2. Check Linked Devices and remove old sessions
3. Kill duplicate bot processes:
```bash
pkill -f "nodemon"
pkill -f "ts-node"
npm run dev
```

### "loggedOut" error (401)

**Cause**: Session was invalidated.

**Solutions**:
1. Clear auth folder: `npm run clean:auth`
2. Restart bot and scan QR/enter pairing code again
3. Check if account was banned

---

## Authentication Issues

### QR code not showing

**Solutions**:
1. Ensure terminal supports Unicode
2. Try a different terminal
3. Check logs for errors
4. Use pairing code instead:
```env
USE_PAIRING_CODE=true
PHONE_NUMBER=your_number
```

### Pairing code not working

**Solutions**:
1. Ensure phone number format is correct (no + or spaces)
2. Enter code quickly (expires in ~60 seconds)
3. Make sure no other sessions are interfering
4. Clear auth and try again:
```bash
rm -rf data/auth
npm run dev
```

### "restartRequired" error (515)

**Cause**: WhatsApp requires reconnection.

**Solution**: Bot should auto-reconnect. If not, restart:
```bash
npm run dev
```

---

## Message Issues

### Bot not responding to commands

**Check list**:
1. Message starts with correct prefix (default: `!`)
2. User is not banned: check `!stats`
3. User hasn't exceeded rate limit
4. Bot is connected: check logs

**Debug**:
```typescript
// Add to message handler
console.log('Received:', text);
console.log('Is command:', isCommand);
console.log('Command:', command);
```

### Messages not sending

**Solutions**:
1. Check rate limits in logs
2. Verify JID format: `number@s.whatsapp.net`
3. Check queue status: `!stats`
4. Reduce message rate in config:
```env
RATE_LIMIT_PER_MINUTE=15
```

### Duplicate messages

**Cause**: Message retry or queue issues.

**Solutions**:
1. Enable duplicate detection:
```env
ENABLE_DUPLICATE_DETECTION=true
```

2. Increase similarity threshold:
```env
SIMILARITY_THRESHOLD=0.9
```

### Messages delayed

**Cause**: Anti-ban delays or queue backlog.

**Solutions**:
1. Reduce delays (increases ban risk):
```env
MIN_RESPONSE_DELAY_MS=500
MAX_RESPONSE_DELAY_MS=1500
```

2. Increase rate limits:
```env
RATE_LIMIT_PER_MINUTE=60
```

---

## Performance Issues

### High memory usage

**Solutions**:
1. Restart bot periodically
2. Clear logs: `npm run clean:logs`
3. Disable full history sync (already disabled by default)
4. Reduce queue size

### Slow responses

**Solutions**:
1. Reduce response delays in config
2. Disable typing indicator:
```env
ENABLE_TYPING_INDICATOR=false
```
3. Check for external API bottlenecks

### Bot crashes

**Solutions**:
1. Check logs for error details
2. Increase Node.js memory:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run dev
```
3. Add crash recovery:
```bash
# Use PM2 for production
pm2 start npm --name "wa-bot" -- run start
```

---

## Command Issues

### Command not recognized

**Check**:
1. Prefix is correct
2. Command is registered in `src/commands/index.ts`
3. Run `!reload` to refresh commands

### Owner commands not working

**Check**:
1. `OWNER_NUMBER` in `.env` matches your number
2. Number format is correct (with country code, no +)
3. You're messaging from the owner number

### Cooldown too aggressive

**Solution**: Adjust cooldown in command definition:
```typescript
cooldown: 3, // seconds
```

---

## Error Codes

| Code | Name | Description | Solution |
|------|------|-------------|----------|
| 401 | loggedOut | Session invalidated | Re-authenticate |
| 403 | forbidden | Action not allowed | Check permissions |
| 408 | timedOut | Request timed out | Retry |
| 411 | multideviceMismatch | Multi-device issue | Re-authenticate |
| 428 | preconditionRequired | Connection not ready | Wait and retry |
| 440 | connectionReplaced | Another session active | Close other sessions |
| 500 | internalError | WhatsApp server error | Retry later |
| 515 | restartRequired | Restart needed | Auto-reconnect |

---

## Logs

### Enable debug logs

```env
LOG_LEVEL=debug
```

### Log locations

- Console output: Real-time logs
- File logs: `./logs/` directory

### Reading logs

```bash
# View recent logs
tail -f logs/bot.log

# Search for errors
grep "ERROR" logs/bot.log

# View specific module
grep "connection" logs/bot.log
```

---

## Reset Everything

If all else fails, complete reset:

```bash
# Stop all processes
pkill -f "nodemon"
pkill -f "ts-node"

# Clean everything
rm -rf data/auth
rm -rf logs/*
rm -rf dist

# Reinstall dependencies
rm -rf node_modules
npm install

# Start fresh
npm run dev
```

---

## Getting Help

1. Check this troubleshooting guide
2. Review logs for error messages
3. Search existing issues
4. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Configuration (redact sensitive info)
   - Node.js version
   - OS information
