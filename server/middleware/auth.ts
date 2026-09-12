import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { serverStore } from '../store.js';

export interface AuthenticatedUserPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string;
  sessionId: string;
  studentId?: string;
  parentChildIds?: string[];
  permissions?: any;
  customModulePermissions?: any;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUserPayload;
  sessionId?: string;
}

/**
 * Middleware: Extract and verify JWT from Cookie or Authorization header.
 * Validates that the active session has not been revoked on the server.
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // 1. Try cookie first
  let token = req.cookies?.token;

  // 2. Fallback to Authorization: Bearer <token>
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized: Authentication token is missing. Please sign in.',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthenticatedUserPayload;

    let session = serverStore.activeSessions.get(decoded.sessionId);
    if (!session) {
      // Re-hydrate session from valid JWT on server restart or hot reload
      const newSession = {
        sessionId: decoded.sessionId || `sess-restored-${Date.now()}`,
        userId: decoded.id,
        userEmail: decoded.email,
        userName: decoded.name,
        role: decoded.role,
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
        userAgent: (req.headers['user-agent'] || 'Browser').substring(0, 80),
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        expiresAt: (decoded as any).exp ? (decoded as any).exp * 1000 : Date.now() + 2 * 60 * 60 * 1000,
        isRevoked: false,
      };
      serverStore.activeSessions.set(decoded.sessionId, newSession);
      session = newSession;
    } else if (session.isRevoked) {
      res.status(401).json({
        error: 'Unauthorized: Session has been expired or revoked. Please sign in again.',
        code: 'SESSION_REVOKED',
      });
      return;
    }

    // Check if user still exists and is Active
    const userInDb = serverStore.users.find((u) => u.id === decoded.id);
    if (!userInDb || userInDb.status === 'Suspended') {
      res.status(403).json({
        error: 'Access Forbidden: User account is suspended or no longer exists.',
        code: 'ACCOUNT_SUSPENDED',
      });
      return;
    }

    // Update session last active time
    session.lastActiveAt = new Date().toISOString();

    // Attach verified user payload directly to request (server authority)
    req.user = {
      id: userInDb.id,
      email: userInDb.email,
      name: userInDb.name,
      role: userInDb.role,
      department: userInDb.department,
      sessionId: decoded.sessionId,
      studentId: userInDb.studentId,
      parentChildIds: userInDb.parentChildIds,
      permissions: userInDb.permissions,
      customModulePermissions: userInDb.customModulePermissions,
    };
    req.sessionId = decoded.sessionId;

    next();
  } catch (err: any) {
    res.status(401).json({
      error: 'Unauthorized: Invalid or expired token.',
      code: 'TOKEN_INVALID',
    });
  }
}

/**
 * Middleware: Role-Based Access Control (RBAC)
 * Rejects requests with 403 if authenticated user does not have one of the allowed roles.
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      return;
    }

    // Super Admin has full institutional override
    if (req.user.role === 'Super Admin') {
      return next();
    }

    // Check if user's verified role matches allowed roles
    const hasRole = allowedRoles.some(
      (r) => r.toLowerCase() === req.user?.role.toLowerCase()
    );

    if (!hasRole) {
      // Record security audit event for unauthorized attempt
      serverStore.recordAuditLog({
        userId: req.user.id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        module: req.baseUrl || 'System',
        status: 'Failed',
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
        details: `User with role '${req.user.role}' attempted to access restricted endpoint '${req.originalUrl}' requiring roles: [${allowedRoles.join(', ')}]`,
      });

      res.status(403).json({
        error: `Forbidden: Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
        code: 'ACCESS_FORBIDDEN',
        requiredRoles: allowedRoles,
      });
      return;
    }

    next();
  };
}

/**
 * IDOR Protection Middleware:
 * Validates that Students only access their own student record,
 * Parents only access their linked children,
 * Teachers/Admins access according to their institutional responsibilities.
 */
export function enforceStudentObjectAccess(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const userRole = req.user.role;
  const requestedStudentId = req.params.id || req.query.studentId as string;

  // Super Admin, School Admin, Principal, Accountant have institutional student access
  if (['Super Admin', 'School Admin', 'Principal', 'Accountant', 'Teacher'].includes(userRole)) {
    return next();
  }

  // Student role: can ONLY access their own studentId
  if (userRole === 'Student') {
    if (requestedStudentId && req.user.studentId && requestedStudentId !== req.user.studentId) {
      serverStore.recordAuditLog({
        userId: req.user.id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'IDOR_VIOLATION_BLOCKED',
        module: 'Students',
        status: 'Failed',
        ipAddress: req.ip || '127.0.0.1',
        details: `Student '${req.user.name}' attempted IDOR access to student record '${requestedStudentId}' (authorized studentId: '${req.user.studentId}')`,
      });

      res.status(403).json({
        error: 'Forbidden: You are not authorized to view another student’s confidential records.',
        code: 'IDOR_VIOLATION',
      });
      return;
    }
  }

  // Parent role: can ONLY access linked children
  if (userRole === 'Parent') {
    if (requestedStudentId && req.user.parentChildIds && !req.user.parentChildIds.includes(requestedStudentId)) {
      serverStore.recordAuditLog({
        userId: req.user.id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'IDOR_VIOLATION_BLOCKED',
        module: 'Students',
        status: 'Failed',
        ipAddress: req.ip || '127.0.0.1',
        details: `Parent '${req.user.name}' attempted IDOR access to unlinked child '${requestedStudentId}'`,
      });

      res.status(403).json({
        error: 'Forbidden: You are not authorized to view student records outside your guardian profile.',
        code: 'IDOR_VIOLATION',
      });
      return;
    }
  }

  next();
}
