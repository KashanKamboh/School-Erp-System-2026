import { ERPModuleDefinition, RoleDefinition, SecurityPolicy, RolePermissions } from '../types/erp';

export const erpModulesList: ERPModuleDefinition[] = [
  {
    id: 'students',
    name: 'Students Information',
    category: 'Core Academics',
    description: 'Admissions, profiles, parent directory, and student documents',
  },
  {
    id: 'teachers',
    name: 'Faculty & Teachers',
    category: 'Core Academics',
    description: 'Teacher profiles, designations, qualification credentials, and workload',
  },
  {
    id: 'classes',
    name: 'Classes & Sections',
    category: 'Core Academics',
    description: 'Classrooms, section distribution, class teachers, and capacity',
  },
  {
    id: 'attendance',
    name: 'Attendance Register',
    category: 'Core Academics',
    description: 'Daily student and staff attendance, biometric sync, and absence alerts',
  },
  {
    id: 'exams',
    name: 'Examinations & Grades',
    category: 'Core Academics',
    description: 'Exam scheduling, mark sheets, grade books, and report cards',
  },
  {
    id: 'timetable',
    name: 'Timetables & Slots',
    category: 'Core Academics',
    description: 'Weekly schedule grid, period allocations, and room assignments',
  },
  {
    id: 'homework',
    name: 'Homework & Assignments',
    category: 'Core Academics',
    description: 'Assignment posting, student submissions, and grading rubrics',
  },
  {
    id: 'library',
    name: 'Library & Catalog',
    category: 'Operations & Fleet',
    description: 'Book inventory, issue/return circulation, and overdue fines',
  },
  {
    id: 'transport',
    name: 'Transport & Fleet',
    category: 'Operations & Fleet',
    description: 'School buses, GPS route tracking, drivers, and fuel logs',
  },
  {
    id: 'fees',
    name: 'Fees & Invoicing',
    category: 'Financial & HR',
    description: 'Fee structures, student challans, online gateway payments, and arrears',
  },
  {
    id: 'payroll',
    name: 'Staff & Payroll',
    category: 'Financial & HR',
    description: 'Salary structures, monthly payslip generation, and tax deductions',
  },
  {
    id: 'leaves',
    name: 'Leave Management',
    category: 'Financial & HR',
    description: 'Staff leave applications, approval workflows, and leave quotas',
  },
  {
    id: 'expenses',
    name: 'School Expenses',
    category: 'Financial & HR',
    description: 'Operational bills, utility expenses, inventory purchases, and vouchers',
  },
  {
    id: 'notices',
    name: 'Notice Board & Alerts',
    category: 'Communication & System',
    description: 'Institutional announcements, circulars, and SMS/Email broadcasts',
  },
  {
    id: 'users',
    name: 'User Management & RBAC',
    category: 'Communication & System',
    description: 'Accounts, role assignment, granular permissions, and security policies',
  },
  {
    id: 'audit',
    name: 'Audit Logs & Security',
    category: 'Communication & System',
    description: 'System event trails, login records, and compliance tracking',
  },
];

const fullAccess: RolePermissions = { view: true, create: true, edit: true, delete: true, export: true, print: true, approve: true };
const readOnlyAccess: RolePermissions = { view: true, create: false, edit: false, delete: false, export: false, print: true, approve: false };
const academicStaffAccess: RolePermissions = { view: true, create: true, edit: true, delete: false, export: true, print: true, approve: false };
const financialAccess: RolePermissions = { view: true, create: true, edit: true, delete: false, export: true, print: true, approve: true };
const noAccess: RolePermissions = { view: false, create: false, edit: false, delete: false, export: false, print: false, approve: false };

export const initialRoleDefinitions: RoleDefinition[] = [
  {
    id: 'role-super-admin',
    name: 'Super Admin',
    description: 'Full unrestricted governance, institutional configuration, and system root access',
    isSystem: true,
    color: 'indigo',
    permissions: erpModulesList.reduce((acc, mod) => {
      acc[mod.id] = { ...fullAccess };
      return acc;
    }, {} as Record<string, RolePermissions>),
  },
  {
    id: 'role-school-admin',
    name: 'School Admin',
    description: 'Administrative officer managing daily academic, student, and campus operations',
    isSystem: true,
    color: 'blue',
    permissions: erpModulesList.reduce((acc, mod) => {
      acc[mod.id] = mod.id === 'audit' || mod.id === 'users'
        ? { view: true, create: true, edit: true, delete: false, export: true, print: true, approve: false }
        : { ...fullAccess };
      return acc;
    }, {} as Record<string, RolePermissions>),
  },
  {
    id: 'role-principal',
    name: 'Principal',
    description: 'Head of institution with executive overview, high-level approvals, and academic oversight',
    isSystem: true,
    color: 'purple',
    permissions: erpModulesList.reduce((acc, mod) => {
      acc[mod.id] = { view: true, create: true, edit: true, delete: false, export: true, print: true, approve: true };
      return acc;
    }, {} as Record<string, RolePermissions>),
  },
  {
    id: 'role-teacher',
    name: 'Teacher',
    description: 'Faculty managing student attendance, assignment evaluations, exams, and syllabus',
    isSystem: true,
    color: 'emerald',
    permissions: erpModulesList.reduce((acc, mod) => {
      if (['students', 'attendance', 'exams', 'homework', 'timetable', 'notices'].includes(mod.id)) {
        acc[mod.id] = { ...academicStaffAccess };
      } else if (['library', 'leaves'].includes(mod.id)) {
        acc[mod.id] = { view: true, create: true, edit: false, delete: false, export: false, print: true, approve: false };
      } else {
        acc[mod.id] = { ...noAccess };
      }
      return acc;
    }, {} as Record<string, RolePermissions>),
  },
  {
    id: 'role-accountant',
    name: 'Accountant',
    description: 'Finance desk managing fee collections, invoices, staff payroll, and campus expenses',
    isSystem: true,
    color: 'amber',
    permissions: erpModulesList.reduce((acc, mod) => {
      if (['fees', 'payroll', 'expenses'].includes(mod.id)) {
        acc[mod.id] = { ...financialAccess };
      } else if (['students', 'teachers', 'notices'].includes(mod.id)) {
        acc[mod.id] = { ...readOnlyAccess };
      } else {
        acc[mod.id] = { ...noAccess };
      }
      return acc;
    }, {} as Record<string, RolePermissions>),
  },
  {
    id: 'role-librarian',
    name: 'Librarian',
    description: 'Library curator tracking inventory, cataloging, book issuance, and member returns',
    isSystem: true,
    color: 'teal',
    permissions: erpModulesList.reduce((acc, mod) => {
      if (mod.id === 'library') {
        acc[mod.id] = { view: true, create: true, edit: true, delete: true, export: true, print: true, approve: false };
      } else if (['students', 'teachers', 'notices'].includes(mod.id)) {
        acc[mod.id] = { ...readOnlyAccess };
      } else {
        acc[mod.id] = { ...noAccess };
      }
      return acc;
    }, {} as Record<string, RolePermissions>),
  },
  {
    id: 'role-transport',
    name: 'Transport Manager',
    description: 'Fleet coordinator overseeing school buses, route allocation, drivers, and fuel logs',
    isSystem: true,
    color: 'orange',
    permissions: erpModulesList.reduce((acc, mod) => {
      if (mod.id === 'transport') {
        acc[mod.id] = { view: true, create: true, edit: true, delete: true, export: true, print: true, approve: false };
      } else if (['students', 'notices'].includes(mod.id)) {
        acc[mod.id] = { ...readOnlyAccess };
      } else {
        acc[mod.id] = { ...noAccess };
      }
      return acc;
    }, {} as Record<string, RolePermissions>),
  },
  {
    id: 'role-student',
    name: 'Student',
    description: 'Self-service portal for enrolled learners to access grades, attendance, fees, and homework',
    isSystem: true,
    color: 'cyan',
    permissions: erpModulesList.reduce((acc, mod) => {
      if (['attendance', 'exams', 'timetable', 'homework', 'library', 'notices', 'fees'].includes(mod.id)) {
        acc[mod.id] = { ...readOnlyAccess };
      } else {
        acc[mod.id] = { ...noAccess };
      }
      return acc;
    }, {} as Record<string, RolePermissions>),
  },
  {
    id: 'role-parent',
    name: 'Parent',
    description: 'Guardian portal for tracking children attendance, exam reports, fee dues, and notices',
    isSystem: true,
    color: 'rose',
    permissions: erpModulesList.reduce((acc, mod) => {
      if (['attendance', 'exams', 'timetable', 'homework', 'fees', 'notices', 'transport'].includes(mod.id)) {
        acc[mod.id] = { ...readOnlyAccess };
      } else {
        acc[mod.id] = { ...noAccess };
      }
      return acc;
    }, {} as Record<string, RolePermissions>),
  },
];

export const initialSecurityPolicy: SecurityPolicy = {
  twoFactorRequirement: 'AdminOnly',
  sessionTimeoutMinutes: 60,
  minPasswordLength: 8,
  requireSpecialChars: true,
  passwordExpirationDays: 90,
  maxFailedLoginAttempts: 5,
  restrictLoginHours: false,
  allowedIpRanges: '0.0.0.0/0 (Any Secure Network)',
  forcePasswordResetOnFirstLogin: true,
};
