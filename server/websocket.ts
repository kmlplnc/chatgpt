import { Server } from 'http';
import { WebSocketServer } from 'ws';
import { db } from './db';
import { notifications } from './schema';
import { eq } from 'drizzle-orm';

interface WebSocketClient extends WebSocket {
  userId?: string;
  isAlive: boolean;
}

export function initializeWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocketClient) => {
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'auth') {
          ws.userId = data.userId;
          
          // Send pending notifications
          if (ws.userId) {
            const pendingNotifications = await db.query.notifications.findMany({
              where: eq(notifications.userId, ws.userId)
            });
            
            ws.send(JSON.stringify({
              type: 'notifications',
              data: pendingNotifications
            }));
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      ws.isAlive = false;
    });
  });

  // Heartbeat interval
  const interval = setInterval(() => {
    wss.clients.forEach((ws: WebSocketClient) => {
      if (!ws.isAlive) {
        return ws.terminate();
      }
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
}

export function broadcastNotification(userId: string, notification: any) {
  const wss = global.wss as WebSocketServer;
  
  wss.clients.forEach((client: WebSocketClient) => {
    if (client.userId === userId) {
      client.send(JSON.stringify({
        type: 'notification',
        data: notification
      }));
    }
  });
} 