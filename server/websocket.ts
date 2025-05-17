import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { log } from './vite';

interface Client {
  id: string;
  ws: WebSocket;
  userId: string;
  userType: 'client' | 'dietitian';
}

class NotificationServer {
  private wss: WebSocketServer;
  private clients: Map<string, Client> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket, req) => {
      // URL'den kullanıcı bilgilerini al
      const url = new URL(req.url || '', 'ws://localhost');
      const userId = url.searchParams.get('userId');
      const userType = url.searchParams.get('userType') as 'client' | 'dietitian';

      if (!userId || !userType) {
        ws.close(1008, 'Missing user information');
        return;
      }

      const clientId = Math.random().toString(36).substring(7);
      const client: Client = { id: clientId, ws, userId, userType };
      this.clients.set(clientId, client);

      log(`WebSocket client connected: ${clientId} (${userType})`);

      ws.on('close', () => {
        this.clients.delete(clientId);
        log(`WebSocket client disconnected: ${clientId}`);
      });

      ws.on('error', (error) => {
        log(`WebSocket error for client ${clientId}: ${error.message}`);
        this.clients.delete(clientId);
      });
    });
  }

  // Diyetisyenden danışana mesaj gönderildiğinde çağrılacak
  public notifyClient(clientId: string, message: any) {
    const client = Array.from(this.clients.values()).find(
      (c) => c.userId === clientId && c.userType === 'client'
    );

    if (client) {
      client.ws.send(JSON.stringify({
        type: 'NEW_MESSAGE',
        data: message
      }));
      log(`Notification sent to client ${clientId}`);
    }
  }

  // Tüm bağlı danışanlara bildirim gönder
  public broadcastToClients(message: any) {
    this.clients.forEach((client) => {
      if (client.userType === 'client') {
        client.ws.send(JSON.stringify({
          type: 'BROADCAST',
          data: message
        }));
      }
    });
  }
}

export let notificationServer: NotificationServer;

export function initializeWebSocket(server: Server) {
  notificationServer = new NotificationServer(server);
  return notificationServer;
} 