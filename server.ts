// Custom Next.js Server with Socket.IO Support
// This server integrates Socket.IO with the Next.js application

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { getSocketManager } from './src/lib/socket/server';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.IO server
  const socketManager = getSocketManager();
  socketManager.initialize(httpServer);

  // Start the server
  httpServer.listen(port, () => {
    console.log(
      `> Server listening at http://${hostname}:${port} as ${
        dev ? 'development' : process.env.NODE_ENV
      }`
    );
    console.log('> Socket.IO server initialized');
  });

  // Graceful shutdown
  const gracefulShutdown = () => {
    console.log('> Shutting down gracefully...');
    socketManager.shutdown();
    httpServer.close(() => {
      console.log('> Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
});
