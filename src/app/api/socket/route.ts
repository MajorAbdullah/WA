// API Route for Socket.IO WebSocket upgrade
// This route handles the Socket.IO connection endpoint

import { NextRequest, NextResponse } from 'next/server';
import { socketManager } from '@/lib/socket/server';

// Socket.IO status endpoint
export async function GET(request: NextRequest) {
  const isInitialized = socketManager.isInitialized();
  const botState = socketManager.getBotState();
  const stats = socketManager.getStats();
  const connectedClients = socketManager.getConnectedClientsCount();

  return NextResponse.json({
    status: 'ok',
    socket: {
      initialized: isInitialized,
      connectedClients,
    },
    bot: botState,
    stats,
  });
}

// Note: Socket.IO WebSocket upgrades require a custom server setup in Next.js
// The actual WebSocket handling is done in the custom server (server.ts)
// This route provides status information and can be used for health checks
