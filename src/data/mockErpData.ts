import {
  Student,
  Teacher,
  Staff,
  ClassSection,
  FeeStructure,
  FeeInvoice,
  Exam,
  ExamScheduleItem,
  ExamResult,
  TimetableSlot,
  Homework,
  LibraryBook,
  LibraryTransaction,
  Vehicle,
  TransportRoute,
  PayrollRecord,
  LeaveRequest,
  ExpenseRecord,
  Notice,
  MessageItem,
  NotificationItem,
  AuditLog,
  SchoolSettings,
  User,
  AttendanceRecord,
  FeeCategory,
  FeeVoucher,
  FeePayment,
} from '../types/erp';

export const initialSchoolSettings: SchoolSettings = {
  schoolName: '',
  tagline: '',
  affiliationNumber: '',
  registrationNumber: '',
  email: '',
  phone: '',
  address: '',
  website: '',
  principalName: '',
  currency: 'PKR',
  currencySymbol: 'Rs.',
  currentSession: '',
  logoUrl: '',
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

// Zero demo data - Initialized empty on fresh installation
export const initialUsers: User[] = [];
export const initialStudents: Student[] = [];
export const initialTeachers: Teacher[] = [];
export const initialStaff: Staff[] = [];
export const initialClasses: ClassSection[] = [];
export const initialAttendanceRecords: AttendanceRecord[] = [];
export const initialFeeCategoriesList: FeeCategory[] = [];
export const initialFeeStructures: FeeStructure[] = [];
export const initialFeeVouchers: FeeVoucher[] = [];
export const initialFeePayments: FeePayment[] = [];
export const initialFeeInvoices: FeeInvoice[] = [];
export const initialExams: Exam[] = [];
export const initialExamSchedules: ExamScheduleItem[] = [];
export const initialExamResults: ExamResult[] = [];
export const initialTimetableSlots: TimetableSlot[] = [];
export const initialHomeworks: Homework[] = [];
export const initialLibraryBooks: LibraryBook[] = [];
export const initialLibraryTransactions: LibraryTransaction[] = [];
export const initialVehicles: Vehicle[] = [];
export const initialRoutes: TransportRoute[] = [];
export const initialPayroll: PayrollRecord[] = [];
export const initialLeaveRequests: LeaveRequest[] = [];
export const initialExpenses: ExpenseRecord[] = [];
export const initialNotices: Notice[] = [];
export const initialMessages: MessageItem[] = [];
export const initialNotifications: NotificationItem[] = [];
export const initialAuditLogs: AuditLog[] = [];

