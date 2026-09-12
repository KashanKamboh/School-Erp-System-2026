import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const getStoreDir = (): string => {
  if (typeof __dirname !== 'undefined') return __dirname;
  return path.join(process.cwd(), 'server');
};
import { initialUsers, initialStudents, initialTeachers, initialStaff, initialClasses, initialAttendanceRecords, initialFeeStructures, initialFeeInvoices, initialExams, initialExamSchedules, initialExamResults, initialTimetableSlots, initialHomeworks, initialLibraryBooks, initialLibraryTransactions, initialVehicles, initialRoutes, initialPayroll, initialLeaveRequests, initialExpenses, initialNotices, initialMessages, initialNotifications, initialAuditLogs, initialSchoolSettings } from '../src/data/mockErpData.js';
import { initialRoleDefinitions, initialSecurityPolicy } from '../src/data/rbacData.js';
import {
  getSavedSchoolConfig,
  seedDefaultClassesIfEmpty,
  getAllClassesFromDb,
  seedDefaultStudentsIfEmpty,
  getAllStudentsFromDb,
  getAttendanceRecordsFromDb,
  getAllUsersFromDb,
  getUserByLoginId,
  saveUserToDb,
  saveAllUsersToDb,
  deleteUserFromDb,
  getDbPath,
} from './db.js';

export interface ServerUser {
  id: string;
  username?: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  avatar?: string;
  phone?: string;
  department?: string;
  status: 'Active' | 'Inactive' | 'Suspended' | 'Pending' | 'Rejected';
  lastLogin: string;
  lastIp?: string;
  createdAt: string;
  twoFactorEnabled?: boolean;
  studentId?: string; // If student role
  parentChildIds?: string[]; // If parent role
  registrationReason?: string;
  requestedRole?: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  permissions?: any;
  customModulePermissions?: any;
}

export interface ActiveSession {
  sessionId: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: number;
  isRevoked: boolean;
}

export interface FailedLoginRecord {
  count: number;
  lastAttempt: number;
  lockedUntil?: number;
}

// In-Memory Database Store with Server Authority & SQLite Persistence
class ServerStore {
  public users: ServerUser[] = [];
  public activeSessions: Map<string, ActiveSession> = new Map();
  public failedLogins: Map<string, FailedLoginRecord> = new Map();
  public auditLogs: any[] = [...initialAuditLogs];
  public roleDefinitions: any[] = [...initialRoleDefinitions];
  public securityPolicy: any = { ...initialSecurityPolicy };
  public schoolSettings: any = { ...initialSchoolSettings };

  // Domain Entities - initial default datasets (Empty on fresh install)
  public students: any[] = [];
  public teachers: any[] = [];
  public staff: any[] = [];
  public classes: any[] = [];
  public attendanceRecords: any[] = [];
  public feeCategories: any[] = [];
  public feeStructures: any[] = [];
  public feeInvoices: any[] = [];
  public exams: any[] = [];
  public examSchedules: any[] = [];
  public examResults: any[] = [];
  public timetableSlots: any[] = [];
  public homeworks: any[] = [];
  public libraryBooks: any[] = [];
  public libraryTransactions: any[] = [];
  public vehicles: any[] = [];
  public transportRoutes: any[] = [];
  public payroll: any[] = [];
  public leaveRequests: any[] = [];
  public expenses: any[] = [];
  public notices: any[] = [];
  public messages: any[] = [];
  public notifications: any[] = [];

  public get dbFilePath(): string {
    if (process.env.ELECTRON_USER_DATA) {
      return path.join(process.env.ELECTRON_USER_DATA, 'db_users.json');
    }
    return path.join(process.cwd(), 'server', 'db_users.json');
  }

  constructor() {
    this.initSchoolSettings();
    this.initDefaultUsers();
    this.initEntitiesFromDb();
  }

  public initEntitiesFromDb() {
    try {
      seedDefaultClassesIfEmpty();
      this.classes = getAllClassesFromDb();
      seedDefaultStudentsIfEmpty();
      this.students = getAllStudentsFromDb();
      this.attendanceRecords = getAttendanceRecordsFromDb();
    } catch (err) {
      console.warn('[Store] Error loading entities from SQLite:', err);
    }
  }

  public initSchoolSettings() {
    try {
      const saved = getSavedSchoolConfig();
      if (saved && typeof saved === 'object') {
        this.schoolSettings = { ...initialSchoolSettings, ...saved };
        return;
      }
    } catch (err) {
      console.warn('[Store] Error loading saved school settings from database:', err);
    }
    this.schoolSettings = { ...initialSchoolSettings };
  }

  public saveUsersToDisk() {
    try {
      // 1. Persist directly into SQLite table
      saveAllUsersToDb(this.users);
      console.log(`[Store] Successfully synchronized ${this.users.length} users to persistent SQLite database at: ${getDbPath()}`);
    } catch (err) {
      console.error('[Store] Error saving users to SQLite:', err);
    }

    // 2. Also safely update JSON backup file
    try {
      const targetDir = path.dirname(this.dbFilePath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.writeFileSync(this.dbFilePath, JSON.stringify(this.users, null, 2), 'utf8');
    } catch (err) {
      // Safe guard against read-only packaged app paths
      console.warn('[Store] JSON disk backup notice:', (err as any)?.message || err);
    }
  }

  public initDefaultUsers() {
    // 1. Primary Source of Truth: SQLite Database
    try {
      const dbUsers = getAllUsersFromDb();
      if (Array.isArray(dbUsers) && dbUsers.length > 0) {
        this.users = dbUsers;
        console.log(`[Store] Loaded ${this.users.length} users directly from persistent SQLite database.`);
        return;
      }
    } catch (dbErr) {
      console.warn('[Store] Notice querying SQLite users on initialization:', dbErr);
    }

    // 2. Migration fallback: Check JSON file if SQLite was empty
    const candidatePaths = [
      this.dbFilePath,
      path.join(process.cwd(), 'server', 'db_users.json'),
      path.join(getStoreDir(), 'db_users.json'),
      path.join(getStoreDir(), '../server', 'db_users.json'),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          const raw = fs.readFileSync(p, 'utf8');
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.users = parsed;
            console.log(`[Store] Migrating ${this.users.length} users from JSON file (${p}) into persistent SQLite...`);
            this.saveUsersToDisk();
            return;
          }
        } catch (readErr) {
          console.warn(`[Store] Could not parse users from ${p}:`, readErr);
        }
      }
    }

    // Zero demo users by default on fresh install
    this.users = [];
  }

  /**
   * Comprehensive user lookup supporting Login ID / Username, Email, Prefix, ID, and Name
   */
  public findUserByIdentifier(identifier: string): ServerUser | undefined {
    if (!identifier) return undefined;
    const norm = identifier.trim().toLowerCase();

    // 1. Check in-memory store
    const inMem = this.users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === norm) ||
        u.email.toLowerCase() === norm ||
        u.email.toLowerCase().split('@')[0] === norm ||
        u.id.toLowerCase() === norm ||
        u.name.toLowerCase() === norm
    );

    if (inMem) return inMem;

    // 2. Direct lookup in SQLite in case of real-time multi-process update
    try {
      const fromDb = getUserByLoginId(identifier);
      if (fromDb) {
        // Cache in memory
        const exists = this.users.some((u) => u.id === fromDb.id);
        if (!exists) {
          this.users.push(fromDb);
        }
        return fromDb;
      }
    } catch {}

    return undefined;
  }

  public recordAuditLog(log: {
    userId: string;
    userName: string;
    userRole: string;
    action: string;
    module: string;
    status: 'Success' | 'Failed' | 'Warning';
    ipAddress?: string;
    details: string;
  }) {
    const newLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: log.userId,
      userName: log.userName,
      userRole: log.userRole,
      role: log.userRole,
      action: log.action,
      module: log.module,
      status: log.status,
      ipAddress: log.ipAddress || '127.0.0.1',
      details: log.details,
    };
    this.auditLogs.unshift(newLog);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    return newLog;
  }

  public trackFailedLogin(identifier: string, maxAttempts = 5, lockDurationMinutes = 15): { locked: boolean; remainingAttempts: number; lockTimeRemainingMinutes?: number } {
    const now = Date.now();
    const record = this.failedLogins.get(identifier) || { count: 0, lastAttempt: now };

    if (record.lockedUntil && record.lockedUntil > now) {
      const remainingMs = record.lockedUntil - now;
      return {
        locked: true,
        remainingAttempts: 0,
        lockTimeRemainingMinutes: Math.ceil(remainingMs / 60000),
      };
    }

    record.count += 1;
    record.lastAttempt = now;

    if (record.count >= maxAttempts) {
      record.lockedUntil = now + lockDurationMinutes * 60 * 1000;
      this.failedLogins.set(identifier, record);
      return {
        locked: true,
        remainingAttempts: 0,
        lockTimeRemainingMinutes: lockDurationMinutes,
      };
    }

    this.failedLogins.set(identifier, record);
    return {
      locked: false,
      remainingAttempts: maxAttempts - record.count,
    };
  }

  public clearFailedLogin(identifier: string) {
    this.failedLogins.delete(identifier);
  }

  public isLockedOut(identifier: string): { locked: boolean; lockTimeRemainingMinutes?: number } {
    const record = this.failedLogins.get(identifier);
    if (!record || !record.lockedUntil) return { locked: false };
    const now = Date.now();
    if (record.lockedUntil > now) {
      return {
        locked: true,
        lockTimeRemainingMinutes: Math.ceil((record.lockedUntil - now) / 60000),
      };
    }
    this.failedLogins.delete(identifier);
    return { locked: false };
  }
}

export const serverStore = new ServerStore();
