import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './server/config.js';
import authRoutes from './server/routes/auth.routes.js';
import usersRoutes from './server/routes/users.routes.js';
import studentsRoutes from './server/routes/students.routes.js';
import erpRoutes from './server/routes/erp.routes.js';
import setupRoutes from './server/routes/setup.routes.js';
import { generalApiLimiter } from './server/middleware/rateLimit.js';
import { initSQLiteSchema } from './server/db.js';

async function startServer() {
  // Initialize SQLite Database Schema & Tables
  initSQLiteSchema();

  const app = express();
  const PORT = 3000;

  // Configure reverse proxy trust for Cloud Run & Nginx environments
  app.set('trust proxy', 1);

  // 1. Security Headers via Helmet (configured to allow AI Studio iframe preview and cross-origin tab embedding)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      frameguard: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // In local/container preview, allow origin with credentials
        callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // 3. Cookie Parser and Body Parsers
  app.use(cookieParser(config.cookieSecret));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 4. API Rate Limiting
  app.use('/api', generalApiLimiter);

  // 5. Health Check API
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'EduPulse School ERP Enterprise Security Gateway',
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
    });
  });

  // 6. Windows Offline ERP Application Download Endpoints (Public)
  app.get('/api/download/windows-portable', (req: Request, res: Response) => {
    const filePath = path.join(process.cwd(), 'release', 'EduPulse-School-ERP-Windows-x64-Portable.zip');
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="EduPulse-School-ERP-Windows-x64-Portable.zip"');
      return res.sendFile(filePath);
    }
    return res.status(404).json({ error: 'Windows portable zip package not found. Please build first.' });
  });

  app.get('/api/download/windows-exe', (req: Request, res: Response) => {
    const filePath = path.join(process.cwd(), 'release', 'win-unpacked', 'EduPulse School ERP.exe');
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/vnd.microsoft.portable-executable');
      res.setHeader('Content-Disposition', 'attachment; filename="EduPulse School ERP.exe"');
      return res.sendFile(filePath);
    }
    return res.status(404).json({ error: 'EduPulse School ERP.exe not found.' });
  });

  app.get('/api/download/status', (req: Request, res: Response) => {
    const zipPath = path.join(process.cwd(), 'release', 'EduPulse-School-ERP-Windows-x64-Portable.zip');
    const exePath = path.join(process.cwd(), 'release', 'win-unpacked', 'EduPulse School ERP.exe');
    const hasZip = fs.existsSync(zipPath);
    const hasExe = fs.existsSync(exePath);
    res.json({
      hasZip,
      hasExe,
      zipFilename: 'EduPulse-School-ERP-Windows-x64-Portable.zip',
      exeFilename: 'EduPulse School ERP.exe',
      zipSizeMb: hasZip ? (fs.statSync(zipPath).size / (1024 * 1024)).toFixed(1) : null,
      exeSizeMb: hasExe ? (fs.statSync(exePath).size / (1024 * 1024)).toFixed(1) : null,
      zipDownloadUrl: '/api/download/windows-portable',
      exeDownloadUrl: '/api/download/windows-exe',
    });
  });

  // 6.1 Mount Secure API Routes
  app.use('/api/setup', setupRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/students', studentsRoutes);
  app.use('/api/erp', erpRoutes);

  // 7. Generic API 404 handler for unmatched /api requests (before Vite SPA fallback)
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      error: `API endpoint '${req.originalUrl}' does not exist or has been removed.`,
      code: 'NOT_FOUND',
    });
  });

  // 8. Vite Middleware for SPA Frontend Development / Static Serving in Production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 9. Global Error Handler (Production-safe, sanitizes stack traces)
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(err.status || 500).json({
      error: 'An unexpected security or server error occurred.',
      code: err.code || 'INTERNAL_ERROR',
      message: config.nodeEnv === 'development' ? err.message : undefined,
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
