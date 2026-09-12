import rateLimit from 'express-rate-limit';

/**
 * Strict Rate Limiter for Authentication / Login Endpoints:
 * Max 10 attempts per 15 minutes per IP
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // relaxed for preview environment to prevent accidental lockout
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
  },
  message: {
    error: 'Too many authentication attempts from this IP address. Please wait 15 minutes before trying again.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

/**
 * Rate Limiter for Password Reset Endpoints
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // max 5 password reset requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
  },
  message: {
    error: 'Too many password reset requests. Please check your email or wait 1 hour.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

/**
 * General API Rate Limiter
 */
export const generalApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
  },
  message: {
    error: 'High request rate detected. Please throttle your requests.',
    code: 'API_THROTTLED',
  },
});
