import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from '../server/config.js';
import authRoutes from '../server/routes/auth.routes.js';
import usersRoutes from '../server/routes/users.routes.js';
import studentsRoutes from '../server/routes/students.routes.js';
import erpRoutes from '../server/routes/erp.routes.js';
import setupRoutes from '../server/routes/setup.routes.js';
import { generalApiLimiter } from '../server/middleware/rateLimit.js';
import { initSQLiteSchema } from '../server/db.js';

export interface EmbeddedServerInfo {
  server: http.Server;
  port: number;
  url: string;
}

export async function startEmbeddedServer(userDataPath: string, distDir: string): Promise<EmbeddedServerInfo> {
  // Ensure ELECTRON_USER_DATA is set for server/db.js and server/store.js
  process.env.ELECTRON_USER_DATA = userDataPath;

  // Initialize SQLite Database Schema & Tables
  try {
    initSQLiteSchema();
    console.log('[Embedded Server] SQLite schema initialized at:', userDataPath);
  } catch (dbErr) {
    console.error('[Embedded Server] Database schema initialization warning:', dbErr);
  }

  const app = express();
  app.set('trust proxy', 1);

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false,
      frameguard: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS
  app.use(
    cors({
      origin: (origin, callback) => callback(null, true),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Parsers
  app.use(cookieParser(config.cookieSecret));
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // API Rate Limiting
  app.use('/api', generalApiLimiter);

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'EduPulse School ERP Desktop Embedded Server',
      environment: 'desktop-offline',
      userDataPath,
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API routes
  app.use('/api/setup', setupRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/students', studentsRoutes);
  app.use('/api/erp', erpRoutes);

  // Generic 404 for unmatched /api routes
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      error: `API endpoint '${req.originalUrl}' does not exist.`,
      code: 'NOT_FOUND',
    });
  });

  // Static files from dist
  if (fs.existsSync(distDir)) {
    console.log('[Embedded Server] Static files path:', distDir);
    app.use(express.static(distDir));
    app.get('*', (req: Request, res: Response) => {
      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('EduPulse index.html not found at: ' + indexPath);
      }
    });
  } else {
    console.warn('[Embedded Server] distDir does not exist:', distDir);
  }

  // Global error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[Embedded Server Error]', err);
    res.status(err.status || 500).json({
      error: err.message || 'An unexpected server error occurred.',
      code: err.code || 'INTERNAL_ERROR',
    });
  });

  // Start listening on 127.0.0.1
  // First attempt port 3000; fallback to available random port (port 0) if busy
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);

    const tryListen = (targetPort: number) => {
      server.removeAllListeners('error');
      server.removeAllListeners('listening');

      server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE' && targetPort === 3000) {
          console.warn('[Embedded Server] Port 3000 in use, selecting available random port...');
          tryListen(0);
        } else {
          console.error('[Embedded Server] Listen failed:', err);
          reject(err);
        }
      });

      server.on('listening', () => {
        const addr = server.address();
        const port = typeof addr === 'object' && addr ? addr.port : targetPort;
        const url = `http://127.0.0.1:${port}`;
        console.log(`[Embedded Server] Running and ready at ${url}`);
        resolve({ server, port, url });
      });

      server.listen(targetPort, '127.0.0.1');
    };

    tryListen(3000);
  });
}
