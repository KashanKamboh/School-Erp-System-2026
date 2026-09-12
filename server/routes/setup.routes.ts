import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { serverStore, ServerUser } from '../store.js';
import { sanitizeUserOutput } from '../security.js';
import {
  isSystemSetupCompleted,
  getSystemSetting,
  markSystemSetupCompleted,
  resetAllSystemData,
} from '../db.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/setup/status
 * Public status endpoint to check if school setup has been completed
 */
router.get('/status', (req: Request, res: Response): void => {
  const setupCompleted = isSystemSetupCompleted();
  let schoolConfig = null;

  const rawConfig = getSystemSetting('school_config');
  if (rawConfig) {
    try {
      schoolConfig = JSON.parse(rawConfig);
    } catch {
      schoolConfig = null;
    }
  }

  const hasAdmin = serverStore.users.some((u) => u.role === 'Super Admin');

  res.json({
    setupCompleted,
    schoolConfig,
    hasAdmin,
  });
});

/**
 * POST /api/setup/complete
 * Completes the first-run school setup wizard
 */
router.post('/complete', async (req: Request, res: Response): Promise<void> => {
  try {
    const { schoolInfo, adminAccount, schoolSettings } = req.body;

    // Check if already completed
    if (isSystemSetupCompleted() && serverStore.users.length > 0) {
      res.status(400).json({
        error: 'System setup has already been completed. Factory reset is required to run the setup wizard again.',
        code: 'SETUP_ALREADY_COMPLETED',
      });
      return;
    }

    // 1. Validate School Info
    if (!schoolInfo || !schoolInfo.schoolName || !schoolInfo.schoolName.trim()) {
      res.status(400).json({ error: 'School Name is required.' });
      return;
    }
    if (!schoolInfo.currentSession || !schoolInfo.currentSession.trim()) {
      res.status(400).json({ error: 'Academic Session / Current Session is required.' });
      return;
    }

    // 2. Validate Admin Account
    if (!adminAccount || !adminAccount.name || !adminAccount.name.trim()) {
      res.status(400).json({ error: 'Administrator Full Name is required.' });
      return;
    }
    if (!adminAccount.username || !adminAccount.username.trim()) {
      res.status(400).json({ error: 'Administrator Username is required.' });
      return;
    }
    const cleanUsername = adminAccount.username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      res.status(400).json({ error: 'Username must be at least 3 characters long.' });
      return;
    }
    if (!adminAccount.password || adminAccount.password.length < 8) {
      res.status(400).json({ error: 'Administrator password must be at least 8 characters long.' });
      return;
    }

    // Determine admin email or generate institutional address from username
    const adminEmail = adminAccount.email && adminAccount.email.trim()
      ? adminAccount.email.trim().toLowerCase()
      : `${cleanUsername}@school.local`;

    // Hash password securely with bcrypt (12 rounds)
    const passwordHash = await bcrypt.hash(adminAccount.password, 12);

    // 3. Create Super Admin User
    const adminUser: ServerUser = {
      id: `usr-superadmin-${Date.now()}`,
      username: cleanUsername,
      name: adminAccount.name.trim(),
      email: adminEmail,
      passwordHash,
      role: 'Super Admin',
      status: 'Active',
      department: 'Executive Administration',
      phone: adminAccount.phone ? adminAccount.phone.trim() : '',
      lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 19),
      createdAt: new Date().toISOString().split('T')[0],
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

    // Store user as primary administrator in memory and SQLite persistent store
    serverStore.users = [adminUser];
    serverStore.saveUsersToDisk();
    console.log(`[Setup] Super Admin account created: username="${adminUser.username}", email="${adminUser.email}", role="${adminUser.role}"`);

    // 4. Construct School Configuration
    const currency = schoolSettings?.currency || 'PKR';
    let currencySymbol = 'Rs.';
    if (currency === 'USD') currencySymbol = '$';
    else if (currency === 'GBP') currencySymbol = '£';
    else if (currency === 'EUR') currencySymbol = '€';
    else if (currency === 'AED') currencySymbol = 'AED ';
    else if (currency === 'SAR') currencySymbol = 'SAR ';
    else if (currency === 'INR') currencySymbol = '₹';

    const configuredSchool = {
      schoolName: schoolInfo.schoolName.trim(),
      name: schoolInfo.schoolName.trim(),
      schoolCode: schoolInfo.schoolCode ? schoolInfo.schoolCode.trim() : '',
      affiliationNumber: schoolInfo.schoolCode ? schoolInfo.schoolCode.trim() : '',
      email: schoolInfo.schoolEmail ? schoolInfo.schoolEmail.trim() : '',
      phone: schoolInfo.schoolPhone ? schoolInfo.schoolPhone.trim() : '',
      address: schoolInfo.schoolAddress ? schoolInfo.schoolAddress.trim() : '',
      city: schoolInfo.city ? schoolInfo.city.trim() : '',
      state: schoolInfo.state ? schoolInfo.state.trim() : '',
      country: schoolInfo.country ? schoolInfo.country.trim() : 'Pakistan',
      website: schoolInfo.website ? schoolInfo.website.trim() : '',
      currentSession: schoolInfo.currentSession.trim(),
      logoUrl: schoolInfo.logo || '',
      principalName: adminAccount.name.trim(),
      currency,
      currencySymbol,
      dateFormat: schoolSettings?.dateFormat || 'DD/MM/YYYY',
      timeZone: schoolSettings?.timeZone || 'Asia/Karachi (GMT+5)',
      attendanceType: schoolSettings?.attendanceType || 'Daily Once',
      feeFrequency: schoolSettings?.feeFrequency || 'Monthly',
      gradingSystem: schoolSettings?.gradingSystem || 'Percentage (A-F)',
      workingDays: schoolSettings?.workingDays || 'Monday - Saturday',
      startTime: schoolSettings?.startTime || '08:00',
      endTime: schoolSettings?.endTime || '14:00',
      smsAlertsEnabled: false,
      emailNotificationsEnabled: false,
      autoLateFine: false,
      lateFinePerDay: 0,
      bankName: '',
      bankBranch: '',
      accountTitle: '',
      accountNumber: '',
      iban: '',
      lateFeeAmount: 0,
      voucherDueDays: 10,
      voucherNotes: '',
    };

    // 5. Persist to SQLite Database
    markSystemSetupCompleted(configuredSchool);
    serverStore.schoolSettings = configuredSchool;

    // Optional: Populate user-selected initial classes and fee structures chosen in the wizard
    const { initialClasses, initialFeeCategories } = req.body;
    if (Array.isArray(initialClasses) && initialClasses.length > 0) {
      serverStore.classes = initialClasses.map((c: any, index: number) => ({
        id: `cls-${Date.now()}-${index}`,
        name: typeof c === 'string' ? c : c.name,
        section: c.section || 'A',
        room: c.room || `Room ${index + 1}`,
        capacity: c.capacity || 40,
        totalStudents: 0,
        classTeacherId: '',
        classTeacherName: 'Unassigned',
        subjects: c.subjects || ['English', 'Mathematics', 'Science', 'Urdu', 'Islamiat'],
      }));
    }

    if (Array.isArray(initialFeeCategories) && initialFeeCategories.length > 0) {
      serverStore.feeCategories = initialFeeCategories.map((name: string, index: number) => ({
        id: `fee-cat-${Date.now()}-${index}`,
        name,
        description: `Standard ${name} structure for academic term ${configuredSchool.currentSession}`,
        studentType: 'All',
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0],
      }));
    }

    // 6. Generate Session Token for Admin
    const token = jwt.sign(
      {
        userId: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        name: adminUser.name,
        sessionId: `sess-setup-${Date.now()}`,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    // Record audit log
    serverStore.recordAuditLog({
      userId: adminUser.id,
      userName: adminUser.name,
      userRole: 'Super Admin',
      action: 'INITIAL_SETUP_COMPLETED',
      module: 'System Setup',
      status: 'Success',
      ipAddress: req.ip || '127.0.0.1',
      details: `Initial setup successfully completed for school '${configuredSchool.schoolName}' (Session: ${configuredSchool.currentSession}). Administrator '${adminUser.name}' provisioned.`,
    });

    res.status(201).json({
      success: true,
      message: 'School setup completed successfully.',
      token,
      user: sanitizeUserOutput(adminUser),
      schoolConfig: configuredSchool,
    });
  } catch (error: any) {
    console.error('Error completing school setup:', error);
    res.status(500).json({
      error: 'An unexpected error occurred while completing initial school setup.',
      details: error.message,
    });
  }
});

/**
 * POST /api/setup/reset
 * Factory Reset: Super Admin only
 * Completely resets school data, wipes business records, and returns ERP to first-run setup wizard.
 */
router.post(
  '/reset',
  authenticateToken,
  requireRole('Super Admin'),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      const { confirmation } = req.body;
      if (confirmation !== 'RESET SCHOOL DATA') {
        res.status(400).json({
          error: 'Invalid confirmation phrase. Type "RESET SCHOOL DATA" to confirm factory reset.',
        });
        return;
      }

      // Record audit log prior to wipe
      serverStore.recordAuditLog({
        userId: req.user?.id || 'admin',
        userName: req.user?.name || 'Administrator',
        userRole: 'Super Admin',
        action: 'FACTORY_RESET_INITIATED',
        module: 'System Setup',
        status: 'Warning',
        ipAddress: req.ip || '127.0.0.1',
        details: 'Full system factory reset performed. All student, teacher, class, financial, and institutional records cleared.',
      });

      // 1. Wipe SQLite tables and reset system_settings
      resetAllSystemData();

      // 2. Wipe in-memory entity arrays
      serverStore.users = [];
      serverStore.saveUsersToDisk();
      serverStore.students = [];
      serverStore.teachers = [];
      serverStore.staff = [];
      serverStore.classes = [];
      serverStore.attendanceRecords = [];
      serverStore.feeStructures = [];
      serverStore.feeInvoices = [];
      serverStore.exams = [];
      serverStore.examSchedules = [];
      serverStore.examResults = [];
      serverStore.timetableSlots = [];
      serverStore.homeworks = [];
      serverStore.libraryBooks = [];
      serverStore.libraryTransactions = [];
      serverStore.vehicles = [];
      serverStore.transportRoutes = [];
      serverStore.payroll = [];
      serverStore.leaveRequests = [];
      serverStore.expenses = [];
      serverStore.notices = [];
      serverStore.messages = [];
      serverStore.notifications = [];
      serverStore.schoolSettings = {};
      serverStore.activeSessions.clear();

      res.json({
        success: true,
        message: 'System has been successfully reset to factory defaults. All school data wiped.',
      });
    } catch (error: any) {
      console.error('Error executing factory reset:', error);
      res.status(500).json({
        error: 'Failed to complete factory reset.',
        details: error.message,
      });
    }
  }
);

export default router;
