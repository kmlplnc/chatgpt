import { WebSocketServer } from 'ws';

declare global {
  namespace Express {
    interface Session {
      user?: {
        id: string;
        username: string;
        email: string;
        role: string;
      };
    }
  }

  var wss: WebSocketServer;
} 