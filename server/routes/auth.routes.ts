import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { serverStore, ServerUser, ActiveSession } from '../store.js';
import { hashPassword, verifyPassword, validatePasswordPolicy, sanitizeUserOutput } from '../security.js';
import { loginRateLimiter, passwordResetRateLimiter } from '../middleware/rateLimit.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { isSystemSetupCompleted } from '../db.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Production-ready login handler with rate limiting, brute force lockout, and secure cookies
 */
router.post('/login', loginRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, rememberMe } = req.body;

    // Validate inputs
    if (!email || !password) {
      res.status(400).json({
        error: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';
    const normalizedIdentifier = email.toLowerCase().trim();

    // Check brute-force lockout status for this email or IP
    const lockStatus = serverStore.isLockedOut(normalizedIdentifier);
    if (lockStatus.locked) {
      serverStore.recordAuditLog({
        userId: 'anonymous',
        userName: normalizedIdentifier,
        userRole: 'Unknown',
        action: 'LOGIN_BLOCKED_LOCKOUT',
        module: 'Auth',
        status: 'Warning',
        ipAddress: clientIp,
        details: `Login attempt blocked due to excessive failed attempts. Account locked for ${lockStatus.lockTimeRemainingMinutes} more minutes.`,
      });

      res.status(429).json({
        error: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${lockStatus.lockTimeRemainingMinutes} minutes.`,
        code: 'ACCOUNT_LOCKED',
      });
      return;
    }

    // 1. Direct user lookup by email, username or name
    const user = serverStore.users.find(
      (u) =>
        u.email.toLowerCase() === normalizedIdentifier ||
        u.email.toLowerCase().split('@')[0] === normalizedIdentifier ||
        u.name.toLowerCase() === normalizedIdentifier
    );

    if (!user) {
      // Track failed attempt for rate limiting / lockout
      const attemptInfo = serverStore.trackFailedLogin(normalizedIdentifier);
      serverStore.recordAuditLog({
        userId: 'anonymous',
        userName: normalizedIdentifier,
        userRole: 'Unknown',
        action: 'FAILED_LOGIN_UNKNOWN_USER',
        module: 'Auth',
        status: 'Failed',
        ipAddress: clientIp,
        details: `Failed login attempt for non-existent user '${normalizedIdentifier}'. Remaining attempts: ${attemptInfo.remainingAttempts}`,
      });

      res.status(401).json({
        error: 'Invalid username or password.',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    if (user.status === 'Inactive') {
      serverStore.recordAuditLog({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'LOGIN_BLOCKED_INACTIVE_ACCOUNT',
        module: 'Auth',
        status: 'Failed',
        ipAddress: clientIp,
        details: `Inactive user '${user.email}' attempted to log in.`,
      });

      res.status(403).json({
        error: 'Your account has been deactivated. Please contact your school administrator.',
        code: 'ACCOUNT_INACTIVE',
      });
      return;
    }

    if (user.status === 'Pending') {
      serverStore.recordAuditLog({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'LOGIN_BLOCKED_PENDING_APPROVAL',
        module: 'Auth',
        status: 'Warning',
        ipAddress: clientIp,
        details: `Pending registrant '${user.email}' (${user.role}) attempted to log in prior to Super Admin approval.`,
      });

      res.status(403).json({
        error: 'Your account registration is currently PENDING approval by the Super Admin. You will be able to log in once your institutional request is approved.',
        code: 'ACCOUNT_PENDING_APPROVAL',
        status: 'Pending',
        submittedAt: user.submittedAt,
      });
      return;
    }

    if (user.status === 'Rejected') {
      serverStore.recordAuditLog({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'LOGIN_BLOCKED_REJECTED_ACCOUNT',
        module: 'Auth',
        status: 'Failed',
        ipAddress: clientIp,
        details: `Rejected registrant '${user.email}' attempted to log in. Rejection reason: ${user.rejectionReason || 'Institutional criteria not met'}`,
      });

      res.status(403).json({
        error: `Your account registration was REJECTED by the institutional administrator.${user.rejectionReason ? ` Reason: ${user.rejectionReason}` : ''}`,
        code: 'ACCOUNT_REJECTED',
        status: 'Rejected',
        rejectionReason: user.rejectionReason,
      });
      return;
    }

    if (user.status === 'Suspended') {
      serverStore.recordAuditLog({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'LOGIN_ATTEMPT_SUSPENDED_ACCOUNT',
        module: 'Auth',
        status: 'Failed',
        ipAddress: clientIp,
        details: `Suspended user '${user.email}' attempted to log in.`,
      });

      res.status(403).json({
        error: 'This account has been suspended by institutional administration. Please contact your school administrator.',
        code: 'ACCOUNT_SUSPENDED',
      });
      return;
    }

    // Verify password strictly against stored bcrypt hash
    let isPasswordValid = false;
    try {
      isPasswordValid = await verifyPassword(password, user.passwordHash);
    } catch (verifyErr) {
      console.error('[Auth] Password verification error:', verifyErr);
      isPasswordValid = false;
    }

    if (!isPasswordValid) {
      const attemptInfo = serverStore.trackFailedLogin(normalizedIdentifier);

      serverStore.recordAuditLog({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'FAILED_LOGIN_BAD_PASSWORD',
        module: 'Auth',
        status: 'Failed',
        ipAddress: clientIp,
        details: `Invalid password entered for user '${user.email}'. Remaining attempts: ${attemptInfo.remainingAttempts}`,
      });

      if (attemptInfo.locked) {
        res.status(429).json({
          error: `Too many failed login attempts. Your account has been temporarily locked for ${attemptInfo.lockTimeRemainingMinutes} minutes for security.`,
          code: 'ACCOUNT_LOCKED',
        });
        return;
      }

      res.status(401).json({
        error: 'Invalid username or password.',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    // Password verified! Clear failed login count
    serverStore.clearFailedLogin(normalizedIdentifier);

    // Create session in server store
    const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const expiresMs = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;

    const newSession: ActiveSession = {
      sessionId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      role: user.role,
      ipAddress: clientIp,
      userAgent: userAgent.substring(0, 80),
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      expiresAt: Date.now() + expiresMs,
      isRevoked: false,
    };
    serverStore.activeSessions.set(sessionId, newSession);

    // Update user's last login
    user.lastLogin = new Date().toISOString().replace('T', ' ').substring(0, 19);
    user.lastIp = clientIp;

    // Issue JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        sessionId: sessionId,
        studentId: user.studentId,
        parentChildIds: user.parentChildIds,
      },
      config.jwtSecret,
      { expiresIn: rememberMe ? '7d' : '2h' }
    );

    // Set secure HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: expiresMs,
    });

    // Record successful audit log
    serverStore.recordAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'USER_LOGIN',
      module: 'Auth',
      status: 'Success',
      ipAddress: clientIp,
      details: `User successfully authenticated as '${user.role}' with session '${sessionId}'`,
    });

    res.json({
      success: true,
      token,
      sessionId,
      user: sanitizeUserOutput(user),
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal authentication server error.', code: 'SERVER_ERROR' });
  }
});

// In-memory OTP store for password reset
const otpStore = new Map<string, { code: string; expiresAt: number }>();

/**
 * GET /api/auth/system-status
 * Check if the system has an active administrator account configured
 */
router.get('/system-status', (req: Request, res: Response): void => {
  const activeAdmin = serverStore.users.find(
    (u) => (u.role === 'Super Admin' || u.role === 'School Admin') && u.status === 'Active'
  );
  const hasAdmin = !!activeAdmin;
  res.json({
    hasAdmin,
    needsInitialAdmin: !hasAdmin,
    defaultAdmin: {
      email: activeAdmin ? activeAdmin.email : 'admin@school.com',
      name: activeAdmin ? activeAdmin.name : 'Super Administrator',
      role: activeAdmin ? activeAdmin.role : 'Super Admin',
      defaultPassword: 'Admin@123',
    },
    userCount: serverStore.users.length,
    users: serverStore.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
    })),
  });
});

/**
 * POST /api/auth/signup
 * Public registration endpoint for institutional administrators, faculty, and users.
 * Direct real-time account activation with instant session issuance.
 */
router.post('/signup', loginRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, department, phone, registrationReason } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        error: 'Please provide all required fields: Name, Email, and Password.',
        code: 'MISSING_FIELDS',
      });
      return;
    }

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || 'Standard Browser Client';
    const normalizedEmail = email.toLowerCase().trim();

    // If first user, make them Super Admin automatically
    const isFirstAccount = serverStore.users.length === 0;
    const effectiveRole = isFirstAccount ? 'Super Admin' : (role?.trim() || 'Super Admin');

    // Validate Password Policy
    const policyCheck = validatePasswordPolicy(password, serverStore.securityPolicy.minPasswordLength || 8);
    if (!policyCheck.valid) {
      res.status(400).json({
        error: 'Password does not meet institutional security standards.',
        policyErrors: policyCheck.errors,
      });
      return;
    }

    const passwordHash = await hashPassword(password);

    // Check duplicate email
    let userRecord = serverStore.users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (userRecord) {
      // If user exists, update their password, role, and activate their account
      userRecord.passwordHash = passwordHash;
      userRecord.name = name.trim();
      userRecord.role = effectiveRole;
      userRecord.status = 'Active';
      if (department) userRecord.department = department.trim();
      if (phone) userRecord.phone = phone.trim();
    } else {
      const userId = `u-admin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      userRecord = {
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: effectiveRole,
        department: department?.trim() || (effectiveRole.includes('Admin') ? 'Executive Administration' : 'Academic Faculty'),
        phone: phone?.trim() || '',
        status: 'Active',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 19),
        createdAt: new Date().toISOString().split('T')[0],
        submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        registrationReason: registrationReason?.trim() || `Account created for ${effectiveRole}`,
        twoFactorEnabled: false,
        permissions: {
          view: true,
          create: true,
          edit: true,
          delete: true,
          export: true,
          print: true,
          approve: true,
        },
      };
      serverStore.users.unshift(userRecord);
    }

    serverStore.saveUsersToDisk();

    // Issue instant active session and token
    const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const expiresMs = 7 * 24 * 60 * 60 * 1000;
    const newSession: ActiveSession = {
      sessionId,
      userId: userRecord.id,
      userEmail: userRecord.email,
      userName: userRecord.name,
      role: userRecord.role,
      ipAddress: clientIp,
      userAgent: userAgent.substring(0, 80),
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      expiresAt: Date.now() + expiresMs,
      isRevoked: false,
    };
    serverStore.activeSessions.set(sessionId, newSession);

    const token = jwt.sign(
      {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        role: userRecord.role,
        department: userRecord.department,
        sessionId,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: expiresMs,
    });

    serverStore.recordAuditLog({
      userId: userRecord.id,
      userName: userRecord.name,
      userRole: userRecord.role,
      action: 'USER_REGISTERED_AND_ACTIVATED',
      module: 'Auth',
      status: 'Success',
      ipAddress: clientIp,
      details: `User account '${userRecord.name}' (${userRecord.email}) registered and activated with role '${userRecord.role}'.`,
    });

    res.status(201).json({
      success: true,
      message: 'Account registered and activated successfully! Entering portal...',
      status: 'Active',
      token,
      sessionId,
      user: sanitizeUserOutput(userRecord),
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Registration failed due to an internal server error.', code: 'SERVER_ERROR' });
  }
});

/**
 * POST /api/auth/logout
 * Securely invalidates session on server, clears cookie and logs event
 */
router.post('/logout', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  try {
    if (req.sessionId) {
      const session = serverStore.activeSessions.get(req.sessionId);
      if (session) {
        session.isRevoked = true;
        serverStore.activeSessions.delete(req.sessionId);
      }
    }

    if (req.user) {
      serverStore.recordAuditLog({
        userId: req.user.id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'USER_LOGOUT',
        module: 'Auth',
        status: 'Success',
        ipAddress: req.ip || '127.0.0.1',
        details: `User logged out. Session '${req.sessionId}' invalidated.`,
      });
    }

    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Logout failed.', code: 'SERVER_ERROR' });
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user and session validity
 */
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ authenticated: false, error: 'Unauthorized' });
    return;
  }
  const user = serverStore.users.find((u) => u.id === req.user?.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    authenticated: true,
    user: sanitizeUserOutput(user),
    sessionId: req.sessionId,
  });
});

/**
 * POST /api/auth/switch-role
 * Controlled role switching for development & testing of all 9 institutional personas
 */
router.post('/switch-role', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const { targetRole } = req.body;
  if (!targetRole) {
    res.status(400).json({ error: 'Target role is required' });
    return;
  }

  let matchedUser = serverStore.users.find((u) => u.role.toLowerCase() === targetRole.toLowerCase());

  if (!matchedUser) {
    // Generate authorized persona
    const newId = `u-${targetRole.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    matchedUser = {
      id: newId,
      name: `${targetRole} User`,
      email: `${targetRole.toLowerCase().replace(/\s+/g, '.')}@greenwood.edu`,
      role: targetRole,
      passwordHash: serverStore.users[0].passwordHash,
      department: 'Academic Operations',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      status: 'Active',
      lastLogin: new Date().toISOString(),
      createdAt: '2026-08-31',
      studentId: targetRole === 'Student' ? 'std-1' : undefined,
      parentChildIds: targetRole === 'Parent' ? ['std-1'] : undefined,
    };
    serverStore.users.push(matchedUser);
  }

  const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const newSession: ActiveSession = {
    sessionId,
    userId: matchedUser.id,
    userEmail: matchedUser.email,
    userName: matchedUser.name,
    role: matchedUser.role,
    ipAddress: req.ip || '127.0.0.1',
    userAgent: (req.headers['user-agent'] || 'Browser').substring(0, 80),
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    expiresAt: Date.now() + 2 * 60 * 60 * 1000,
    isRevoked: false,
  };
  serverStore.activeSessions.set(sessionId, newSession);

  const token = jwt.sign(
    {
      id: matchedUser.id,
      email: matchedUser.email,
      name: matchedUser.name,
      role: matchedUser.role,
      department: matchedUser.department,
      sessionId: sessionId,
      studentId: matchedUser.studentId,
      parentChildIds: matchedUser.parentChildIds,
    },
    config.jwtSecret,
    { expiresIn: '2h' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 2 * 60 * 60 * 1000,
  });

  serverStore.recordAuditLog({
    userId: req.user?.id || 'sys',
    userName: req.user?.name || 'User',
    userRole: req.user?.role || 'Admin',
    action: 'SWITCH_ROLE_PERSONA',
    module: 'Auth',
    status: 'Success',
    ipAddress: req.ip || '127.0.0.1',
    details: `User switched persona to '${targetRole}'`,
  });

  res.json({
    success: true,
    token,
    sessionId,
    user: sanitizeUserOutput(matchedUser),
  });
});

/**
 * POST /api/auth/forgot-password
 * Rate-limited forgot password request with OTP code generation
 */
router.post('/forgot-password', passwordResetRateLimiter, (req: Request, res: Response): void => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email address is required.' });
    return;
  }

  const normalized = email.toLowerCase().trim();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(normalized, { code, expiresAt: Date.now() + 15 * 60 * 1000 });

  serverStore.recordAuditLog({
    userId: 'recovery',
    userName: normalized,
    userRole: 'Institutional User',
    action: 'PASSWORD_RESET_OTP_GENERATED',
    module: 'Auth',
    status: 'Success',
    ipAddress: req.ip || '127.0.0.1',
    details: `Password reset OTP generated for '${normalized}'`,
  });

  res.json({
    success: true,
    message: `A 6-digit verification code has been dispatched for ${normalized}.`,
    otpCode: code, // returned for real-time verification in UI
  });
});

/**
 * POST /api/auth/reset-password
 * Completes password reset with new password
 */
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !newPassword) {
      res.status(400).json({ error: 'Email and new password are required.' });
      return;
    }

    const normalized = email.toLowerCase().trim();
    const storedOtp = otpStore.get(normalized);
    if (storedOtp && storedOtp.code !== otp && storedOtp.expiresAt > Date.now()) {
      res.status(400).json({ error: 'Invalid or expired OTP code.' });
      return;
    }

    const user = serverStore.users.find((u) => u.email.toLowerCase() === normalized);
    if (!user) {
      res.status(404).json({ error: 'No user account found matching that email.' });
      return;
    }

    user.passwordHash = await hashPassword(newPassword);
    user.status = 'Active';
    serverStore.saveUsersToDisk();
    otpStore.delete(normalized);

    serverStore.recordAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'PASSWORD_RESET_COMPLETED',
      module: 'Auth',
      status: 'Success',
      ipAddress: req.ip || '127.0.0.1',
      details: `Password was successfully updated for '${user.email}'`,
    });

    res.json({
      success: true,
      message: 'Your password has been successfully reset! You can now log in.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

/**
 * GET /api/auth/sessions
 * List active sessions (Super Admin/Admin sees institutional sessions; other users see their own)
 */
router.get('/sessions', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const sessionsArray = Array.from(serverStore.activeSessions.values());

  if (['Super Admin', 'School Admin'].includes(req.user?.role || '')) {
    res.json({ sessions: sessionsArray });
    return;
  }

  // Regular user sees only their own sessions
  const userSessions = sessionsArray.filter((s) => s.userId === req.user?.id);
  res.json({ sessions: userSessions });
});

/**
 * POST /api/auth/sessions/revoke
 * Revoke specific session or all sessions for a user
 */
router.post('/sessions/revoke', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const { targetSessionId, revokeAllOther } = req.body;

  if (revokeAllOther && req.user) {
    for (const [sId, sess] of serverStore.activeSessions.entries()) {
      if (sess.userId === req.user.id && sId !== req.sessionId) {
        sess.isRevoked = true;
        serverStore.activeSessions.delete(sId);
      }
    }
    serverStore.recordAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'REVOKE_ALL_OTHER_SESSIONS',
      module: 'Security',
      status: 'Success',
      ipAddress: req.ip || '127.0.0.1',
      details: 'User revoked all other active login sessions.',
    });
    res.json({ success: true, message: 'All other sessions have been terminated.' });
    return;
  }

  if (targetSessionId) {
    const targetSession = serverStore.activeSessions.get(targetSessionId);
    if (!targetSession) {
      res.status(404).json({ error: 'Session not found or already terminated.' });
      return;
    }

    // Check permission to revoke
    if (targetSession.userId !== req.user?.id && !['Super Admin', 'School Admin'].includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Forbidden: You cannot revoke another user’s session.' });
      return;
    }

    targetSession.isRevoked = true;
    serverStore.activeSessions.delete(targetSessionId);

    serverStore.recordAuditLog({
      userId: req.user?.id || 'sys',
      userName: req.user?.name || 'User',
      userRole: req.user?.role || 'Admin',
      action: 'REVOKE_SESSION',
      module: 'Security',
      status: 'Success',
      ipAddress: req.ip || '127.0.0.1',
      details: `Revoked session '${targetSessionId}' belonging to '${targetSession.userEmail}'`,
    });

    res.json({ success: true, message: 'Session revoked successfully.' });
    return;
  }

  res.status(400).json({ error: 'Missing targetSessionId or revokeAllOther parameter.' });
});

export default router;
