import express, { Response } from 'express';
import { serverStore, ServerUser } from '../store.js';
import { hashPassword, validatePasswordPolicy, sanitizeUserOutput } from '../security.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

/**
 * All routes in /api/users require authentication
 */
router.use(authenticateToken);

/**
 * GET /api/users
 * Super Admin & School Admin can list all users.
 */
router.get('/', requireRole('Super Admin', 'School Admin'), (req: AuthenticatedRequest, res: Response): void => {
  const sanitizedUsers = serverStore.users.map((u) => sanitizeUserOutput(u));
  res.json({ users: sanitizedUsers });
});

/**
 * POST /api/users
 * Create a new user with strict authorization, role validation, and password policy.
 */
router.post('/', requireRole('Super Admin', 'School Admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, email, role, password, department, phone, status, twoFactorEnabled } = req.body;

    if (!name || !email || !role || !password) {
      res.status(400).json({ error: 'Missing required user creation fields: name, email, role, password' });
      return;
    }

    // Privilege Escalation Prevention: Only Super Admin can create another Super Admin
    if (role === 'Super Admin' && req.user?.role !== 'Super Admin') {
      res.status(403).json({
        error: 'Forbidden: Only Super Administrators can provision another Super Admin account.',
        code: 'PRIVILEGE_ESCALATION_BLOCKED',
      });
      return;
    }

    // Check duplicate email
    const existing = serverStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (existing) {
      res.status(409).json({ error: 'A user account with this email address already exists.' });
      return;
    }

    // Validate Password Policy
    const policyCheck = validatePasswordPolicy(password, serverStore.securityPolicy.minPasswordLength || 8);
    if (!policyCheck.valid) {
      res.status(400).json({
        error: 'Password does not satisfy institutional security policy.',
        policyErrors: policyCheck.errors,
      });
      return;
    }

    const passwordHash = await hashPassword(password);
    const newUser: ServerUser = {
      id: `u-${Date.now()}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      department: department || 'General Staff',
      phone: phone || '',
      status: status || 'Active',
      twoFactorEnabled: !!twoFactorEnabled,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      lastLogin: 'Never',
      createdAt: new Date().toISOString().split('T')[0],
    };

    serverStore.users.unshift(newUser);

    serverStore.recordAuditLog({
      userId: req.user?.id || 'admin',
      userName: req.user?.name || 'Administrator',
      userRole: req.user?.role || 'Super Admin',
      action: 'USER_CREATED',
      module: 'User Management',
      status: 'Success',
      ipAddress: req.ip || '127.0.0.1',
      details: `Provisioned new account '${newUser.email}' with role '${newUser.role}'`,
    });

    res.status(201).json({
      success: true,
      user: sanitizeUserOutput(newUser),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create user.', code: 'SERVER_ERROR' });
  }
});

/**
 * PUT /api/users/:id
 * Update user details. Prevent non-Super Admin from elevating roles to Super Admin.
 */
router.put('/:id', requireRole('Super Admin', 'School Admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, role, department, phone, status, twoFactorEnabled, password } = req.body;

    const user = serverStore.users.find((u) => u.id === id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Prevent non-Super Admin from modifying a Super Admin or elevating self
    if (user.role === 'Super Admin' && req.user?.role !== 'Super Admin') {
      res.status(403).json({ error: 'Forbidden: You cannot modify a Super Administrator account.' });
      return;
    }

    if (role === 'Super Admin' && req.user?.role !== 'Super Admin') {
      res.status(403).json({ error: 'Forbidden: You cannot promote an account to Super Administrator.' });
      return;
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (department !== undefined) user.department = department;
    if (phone !== undefined) user.phone = phone;
    if (status) user.status = status;
    if (twoFactorEnabled !== undefined) user.twoFactorEnabled = twoFactorEnabled;

    if (password) {
      const policyCheck = validatePasswordPolicy(password, serverStore.securityPolicy.minPasswordLength || 8);
      if (!policyCheck.valid) {
        res.status(400).json({ error: 'Password does not meet security requirements.', policyErrors: policyCheck.errors });
        return;
      }
      user.passwordHash = await hashPassword(password);
    }

    serverStore.recordAuditLog({
      userId: req.user?.id || 'admin',
      userName: req.user?.name || 'Administrator',
      userRole: req.user?.role || 'Super Admin',
      action: 'USER_UPDATED',
      module: 'User Management',
      status: 'Success',
      ipAddress: req.ip || '127.0.0.1',
      details: `Updated account details for user '${user.email}'`,
    });

    res.json({ success: true, user: sanitizeUserOutput(user) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user account (Super Admin only). Prevents deleting own active account.
 */
router.delete('/:id', requireRole('Super Admin'), (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;

  if (req.user?.id === id) {
    res.status(400).json({ error: 'Self-deletion is forbidden for active administrator session.' });
    return;
  }

  const index = serverStore.users.findIndex((u) => u.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const deletedUser = serverStore.users[index];
  serverStore.users.splice(index, 1);

  // Terminate any active sessions belonging to deleted user
  for (const [sessionId, sess] of serverStore.activeSessions.entries()) {
    if (sess.userId === id) {
      sess.isRevoked = true;
      serverStore.activeSessions.delete(sessionId);
    }
  }

  serverStore.recordAuditLog({
    userId: req.user?.id || 'admin',
    userName: req.user?.name || 'Administrator',
    userRole: req.user?.role || 'Super Admin',
    action: 'USER_DELETED',
    module: 'User Management',
    status: 'Success',
    ipAddress: req.ip || '127.0.0.1',
    details: `Deleted account '${deletedUser.email}' and terminated all associated sessions.`,
  });

  res.json({ success: true, message: 'User deleted successfully.' });
});

/**
 * POST /api/users/:id/reset-password
 * Admin triggered password reset generating secure one-time passkey
 */
router.post('/:id/reset-password', requireRole('Super Admin', 'School Admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = serverStore.users.find((u) => u.id === id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const tempPass = `GIA-${Math.random().toString(36).substring(2, 6).toUpperCase()}!${Math.floor(100 + Math.random() * 900)}`;
  user.passwordHash = await hashPassword(tempPass);

  serverStore.recordAuditLog({
    userId: req.user?.id || 'admin',
    userName: req.user?.name || 'Administrator',
    userRole: req.user?.role || 'Admin',
    action: 'PASSWORD_RESET_ADMIN',
    module: 'User Management',
    status: 'Success',
    ipAddress: req.ip || '127.0.0.1',
    details: `Generated temporary password for '${user.email}'`,
  });

  res.json({
    success: true,
    tempPassword: tempPass,
    message: 'Temporary password generated successfully.',
  });
});

/**
 * POST /api/users/:id/approve
 * Super Admin / School Admin approves a pending user registration request.
 * Transitions status: PENDING -> ACTIVE (User can now log in)
 */
router.post('/:id/approve', requireRole('Super Admin', 'School Admin'), (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const user = serverStore.users.find((u) => u.id === id);

  if (!user) {
    res.status(404).json({ error: 'User registration request not found.' });
    return;
  }

  const previousStatus = user.status;
  user.status = 'Active';
  user.reviewedBy = req.user?.name || 'Super Admin';
  user.reviewedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

  serverStore.recordAuditLog({
    userId: req.user?.id || 'admin',
    userName: req.user?.name || 'Super Admin',
    userRole: req.user?.role || 'Super Admin',
    action: 'USER_REGISTRATION_APPROVED',
    module: 'User Management',
    status: 'Success',
    ipAddress: req.ip || '127.0.0.1',
    details: `Super Admin approved account registration for '${user.name}' (${user.email}) as role '${user.role}'. Account status transitioned: ${previousStatus} ➔ ACTIVE.`,
  });

  res.json({
    success: true,
    message: `Account for ${user.name} approved and activated successfully. User can now sign in.`,
    user: sanitizeUserOutput(user),
  });
});

/**
 * POST /api/users/:id/reject
 * Super Admin / School Admin rejects a pending user registration request.
 * Transitions status: PENDING -> REJECTED (User login blocked)
 */
router.post('/:id/reject', requireRole('Super Admin', 'School Admin'), (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const { rejectionReason } = req.body;
  const user = serverStore.users.find((u) => u.id === id);

  if (!user) {
    res.status(404).json({ error: 'User registration request not found.' });
    return;
  }

  const previousStatus = user.status;
  const reason = rejectionReason?.trim() || 'Institutional eligibility verification requirements not met.';

  user.status = 'Rejected';
  user.rejectionReason = reason;
  user.reviewedBy = req.user?.name || 'Super Admin';
  user.reviewedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // Invalidate any existing sessions
  for (const [sessionId, sess] of serverStore.activeSessions.entries()) {
    if (sess.userId === id) {
      sess.isRevoked = true;
      serverStore.activeSessions.delete(sessionId);
    }
  }

  serverStore.recordAuditLog({
    userId: req.user?.id || 'admin',
    userName: req.user?.name || 'Super Admin',
    userRole: req.user?.role || 'Super Admin',
    action: 'USER_REGISTRATION_REJECTED',
    module: 'User Management',
    status: 'Warning',
    ipAddress: req.ip || '127.0.0.1',
    details: `Super Admin rejected account registration for '${user.name}' (${user.email}). Status: ${previousStatus} ➔ REJECTED. Reason: "${reason}".`,
  });

  res.json({
    success: true,
    message: `Registration request for ${user.name} has been rejected.`,
    user: sanitizeUserOutput(user),
  });
});

export default router;
