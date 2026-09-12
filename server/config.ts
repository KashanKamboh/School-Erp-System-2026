import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'edupulse-super-secret-jwt-key-2026-production-grade',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'edupulse-super-secret-refresh-key-2026-production-grade',
  jwtExpiresIn: '2h', // Short-lived access token
  jwtRefreshExpiresIn: '7d', // Secure refresh token
  cookieSecret: process.env.COOKIE_SECRET || 'edupulse-cookie-signing-secret-2026',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  sessionTimeoutMinutes: 30, // Idle session timeout
  maxFailedLogins: 5,
  lockoutDurationMinutes: 15,
};
