import { config } from 'dotenv';
import { resolve } from 'path';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeWebSocket } from "./websocket";
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { storage } from './storage';

// Load environment variables from .env file
config({ path: resolve(process.cwd(), '.env') });

// Log environment variables for debugging
console.log('Environment variables loaded:', {
  NODE_ENV: process.env.NODE_ENV,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? 'Set' : 'Not Set',
  DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not Set'
});

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Vite's default port
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Cookie parser middleware
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    sameSite: 'strict'
  }
}));

// Session middleware
app.use(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.session_token;
  if (token) {
    try {
      const session = await storage.getSession(token);
      if (session && session.expires > new Date()) {
        const user = await storage.getUser(session.user.id.toString());
        if (user) {
          req.session.user = {
            id: user.id,
            username: user.username || '',
            email: user.email || '',
            role: user.role || 'user'
          };
        }
      }
    } catch (error) {
      console.error('Session middleware error:', error);
    }
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

app.post('/test-body', (req, res) => {
  console.log("[TEST-BODY] Gelen istek:", req.body);
  res.json({ body: req.body });
});

app.post('/api/test-log', (req, res) => {
  console.log('==== TEST LOG ====', req.body);
  res.json({ ok: true });
});

(async () => {
  const server = await registerRoutes(app);

  // Initialize WebSocket server
  initializeWebSocket(server);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen(
    port,
    "127.0.0.1",
    () => {
      log(`serving on port ${port}`);
    }
  );
})();
