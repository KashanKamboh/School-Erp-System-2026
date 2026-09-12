import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { initialUsers, initialStudents, initialTeachers, initialStaff, initialClasses, initialAttendanceRecords, initialFeeStructures, initialFeeInvoices, initialExams, initialExamSchedules, initialExamResults, initialTimetableSlots, initialHomeworks, initialLibraryBooks, initialLibraryTransactions, initialVehicles, initialRoutes, initialPayroll, initialLeaveRequests, initialExpenses, initialNotices, initialMessages, initialNotifications, initialAuditLogs, initialSchoolSettings } from '../src/data/mockErpData.js';
import { initialRoleDefinitions, initialSecurityPolicy } from '../src/data/rbacData.js';
import {
  getSavedSchoolConfig,
  seedDefaultClassesIfEmpty,
  getAllClassesFromDb,
  seedDefaultStudentsIfEmpty,
  getAllStudentsFromDb,
  getAttendanceRecordsFromDb,
} from './db.js';

export interface ServerUser {
  id: string;
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

// In-Memory Database Store with Server Authority
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

  private get dbFilePath(): string {
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
      console.warn('Error loading entities from SQLite:', err);
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
      console.warn('Error loading saved school settings from database:', err);
    }
    this.schoolSettings = { ...initialSchoolSettings };
  }

  public saveUsersToDisk() {
    try {
      fs.writeFileSync(this.dbFilePath, JSON.stringify(this.users, null, 2), 'utf8');
    } catch (err) {
      console.warn('Could not persist users to disk:', err);
    }
  }

  private initDefaultUsers() {
    // Load persistent users from disk if present
    if (fs.existsSync(this.dbFilePath)) {
      try {
        const raw = fs.readFileSync(this.dbFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.users = parsed;
          return;
        }
      } catch (err) {
        console.warn('Error reading saved users:', err);
      }
    }

    // If running in Electron and userData db_users.json is not yet created, check bundled server/db_users.json
    if (process.env.ELECTRON_USER_DATA) {
      const candidatePaths = [
        path.join(process.cwd(), 'server', 'db_users.json'),
        path.join(__dirname, '../server', 'db_users.json'),
        path.join(__dirname, 'db_users.json'),
      ];
      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          try {
            const raw = fs.readFileSync(p, 'utf8');
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              this.users = parsed;
              this.saveUsersToDisk();
              return;
            }
          } catch {}
        }
      }
    }

    // Zero demo users by default on fresh install
    this.users = [];
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
