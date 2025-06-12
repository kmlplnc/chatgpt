import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeWebSocket } from "./websocket";
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { storage } from './storage';
import { getSession } from './session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root directory
config();

// Log environment variables for debugging
console.log('Environment variables loaded:', {
  NODE_ENV: process.env.NODE_ENV,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
  DB_PASSWORD: process.env.DB_PASSWORD ? '(password is set)' : '(password is not set)'
});

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:3000',
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Cookie parser middleware
app.use(cookieParser());

// Create PostgreSQL session store
const pgSession = connectPgSimple(session);
const store = new pgSession({
  pool: pool,
  tableName: 'session',
  createTableIfMissing: true
});

// Session configuration
app.use(session({
  store: store,
  secret: process.env.SESSION_SECRET || 'dietkem-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Session middleware
app.use(async (req, res, next) => {
  try {
    const token = req.cookies.session;
    if (token) {
      const session = await getSession(token);
      if (session && !session.isExpired) {
        req.session.user = session.user;
      }
    }
    next();
  } catch (error) {
    console.error('Session middleware error:', error);
    next();
  }
});

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
  const wss = initializeWebSocket(server);
  global.wss = wss;

  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV !== 'production') {
    await setupVite(app);
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
