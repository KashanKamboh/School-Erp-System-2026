import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/apiClient';
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
  AttendanceRecord,
  FeeCategory,
  FeeVoucher,
  FeePayment,
} from '../types/erp';
import {
  initialSchoolSettings,
  initialStudents,
  initialTeachers,
  initialStaff,
  initialClasses,
  initialAttendanceRecords,
  initialFeeCategoriesList,
  initialFeeStructures,
  initialFeeVouchers,
  initialFeePayments,
  initialFeeInvoices,
  initialExams,
  initialExamSchedules,
  initialExamResults,
  initialTimetableSlots,
  initialHomeworks,
  initialLibraryBooks,
  initialLibraryTransactions,
  initialVehicles,
  initialRoutes,
  initialPayroll,
  initialLeaveRequests,
  initialExpenses,
  initialNotices,
  initialMessages,
  initialNotifications,
  initialAuditLogs,
} from '../data/mockErpData';
import { generate500PakistaniStudents } from '../data/pakistaniFeeData';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ERPDataContextType {
  settings: SchoolSettings;
  schoolSettings: SchoolSettings;
  students: Student[];
  teachers: Teacher[];
  staff: Staff[];
  classes: ClassSection[];
  attendanceRecords: AttendanceRecord[];
  feeStructures: FeeStructure[];
  feeCategories: FeeCategory[];
  feeVouchers: FeeVoucher[];
  feePayments: FeePayment[];
  feeInvoices: FeeInvoice[];
  exams: Exam[];
  examSchedules: ExamScheduleItem[];
  examResults: ExamResult[];
  timetableSlots: TimetableSlot[];
  homeworks: Homework[];
  libraryBooks: LibraryBook[];
  libraryTransactions: LibraryTransaction[];
  vehicles: Vehicle[];
  transportRoutes: TransportRoute[];
  payroll: PayrollRecord[];
  leaveRequests: LeaveRequest[];
  leaves: LeaveRequest[];
  expenses: ExpenseRecord[];
  notices: Notice[];
  messages: MessageItem[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  toasts: ToastMessage[];

  // Toast Dispatcher
  showToast: (title: string, description?: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;

  // Student Actions
  addStudent: (student: Omit<Student, 'id' | 'admissionNo'> & { admissionNo?: string }) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;

  // Teacher Actions
  addTeacher: (teacher: Omit<Teacher, 'id' | 'employeeId'>) => void;
  updateTeacher: (id: string, updates: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;

  // Class Actions
  addClass: (cls: Omit<ClassSection, 'id'>) => void;
  updateClass: (id: string, updates: Partial<ClassSection>) => void;
  deleteClass: (id: string) => void;

  // Attendance Actions
  saveAttendance: (records: Omit<AttendanceRecord, 'id'>[]) => Promise<boolean>;
  refreshAttendance: () => Promise<AttendanceRecord[]>;
  refreshStudents: () => Promise<Student[]>;
  refreshClasses: () => Promise<ClassSection[]>;

  // Fee Actions (Pakistani Voucher System & Legacy Invoices)
  addFeeCategory: (category: Omit<FeeCategory, 'id'>) => void;
  updateFeeCategory: (id: string, updates: Partial<FeeCategory>) => void;
  deleteFeeCategory: (id: string) => void;
  addFeeStructure: (item: Omit<FeeStructure, 'id'>) => void;
  updateFeeStructure: (id: string, updates: Partial<FeeStructure>) => void;
  deleteFeeStructure: (id: string) => void;
  refreshFees: () => Promise<void>;
  deleteFeeVoucher: (id: string) => Promise<void>;
  generateBulkVouchers: (vouchers: Omit<FeeVoucher, 'id' | 'voucherNo'>[]) => { generatedCount: number; skippedCount: number; skippedStudents: string[] };
  collectVoucherPayment: (
    voucherId: string,
    amount: number,
    paymentMethod: 'Cash' | 'Bank' | 'Cheque' | 'Online Transfer' | 'Other',
    paymentDate: string,
    receivedBy: string,
    remarks?: string
  ) => { success: boolean; payment?: FeePayment; voucher?: FeeVoucher };
  seed500DemoStudents?: () => void;
  feeMetrics: {
    totalDemanded: number;
    totalCollected: number;
    outstandingFees: number;
    overdueFees: number;
    currentMonthCollection: number;
  };
  addFeeInvoice: (invoice: Omit<FeeInvoice, 'id' | 'invoiceNumber'>) => void;
  collectFeePayment: (
    invoiceId: string,
    amount: number,
    paymentMethod: 'Cash' | 'Bank Transfer' | 'Online Payment' | 'Cheque',
    receivedBy: string,
    notes?: string
  ) => void;

  // Exam Actions
  addExam: (exam: Omit<Exam, 'id'>) => void;
  deleteExam: (id: string) => void;
  refreshExams: () => Promise<void>;
  refreshExamResults: (filter?: { examId?: string; studentId?: string; class?: string; term?: string }) => Promise<void>;
  addExamSchedule: (schedule: Omit<ExamScheduleItem, 'id'>) => void;
  deleteExamSchedule: (id: string) => void;
  saveExamResults: (results: Omit<ExamResult, 'id'>[]) => void;

  // Timetable Actions
  addTimetableSlot: (slot: Omit<TimetableSlot, 'id'>) => Promise<void>;
  deleteTimetableSlot: (id: string) => Promise<void>;
  refreshTimetable: (filters?: { class?: string; section?: string; teacher?: string }) => Promise<void>;

  // Homework Actions
  addHomework: (hw: Omit<Homework, 'id' | 'submissionsCount'>) => Promise<void>;
  deleteHomework: (id: string) => Promise<void>;
  refreshHomework: (filters?: { class?: string; subject?: string; status?: string }) => Promise<void>;
  getHomeworkSubmissions: (homeworkId: string) => Promise<any[]>;
  gradeHomeworkSubmission: (submissionId: string, obtainedMarks: number, teacherFeedback?: string) => Promise<boolean>;
  submitHomework: (submission: any) => Promise<boolean>;

  // Library Actions
  addLibraryBook: (book: Omit<LibraryBook, 'id' | 'bookId'>) => void;
  addBook: (book: any) => void;
  issueBook: (bookId: string, studentId: string, dueDate: string, extra?: string) => void;
  returnBook: (transactionId: string) => void;

  // Transport Actions
  addVehicle: (v: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  addTransportRoute: (rt: Omit<TransportRoute, 'id'>) => void;
  updateTransportRoute: (id: string, updates: Partial<TransportRoute>) => void;
  deleteTransportRoute: (id: string) => void;
  assignStudentToRoute: (studentId: string, routeName: string) => void;
  removeStudentFromRoute: (studentId: string) => void;

  // Staff & Payroll Actions
  addStaff: (stf: Omit<Staff, 'id' | 'employeeId'>) => void;
  saveStaffMember: (stf: Partial<Staff>) => Promise<boolean>;
  deleteStaffMember: (id: string) => Promise<boolean>;
  refreshStaff: () => Promise<Staff[]>;
  addPayrollRecord: (pr: Omit<PayrollRecord, 'id'>) => void;
  markPayrollPaid: (id: string) => void;
  updatePayrollStatus: (id: string, status: 'Paid' | 'Pending' | 'Processing', paymentMethod?: string, paymentDate?: string) => void;
  refreshPayroll: (month?: string) => Promise<PayrollRecord[]>;
  generateMonthlyPayroll: (month: string) => Promise<{ success: boolean; generated: number; skipped: number; totalAmount: number }>;
  disburseBulkPayroll: (recordIds: string[], paymentMethod?: string, paymentDate?: string) => Promise<{ success: boolean; updated: number }>;

  // Convenience Aliases & Analytics
  markAttendance: (studentId: string, date: string, status: 'Present' | 'Absent' | 'Late' | 'Leave', remarks?: string) => void;
  payrollRecords: PayrollRecord[];
  homework: Homework[];
  timetables: TimetableSlot[];
  analyticsData: {
    revenueVsExpense: { month: string; revenue: number; expenses: number }[];
    monthlyRevenue?: { month: string; revenue: number; target: number; expenses: number }[];
    attendanceTrends?: { day: string; attendance: number; target: number; students: number; teachers: number; presentCount?: number; absentCount?: number }[];
    weeklyAttendanceTrends?: { day: string; students: number; teachers: number; target: number; presentCount: number; absentCount: number }[];
    monthlyAttendanceTrends?: { month: string; students: number; teachers: number; target: number; averageRate: number; workingDays: number }[];
    dailyAttendance?: { day: string; rate: number }[];
    classAttendanceOverview: { name: string; attendance: number }[];
    gradeDistribution: { grade: string; count: number }[];
    feeCollectionStats: { collected: number; pending: number; overdue: number; total: number };
    totalStudents: number;
    totalTeachers: number;
    totalStaff: number;
    totalClasses: number;
    attendanceTodayRate: number;
  };

  // Leave Actions
  applyLeave: (req: Omit<LeaveRequest, 'id' | 'appliedDate' | 'status'>) => void;
  addLeave: (req: Omit<LeaveRequest, 'id' | 'appliedDate' | 'status'>) => void;
  updateLeaveStatus: (id: string, status: 'Approved' | 'Rejected', remarks?: string, approvedBy?: string) => void;

  // Expense Actions
  addExpense: (exp: Omit<ExpenseRecord, 'id'>) => void;
  deleteExpense: (id: string) => void;

  // Notice Actions
  addNotice: (nt: Omit<Notice, 'id' | 'publishedDate'>) => void;
  deleteNotice: (id: string) => void;

  // Messages Actions
  sendMessage: (msg: Omit<MessageItem, 'id' | 'timestamp' | 'read'>) => void;
  markMessageRead: (id: string) => void;

  // Notification Actions
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Settings & System
  updateSettings: (updates: Partial<SchoolSettings>) => void;
  updateSchoolSettings: (updates: Partial<SchoolSettings>) => void;
  refreshSchoolSettings: () => Promise<SchoolSettings | null>;
  addAuditLog: (action: string, module: string, details: string, status?: 'Success' | 'Warning' | 'Failed') => void;
  resetToDefaults: () => void;
}

const CURRENT_STORAGE_VERSION = 'edupulse_v7_zero_demo_strict';

// Purge any lingering obsolete demo data from browser localStorage
if (typeof window !== 'undefined') {
  const version = localStorage.getItem('edupulse_db_version');
  if (version !== CURRENT_STORAGE_VERSION) {
    const keysToPurge = [
      'edupulse_settings',
      'edupulse_students',
      'edupulse_teachers',
      'edupulse_staff',
      'edupulse_classes',
      'edupulse_attendance',
      'edupulse_feestruct',
      'edupulse_feecategories',
      'edupulse_feevouchers',
      'edupulse_feepayments',
      'edupulse_feeinvoices',
      'edupulse_exams',
      'edupulse_examschedules',
      'edupulse_examresults',
      'edupulse_timetable',
      'edupulse_homeworks',
      'edupulse_librarybooks',
      'edupulse_librarytx',
      'edupulse_vehicles',
      'edupulse_routes',
      'edupulse_payroll',
      'edupulse_leaves',
      'edupulse_expenses',
      'edupulse_notices',
      'edupulse_messages',
      'edupulse_notifs',
      'edupulse_auditlogs',
    ];
    keysToPurge.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem('edupulse_db_version', CURRENT_STORAGE_VERSION);
  }
}

const ERPDataContext = createContext<ERPDataContextType | undefined>(undefined);

export const ERPDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const loadState = <T,>(key: string, defaultVal: T): T => {
    try {
      const saved = localStorage.getItem(`edupulse_${key}`);
      if (!saved) return defaultVal;
      const parsed = JSON.parse(saved);
      if (parsed === null || parsed === undefined) return defaultVal;
      if (Array.isArray(defaultVal)) {
        if (!Array.isArray(parsed)) return defaultVal;
        return parsed as T;
      }
      if (typeof defaultVal === 'object' && defaultVal !== null) {
        if (typeof parsed !== 'object' || Array.isArray(parsed)) return defaultVal;
        return { ...defaultVal, ...parsed };
      }
      return parsed as T;
    } catch {
      return defaultVal;
    }
  };

  const [settings, setSettings] = useState<SchoolSettings>(() => loadState('settings', initialSchoolSettings));
  const [students, setStudents] = useState<Student[]>(() => loadState('students', initialStudents));
  const [teachers, setTeachers] = useState<Teacher[]>(() => loadState('teachers', initialTeachers));
  const [staff, setStaff] = useState<Staff[]>(() => loadState('staff', initialStaff));
  const [classes, setClasses] = useState<ClassSection[]>(() => loadState('classes', initialClasses));
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => loadState('attendance', initialAttendanceRecords));
  const [feeCategories, setFeeCategories] = useState<FeeCategory[]>(() => loadState('feecategories', initialFeeCategoriesList));
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>(() => loadState('feestruct', initialFeeStructures));
  const [feeVouchers, setFeeVouchers] = useState<FeeVoucher[]>(() => loadState('feevouchers', initialFeeVouchers));
  const [feePayments, setFeePayments] = useState<FeePayment[]>(() => loadState('feepayments', initialFeePayments));
  const [feeInvoices, setFeeInvoices] = useState<FeeInvoice[]>(() => loadState('feeinvoices', initialFeeInvoices));
  const [exams, setExams] = useState<Exam[]>(() => loadState('exams', initialExams));
  const [examSchedules, setExamSchedules] = useState<ExamScheduleItem[]>(() => loadState('examschedules', initialExamSchedules));
  const [examResults, setExamResults] = useState<ExamResult[]>(() => loadState('examresults', initialExamResults));
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>(() => loadState('timetable', initialTimetableSlots));
  const [homeworks, setHomeworks] = useState<Homework[]>(() => loadState('homeworks', initialHomeworks));
  const [libraryBooks, setLibraryBooks] = useState<LibraryBook[]>(() => loadState('librarybooks', initialLibraryBooks));
  const [libraryTransactions, setLibraryTransactions] = useState<LibraryTransaction[]>(() => loadState('librarytx', initialLibraryTransactions));
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => loadState('vehicles', initialVehicles));
  const [transportRoutes, setTransportRoutes] = useState<TransportRoute[]>(() => loadState('routes', initialRoutes));
  const [payroll, setPayroll] = useState<PayrollRecord[]>(() => loadState('payroll', initialPayroll));
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => loadState('leaves', initialLeaveRequests));
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => loadState('expenses', initialExpenses));
  const [notices, setNotices] = useState<Notice[]>(() => loadState('notices', initialNotices));
  const [messages, setMessages] = useState<MessageItem[]>(() => loadState('messages', initialMessages));
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => loadState('notifs', initialNotifications));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadState('auditlogs', initialAuditLogs));

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Persistent storage sync
  useEffect(() => {
    try {
      localStorage.setItem('edupulse_settings', JSON.stringify(settings));
    } catch {
      // Safe fallback if base64 signature/logo exceeds browser localStorage limit
    }
  }, [settings]);
  useEffect(() => { localStorage.setItem('edupulse_students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('edupulse_teachers', JSON.stringify(teachers)); }, [teachers]);
  useEffect(() => { localStorage.setItem('edupulse_staff', JSON.stringify(staff)); }, [staff]);
  useEffect(() => { localStorage.setItem('edupulse_classes', JSON.stringify(classes)); }, [classes]);
  useEffect(() => { localStorage.setItem('edupulse_attendance', JSON.stringify(attendanceRecords)); }, [attendanceRecords]);
  useEffect(() => { localStorage.setItem('edupulse_feecategories', JSON.stringify(feeCategories)); }, [feeCategories]);
  useEffect(() => { localStorage.setItem('edupulse_feestruct', JSON.stringify(feeStructures)); }, [feeStructures]);
  useEffect(() => { localStorage.setItem('edupulse_feevouchers', JSON.stringify(feeVouchers)); }, [feeVouchers]);
  useEffect(() => { localStorage.setItem('edupulse_feepayments', JSON.stringify(feePayments)); }, [feePayments]);
  useEffect(() => { localStorage.setItem('edupulse_feeinvoices', JSON.stringify(feeInvoices)); }, [feeInvoices]);
  useEffect(() => { localStorage.setItem('edupulse_exams', JSON.stringify(exams)); }, [exams]);
  useEffect(() => { localStorage.setItem('edupulse_examschedules', JSON.stringify(examSchedules)); }, [examSchedules]);
  useEffect(() => { localStorage.setItem('edupulse_examresults', JSON.stringify(examResults)); }, [examResults]);
  useEffect(() => { localStorage.setItem('edupulse_timetable', JSON.stringify(timetableSlots)); }, [timetableSlots]);
  useEffect(() => { localStorage.setItem('edupulse_homeworks', JSON.stringify(homeworks)); }, [homeworks]);
  useEffect(() => { localStorage.setItem('edupulse_librarybooks', JSON.stringify(libraryBooks)); }, [libraryBooks]);
  useEffect(() => { localStorage.setItem('edupulse_librarytx', JSON.stringify(libraryTransactions)); }, [libraryTransactions]);
  useEffect(() => { localStorage.setItem('edupulse_vehicles', JSON.stringify(vehicles)); }, [vehicles]);
  useEffect(() => { localStorage.setItem('edupulse_routes', JSON.stringify(transportRoutes)); }, [transportRoutes]);
  useEffect(() => { localStorage.setItem('edupulse_payroll', JSON.stringify(payroll)); }, [payroll]);
  useEffect(() => { localStorage.setItem('edupulse_leaves', JSON.stringify(leaveRequests)); }, [leaveRequests]);
  useEffect(() => { localStorage.setItem('edupulse_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('edupulse_notices', JSON.stringify(notices)); }, [notices]);
  useEffect(() => { localStorage.setItem('edupulse_messages', JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem('edupulse_notifs', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('edupulse_auditlogs', JSON.stringify(auditLogs)); }, [auditLogs]);

  // Toast Helpers
  const showToast = useCallback((title: string, description?: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = 'toast-' + Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  // Single Source of Truth: Fetch Institutional Settings directly from backend SQLite database
  const refreshSchoolSettings = useCallback(async (): Promise<SchoolSettings | null> => {
    try {
      const res = await api.get<{ settings?: SchoolSettings }>('/erp/settings');
      if (res && res.settings && (res.settings.schoolName || res.settings.phone || res.settings.email)) {
        setSettings((prev) => ({ ...prev, ...res.settings }));
        return res.settings;
      }
    } catch {
      // Fallback if not yet authenticated or token missing
    }

    try {
      const statusRes = await api.get<{ schoolConfig?: SchoolSettings }>('/setup/status');
      if (statusRes && statusRes.schoolConfig && (statusRes.schoolConfig.schoolName || statusRes.schoolConfig.phone || statusRes.schoolConfig.email)) {
        setSettings((prev) => ({ ...prev, ...statusRes.schoolConfig }));
        return statusRes.schoolConfig;
      }
    } catch {
      // Ignore network errors on init
    }

    return null;
  }, []);

  // Single Source of Truth: Fetch Attendance directly from backend SQLite database
  const refreshAttendance = useCallback(async (): Promise<AttendanceRecord[]> => {
    try {
      const res = await api.get<{ attendance?: AttendanceRecord[] }>('/erp/attendance');
      if (res && Array.isArray(res.attendance)) {
        setAttendanceRecords(res.attendance);
        return res.attendance;
      }
    } catch (err) {
      console.warn('Could not load attendance from database:', err);
    }
    return [];
  }, []);

  // Single Source of Truth: Fetch Students directly from backend SQLite database
  const refreshStudents = useCallback(async (): Promise<Student[]> => {
    try {
      const res = await api.get<{ students?: Student[] }>('/students');
      if (res && Array.isArray(res.students) && res.students.length > 0) {
        setStudents(res.students);
        return res.students;
      }
    } catch (err) {
      console.warn('Could not load students from database:', err);
    }
    return [];
  }, []);

  // Single Source of Truth: Fetch Classes directly from backend SQLite database
  const refreshClasses = useCallback(async (): Promise<ClassSection[]> => {
    try {
      const res = await api.get<{ classes?: ClassSection[] }>('/erp/classes');
      if (res && Array.isArray(res.classes) && res.classes.length > 0) {
        setClasses(res.classes);
        return res.classes;
      }
    } catch (err) {
      console.warn('Could not load classes from database:', err);
    }
    return [];
  }, []);

  // Single Source of Truth: Fetch Fees directly from backend SQLite database
  const refreshFees = useCallback(async (): Promise<void> => {
    try {
      const [structRes, vouchersRes, paymentsRes] = await Promise.allSettled([
        api.get<{ success: boolean; categories?: FeeCategory[]; structures?: FeeStructure[] }>('/erp/fee-structures'),
        api.get<{ success: boolean; vouchers?: FeeVoucher[] }>('/erp/fee-vouchers'),
        api.get<{ success: boolean; payments?: FeePayment[] }>('/erp/fee-payments'),
      ]);

      if (structRes.status === 'fulfilled' && structRes.value) {
        if (Array.isArray(structRes.value.categories) && structRes.value.categories.length > 0) {
          setFeeCategories(structRes.value.categories);
        }
        if (Array.isArray(structRes.value.structures) && structRes.value.structures.length > 0) {
          setFeeStructures(structRes.value.structures);
        }
      }

      if (vouchersRes.status === 'fulfilled' && vouchersRes.value && Array.isArray(vouchersRes.value.vouchers)) {
        setFeeVouchers(vouchersRes.value.vouchers);
      }

      if (paymentsRes.status === 'fulfilled' && paymentsRes.value && Array.isArray(paymentsRes.value.payments)) {
        setFeePayments(paymentsRes.value.payments);
      }
    } catch (err) {
      console.warn('Could not load fees from database:', err);
    }
  }, []);

  // Single Source of Truth: Fetch Staff & Faculty from SQLite database
  const refreshStaff = useCallback(async (): Promise<Staff[]> => {
    try {
      const res = await api.get<{ staff?: Staff[] }>('/erp/staff');
      if (res && Array.isArray(res.staff) && res.staff.length > 0) {
        setStaff(res.staff);
        return res.staff;
      }
    } catch (err) {
      console.warn('Could not load staff from database:', err);
    }
    return [];
  }, []);

  // Single Source of Truth: Fetch Payroll records from SQLite database
  const refreshPayroll = useCallback(async (month?: string): Promise<PayrollRecord[]> => {
    try {
      const url = month && month !== 'All Months' ? `/erp/payroll?month=${encodeURIComponent(month)}` : '/erp/payroll';
      const res = await api.get<{ payroll?: PayrollRecord[] }>(url);
      if (res && Array.isArray(res.payroll) && res.payroll.length > 0) {
        setPayroll(res.payroll);
        return res.payroll;
      }
    } catch (err) {
      console.warn('Could not load payroll from database:', err);
    }
    return [];
  }, []);

  // Single Source of Truth: Fetch Exams & Schedules from SQLite database
  const refreshExams = useCallback(async (): Promise<void> => {
    try {
      const res = await api.get<{ exams?: Exam[]; schedules?: ExamScheduleItem[] }>('/erp/exams');
      if (res?.exams && Array.isArray(res.exams) && res.exams.length > 0) {
        setExams(res.exams);
      }
      if (res?.schedules && Array.isArray(res.schedules)) {
        setExamSchedules(res.schedules);
      }
    } catch (err) {
      console.warn('Could not load exams from database:', err);
    }
  }, []);

  // Single Source of Truth: Fetch Exam Results from SQLite database
  const refreshExamResults = useCallback(async (filter?: { examId?: string; studentId?: string; class?: string; term?: string }): Promise<void> => {
    try {
      const params = new URLSearchParams();
      if (filter?.examId) params.set('examId', filter.examId);
      if (filter?.studentId) params.set('studentId', filter.studentId);
      if (filter?.class) params.set('class', filter.class);
      if (filter?.term) params.set('term', filter.term);
      const qs = params.toString() ? `?${params.toString()}` : '';

      const res = await api.get<{ results?: ExamResult[] }>(`/erp/exam-results${qs}`);
      if (res?.results && Array.isArray(res.results)) {
        setExamResults(res.results);
      }
    } catch (err) {
      console.warn('Could not load exam results from database:', err);
    }
  }, []);

  // Single Source of Truth: Fetch Timetable slots from SQLite database
  const refreshTimetable = useCallback(async (filters?: { class?: string; section?: string; teacher?: string }): Promise<void> => {
    try {
      const params = new URLSearchParams();
      if (filters?.class) params.set('class', filters.class);
      if (filters?.section) params.set('section', filters.section);
      if (filters?.teacher) params.set('teacher', filters.teacher);
      const qs = params.toString() ? `?${params.toString()}` : '';

      const res = await api.get<{ timetable?: TimetableSlot[] }>(`/erp/timetable${qs}`);
      if (res?.timetable && Array.isArray(res.timetable)) {
        setTimetableSlots(res.timetable);
      }
    } catch (err) {
      console.warn('Could not load timetable from database:', err);
    }
  }, []);

  // Single Source of Truth: Fetch Homework assignments from SQLite database
  const refreshHomework = useCallback(async (filters?: { class?: string; subject?: string; status?: string }): Promise<void> => {
    try {
      const params = new URLSearchParams();
      if (filters?.class) params.set('class', filters.class);
      if (filters?.subject) params.set('subject', filters.subject);
      if (filters?.status) params.set('status', filters.status);
      const qs = params.toString() ? `?${params.toString()}` : '';

      const res = await api.get<{ homeworks?: Homework[] }>(`/erp/homework${qs}`);
      if (res?.homeworks && Array.isArray(res.homeworks)) {
        setHomeworks(res.homeworks);
      }
    } catch (err) {
      console.warn('Could not load homework from database:', err);
    }
  }, []);

  // Load canonical school settings, students, classes, attendance records, fees, staff, payroll, exams, timetable, and homework from database on mount
  useEffect(() => {
    refreshSchoolSettings();
    refreshStudents();
    refreshClasses();
    refreshAttendance();
    refreshFees();
    refreshStaff();
    refreshPayroll();
    refreshExams();
    refreshExamResults();
    refreshTimetable();
    refreshHomework();
  }, [refreshSchoolSettings, refreshStudents, refreshClasses, refreshAttendance, refreshFees, refreshStaff, refreshPayroll, refreshExams, refreshExamResults, refreshTimetable, refreshHomework]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Audit Logger
  const addAuditLog = useCallback((action: string, module: string, details: string, status: 'Success' | 'Warning' | 'Failed' = 'Success') => {
    const newLog: AuditLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: 'current-user',
      userName: 'Active Administrator',
      role: 'Super Admin',
      action,
      module,
      ipAddress: '192.168.1.104',
      details,
      status,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  }, []);

  // Student CRUD
  const addStudent = (stData: Omit<Student, 'id' | 'admissionNo'> & { admissionNo?: string }) => {
    const nextNum = (students.length + 1).toString().padStart(3, '0');
    const newStudent: Student = {
      ...stData,
      id: 'std-' + Date.now(),
      admissionNo: stData.admissionNo || `GIA-2026-${nextNum}`,
      attendanceRate: 100,
      feeStatus: 'Pending',
      status: 'Active',
    };
    setStudents((prev) => [newStudent, ...prev]);
    addAuditLog('STUDENT_CREATED', 'Student Management', `Added student ${newStudent.firstName} ${newStudent.lastName} (${newStudent.admissionNo})`);
    showToast('Student Enrolled Successfully', `${newStudent.firstName} ${newStudent.lastName} has been added with Admission ID: ${newStudent.admissionNo}`);
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    addAuditLog('STUDENT_UPDATED', 'Student Management', `Updated profile of student ID ${id}`);
    showToast('Student Updated', 'Student record has been successfully updated.');
  };

  const deleteStudent = (id: string) => {
    const target = students.find((s) => s.id === id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
    addAuditLog('STUDENT_DELETED', 'Student Management', `Removed student ${target?.firstName || id}`);
    showToast('Student Removed', 'Student record was removed from the database.', 'warning');
  };

  // Teacher CRUD
  const addTeacher = (tchData: Omit<Teacher, 'id' | 'employeeId'>) => {
    const nextNum = (teachers.length + 1).toString().padStart(2, '0');
    const newTeacher: Teacher = {
      ...tchData,
      id: 'tch-' + Date.now(),
      employeeId: `TCH-2026-${nextNum}`,
      attendanceRate: 100,
      leaveBalance: 18,
    };
    setTeachers((prev) => [newTeacher, ...prev]);
    addAuditLog('TEACHER_CREATED', 'Teacher Management', `Appointed faculty ${newTeacher.name} (${newTeacher.employeeId})`);
    showToast('Teacher Appointed', `${newTeacher.name} added to the faculty directory.`);
  };

  const updateTeacher = (id: string, updates: Partial<Teacher>) => {
    setTeachers((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    addAuditLog('TEACHER_UPDATED', 'Teacher Management', `Updated details for teacher ID ${id}`);
    showToast('Teacher Updated', 'Faculty details updated successfully.');
  };

  const deleteTeacher = (id: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    addAuditLog('TEACHER_REMOVED', 'Teacher Management', `Removed teacher ID ${id}`);
    showToast('Teacher Removed', 'Teacher record was removed.', 'warning');
  };

  // Class CRUD
  const addClass = (cls: Omit<ClassSection, 'id'>) => {
    const newCls: ClassSection = {
      ...cls,
      id: 'cls-' + Date.now(),
    };
    setClasses((prev) => [...prev, newCls]);
    addAuditLog('CLASS_CREATED', 'Class Management', `Created ${newCls.name} Section ${newCls.section}`);
    showToast('Class Created', `${newCls.name} - Sec ${newCls.section} added successfully.`);
  };

  const updateClass = (id: string, updates: Partial<ClassSection>) => {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    showToast('Class Updated', 'Class details have been saved.');
  };

  const deleteClass = (id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    showToast('Class Deleted', 'Class removed successfully.', 'warning');
  };

  // Attendance (Database-backed with Duplicate Prevention & Upsert)
  const saveAttendance = async (records: Omit<AttendanceRecord, 'id'>[]): Promise<boolean> => {
    if (!records || records.length === 0) return false;

    const newRecords: AttendanceRecord[] = records.map((r, i) => ({
      ...r,
      id: (r as any).id || `att-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
    }));

    try {
      // 1. Post to backend SQLite API
      await api.post('/erp/attendance', { records: newRecords });

      // 2. Atomically update local state: replace any existing record with same studentId + date
      setAttendanceRecords((prev) => {
        const studentDateMap = new Set(newRecords.map((nr) => `${nr.studentId}_${nr.date}`));
        const filteredPrev = prev.filter((p) => !studentDateMap.has(`${p.studentId}_${p.date}`));
        return [...newRecords, ...filteredPrev];
      });

      const sample = records[0];
      addAuditLog(
        'ATTENDANCE_RECORDED',
        'Attendance',
        `Recorded attendance for ${sample.class} ${sample.section} on ${sample.date} (${records.length} students)`
      );
      showToast(
        'Attendance Saved to Database',
        `Attendance for ${sample.class} - ${sample.section} (${sample.date}) saved permanently to database.`,
        'success'
      );
      return true;
    } catch (err: any) {
      console.error('Failed to save attendance to SQLite API:', err);
      // Retain locally in case of offline/network glitch
      setAttendanceRecords((prev) => {
        const studentDateMap = new Set(newRecords.map((nr) => `${nr.studentId}_${nr.date}`));
        const filteredPrev = prev.filter((p) => !studentDateMap.has(`${p.studentId}_${p.date}`));
        return [...newRecords, ...filteredPrev];
      });
      showToast('Save Alert', err?.message || 'Attendance stored locally, database sync attempted.', 'warning');
      return true;
    }
  };

  // Fee Management
  const addFeeInvoice = (invData: Omit<FeeInvoice, 'id' | 'invoiceNumber'>) => {
    const nextNum = (feeInvoices.length + 1).toString().padStart(4, '0');
    const newInvoice: FeeInvoice = {
      ...invData,
      id: 'inv-' + Date.now(),
      invoiceNumber: `INV-2026-${nextNum}`,
      status: invData.paidAmount >= invData.totalPayable ? 'Paid' : invData.paidAmount > 0 ? 'Partial' : 'Pending',
    };
    setFeeInvoices((prev) => [newInvoice, ...prev]);
    addAuditLog('FEE_INVOICE_GENERATED', 'Fee Management', `Created invoice ${newInvoice.invoiceNumber} for ${newInvoice.studentName} ($${newInvoice.totalPayable})`);
    showToast('Invoice Generated', `Invoice ${newInvoice.invoiceNumber} created for ${newInvoice.studentName}`);
  };

  const collectFeePayment = (
    invoiceId: string,
    amount: number,
    paymentMethod: 'Cash' | 'Bank Transfer' | 'Online Payment' | 'Cheque',
    receivedBy: string,
    notes?: string
  ) => {
    setFeeInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          const newPaid = inv.paidAmount + amount;
          const newDue = Math.max(0, inv.totalPayable - newPaid);
          const newStatus = newDue === 0 ? 'Paid' : newPaid > 0 ? 'Partial' : 'Pending';

          // Also update student feeStatus
          setStudents((sList) =>
            sList.map((st) => (st.id === inv.studentId ? { ...st, feeStatus: newStatus } : st))
          );

          addAuditLog('FEE_PAYMENT_COLLECTED', 'Fee Management', `Collected $${amount} for ${inv.invoiceNumber} via ${paymentMethod}`);

          return {
            ...inv,
            paidAmount: newPaid,
            dueAmount: newDue,
            status: newStatus,
            paymentDate: new Date().toISOString().substring(0, 10),
            paymentMethod,
            receivedBy,
            notes: notes || inv.notes,
          };
        }
        return inv;
      })
    );
    showToast('Payment Processed', `Payment of $${amount.toFixed(2)} recorded successfully.`);
  };

  // Pakistani Fee System Handlers
  const addFeeCategory = (category: Omit<FeeCategory, 'id'>) => {
    const newCat: FeeCategory = {
      ...category,
      id: 'cat-' + Date.now() + Math.random().toString(36).substring(2, 5),
      createdAt: new Date().toISOString().substring(0, 10),
    };
    setFeeCategories((prev) => [...prev, newCat]);
    addAuditLog('FEE_CATEGORY_ADDED', 'Fee Structure', `Added fee category: ${newCat.name} (${newCat.studentType})`);
    showToast('Category Added', `Fee category "${newCat.name}" configured.`);
  };

  const updateFeeCategory = (id: string, updates: Partial<FeeCategory>) => {
    setFeeCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    addAuditLog('FEE_CATEGORY_UPDATED', 'Fee Structure', `Updated fee category ID: ${id}`);
    showToast('Category Updated', 'Fee category settings saved.');
  };

  const deleteFeeCategory = (id: string) => {
    setFeeCategories((prev) => prev.filter((c) => c.id !== id));
    addAuditLog('FEE_CATEGORY_DELETED', 'Fee Structure', `Deleted fee category ID: ${id}`);
    showToast('Category Removed', 'Fee category deleted.', 'info');
  };

  const addFeeStructure = (item: Omit<FeeStructure, 'id'>) => {
    const newStruct: FeeStructure = {
      ...item,
      id: 'fs-' + Date.now() + Math.random().toString(36).substring(2, 5),
      name: item.name || item.feeName || 'School Fee',
      feeName: item.feeName || item.name || 'School Fee',
      createdAt: new Date().toISOString().substring(0, 10),
    };
    setFeeStructures((prev) => [...prev, newStruct]);
    api.post('/erp/fee-structures', newStruct).catch(() => {});

    addAuditLog('FEE_STRUCTURE_ADDED', 'Fee Structure', `Configured fee: ${newStruct.feeName} (Rs. ${newStruct.amount}) for ${newStruct.studentType} students`);
    showToast('Fee Structure Saved', `${newStruct.feeName} (Rs. ${newStruct.amount.toLocaleString()}) added.`);
  };

  const updateFeeStructure = (id: string, updates: Partial<FeeStructure>) => {
    setFeeStructures((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates, feeName: updates.feeName || updates.name || f.feeName, name: updates.feeName || updates.name || f.name } : f))
    );
    api.put(`/erp/fee-structures/${id}`, updates).catch(() => {});

    addAuditLog('FEE_STRUCTURE_UPDATED', 'Fee Structure', `Updated fee rule ID: ${id}`);
    showToast('Fee Structure Updated', 'Fee configuration updated successfully.');
  };

  const deleteFeeStructure = (id: string) => {
    setFeeStructures((prev) => prev.filter((f) => f.id !== id));
    api.delete(`/erp/fee-structures/${id}`).catch(() => {});
    addAuditLog('FEE_STRUCTURE_DELETED', 'Fee Structure', `Deleted fee rule ID: ${id}`);
    showToast('Fee Structure Removed', 'Removed fee structure item.', 'info');
  };

  const generateBulkVouchers = (vouchersToCreate: Omit<FeeVoucher, 'id' | 'voucherNo'>[]) => {
    const existing = [...feeVouchers];
    const generated: FeeVoucher[] = [];
    const skippedStudents: string[] = [];

    let currentMaxSeq = existing.reduce((max, v) => {
      const match = v.voucherNo?.match(/FV-\d{4}-(\d+)/);
      if (match) {
        const seq = parseInt(match[1], 10);
        return seq > max ? seq : max;
      }
      return max;
    }, 0);

    const yearPrefix = new Date().getFullYear();

    for (const vData of vouchersToCreate) {
      const duplicate = existing.some(
        (ex) =>
          ex.studentId === vData.studentId &&
          ex.feeMonth.trim().toLowerCase() === vData.feeMonth.trim().toLowerCase() &&
          ex.academicYear.trim().toLowerCase() === vData.academicYear.trim().toLowerCase()
      );

      if (duplicate) {
        skippedStudents.push(`${vData.studentName} (${vData.admissionNo})`);
        continue;
      }

      currentMaxSeq += 1;
      const voucherNo = `FV-${yearPrefix}-${currentMaxSeq.toString().padStart(4, '0')}`;
      const voucherId = 'fv-' + yearPrefix + '-' + currentMaxSeq.toString().padStart(4, '0');

      const itemsWithId = (vData.items || []).map((itm, idx) => ({
        ...itm,
        id: itm.id || `fvi-${currentMaxSeq}-${idx + 1}`,
        voucherId,
        srNo: idx + 1,
      }));

      const totalPayable = Math.max(
        0,
        (vData.currentCharges || 0) + (vData.previousBalance || 0) - (vData.discount || 0) + (vData.fine || 0)
      );

      const newVoucher: FeeVoucher = {
        ...vData,
        id: voucherId,
        voucherNo,
        items: itemsWithId,
        totalPayable,
        paidAmount: 0,
        remainingBalance: totalPayable,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      generated.push(newVoucher);
      existing.push(newVoucher);
    }

    if (generated.length > 0) {
      setFeeVouchers((prev) => [...generated, ...prev]);

      api.post('/erp/fee-vouchers/generate', {
        academicYear: vouchersToCreate[0]?.academicYear,
        feeMonth: vouchersToCreate[0]?.feeMonth,
        dueDate: vouchersToCreate[0]?.dueDate,
        vouchers: generated,
      })
        .then(() => {
          refreshFees();
          refreshStudents();
        })
        .catch((err) => {
          console.warn('Backend fee voucher sync notice:', err);
        });

      addAuditLog(
        'BULK_VOUCHERS_GENERATED',
        'Fee Vouchers',
        `Generated ${generated.length} fee vouchers for ${vouchersToCreate[0]?.feeMonth || 'selected month'}. Skipped ${skippedStudents.length} duplicates.`
      );

      showToast(
        'Vouchers Generated',
        `Generated ${generated.length} fee voucher${generated.length > 1 ? 's' : ''}.${skippedStudents.length > 0 ? ` (${skippedStudents.length} duplicate${skippedStudents.length > 1 ? 's' : ''} skipped)` : ''}`,
        'success'
      );
    } else if (skippedStudents.length > 0) {
      showToast(
        'Generation Skipped',
        `All ${skippedStudents.length} student${skippedStudents.length > 1 ? 's' : ''} already have vouchers for this month. No duplicates created.`,
        'warning'
      );
    }

    return {
      generatedCount: generated.length,
      skippedCount: skippedStudents.length,
      skippedStudents,
    };
  };

  const collectVoucherPayment = (
    voucherId: string,
    amount: number,
    paymentMethod: 'Cash' | 'Bank' | 'Cheque' | 'Online Transfer' | 'Other',
    paymentDate: string,
    receivedBy: string,
    remarks?: string
  ) => {
    const targetVoucher = feeVouchers.find((v) => v.id === voucherId);
    if (!targetVoucher) {
      showToast('Error', 'Fee voucher not found.', 'error');
      return { success: false };
    }

    if (amount <= 0) {
      showToast('Invalid Amount', 'Payment amount must be greater than Rs. 0.', 'error');
      return { success: false };
    }

    const newPaid = (targetVoucher.paidAmount || 0) + amount;
    const remainingBalance = Math.max(0, targetVoucher.totalPayable - newPaid);

    let newStatus: 'PENDING' | 'PARTIALLY PAID' | 'PAID' | 'OVERDUE';
    if (remainingBalance === 0) {
      newStatus = 'PAID';
    } else if (newPaid > 0) {
      newStatus = 'PARTIALLY PAID';
    } else {
      const isPastDue = new Date(targetVoucher.dueDate) < new Date();
      newStatus = isPastDue ? 'OVERDUE' : 'PENDING';
    }

    const year = new Date().getFullYear();
    const nextReceiptSeq = feePayments.length + 1;
    const receiptNo = `RCP-${year}-${nextReceiptSeq.toString().padStart(4, '0')}`;
    const paymentId = `pay-${year}-${nextReceiptSeq.toString().padStart(4, '0')}`;

    const newPayment: FeePayment = {
      id: paymentId,
      voucherId: targetVoucher.id,
      voucherNo: targetVoucher.voucherNo,
      receiptNo,
      studentId: targetVoucher.studentId,
      studentName: targetVoucher.studentName,
      fatherName: targetVoucher.fatherName,
      admissionNo: targetVoucher.admissionNo,
      class: targetVoucher.class,
      section: targetVoucher.section,
      amountPaid: amount,
      previousPaid: targetVoucher.paidAmount || 0,
      remainingBalance,
      paymentMethod,
      paymentDate: paymentDate || new Date().toISOString().substring(0, 10),
      receivedBy: receivedBy || 'Accounts Officer',
      remarks: remarks || '',
      status: newStatus === 'PAID' ? 'PAID' : 'PARTIALLY PAID',
      createdAt: new Date().toISOString(),
    };

    const updatedVoucher: FeeVoucher = {
      ...targetVoucher,
      paidAmount: newPaid,
      remainingBalance,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    setFeeVouchers((prev) => prev.map((v) => (v.id === voucherId ? updatedVoucher : v)));
    setFeePayments((prev) => [newPayment, ...prev]);

    setStudents((sList) =>
      sList.map((st) =>
        st.id === targetVoucher.studentId
          ? {
              ...st,
              feeStatus: newStatus === 'PAID' ? 'Paid' : newStatus === 'PARTIALLY PAID' ? 'Partial' : 'Overdue',
              previousBalance: remainingBalance,
            }
          : st
      )
    );

    api.post<{ success: boolean; voucher?: FeeVoucher; payment?: FeePayment }>('/erp/fee-payments', {
      voucherId: targetVoucher.id,
      amountPaid: amount,
      paymentMethod,
      paymentDate: paymentDate || new Date().toISOString().substring(0, 10),
      receivedBy: receivedBy || 'Accounts Officer',
      remarks: remarks || '',
    })
      .then((res) => {
        if (res?.voucher && res?.payment) {
          setFeeVouchers((prev) => prev.map((v) => (v.id === voucherId ? res.voucher! : v)));
          setFeePayments((prev) => [res.payment!, ...prev.filter((p) => p.id !== res.payment!.id)]);
        }
        refreshStudents();
      })
      .catch((err) => {
        console.warn('Backend payment save notice:', err);
      });

    addAuditLog(
      'FEE_PAYMENT_COLLECTED',
      'Fee Collection',
      `Collected Rs. ${amount.toLocaleString()} for Voucher ${targetVoucher.voucherNo} (${targetVoucher.studentName}) via ${paymentMethod}. Receipt #${receiptNo}`
    );

    showToast(
      'Payment Recorded',
      `Rs. ${amount.toLocaleString()} received for ${targetVoucher.studentName}. Receipt: ${receiptNo}`,
      'success'
    );

    return { success: true, payment: newPayment, voucher: updatedVoucher };
  };

  const deleteFeeVoucher = async (voucherId: string) => {
    try {
      await api.delete(`/erp/fee-vouchers/${voucherId}`);
      setFeeVouchers((prev) => prev.filter((v) => v.id !== voucherId));
      addAuditLog('FEE_VOUCHER_VOIDED', 'Fee Management', `Voided/deleted fee voucher ID: ${voucherId}`);
      showToast('Voucher Voided', 'Fee voucher has been removed.', 'info');
      refreshFees();
      refreshStudents();
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to delete fee voucher', 'error');
    }
  };

  const seed500DemoStudents = () => {
    refreshStudents();
    refreshFees();
    showToast('Database Synchronized', 'Loaded active enrolled students directly from SQLite database.', 'info');
  };

  const feeMetrics = {
    totalDemanded: feeVouchers.reduce((sum, v) => sum + (v.totalPayable || 0), 0),
    totalCollected: feeVouchers.reduce((sum, v) => sum + (v.paidAmount || 0), 0),
    outstandingFees: feeVouchers.reduce((sum, v) => sum + (v.remainingBalance || 0), 0),
    overdueFees: feeVouchers
      .filter((v) => v.status === 'OVERDUE' || (v.status !== 'PAID' && new Date(v.dueDate) < new Date()))
      .reduce((sum, v) => sum + (v.remainingBalance || 0), 0),
    currentMonthCollection: feePayments
      .filter((p) => {
        const pDate = new Date(p.paymentDate);
        const now = new Date();
        return pDate.getFullYear() === now.getFullYear() && pDate.getMonth() === now.getMonth();
      })
      .reduce((sum, p) => sum + (p.amountPaid || 0), 0),
  };


  // Exam Actions
  const addExam = async (exam: Omit<Exam, 'id'>) => {
    const tempId = 'exam-' + Date.now();
    const newEx: Exam = { ...exam, id: tempId };
    setExams((prev) => [newEx, ...prev]);
    try {
      const res = await api.post<{ success: boolean; exam: Exam }>('/erp/exams', newEx);
      if (res?.exam) {
        setExams((prev) => prev.map((e) => (e.id === tempId ? res.exam : e)));
      }
    } catch (err) {
      console.warn('Failed to sync created exam to backend:', err);
    }
    addAuditLog('EXAM_SCHEDULED', 'Examinations', `Created exam event: ${newEx.name}`);
    showToast('Examination Created', `${newEx.name} scheduled.`);
  };

  const deleteExam = async (id: string) => {
    const target = exams.find((e) => e.id === id);
    setExams((prev) => prev.filter((e) => e.id !== id));
    setExamSchedules((prev) => prev.filter((s) => s.examId !== id));
    setExamResults((prev) => prev.filter((r) => r.examId !== id));
    try {
      await api.delete(`/erp/exams/${id}`);
    } catch (err) {
      console.warn('Failed to delete exam from backend:', err);
    }
    addAuditLog('EXAM_DELETED', 'Examinations', `Deleted exam: ${target?.name || id}`);
    showToast('Exam Removed', 'Examination and related data removed.', 'info');
  };

  const addExamSchedule = async (schedule: Omit<ExamScheduleItem, 'id'>) => {
    const tempId = 'exs-' + Date.now();
    const newSched: ExamScheduleItem = { ...schedule, id: tempId };
    setExamSchedules((prev) => [...prev, newSched]);
    try {
      const res = await api.post<{ success: boolean; schedule: ExamScheduleItem }>('/erp/exam-schedules', newSched);
      if (res?.schedule) {
        setExamSchedules((prev) => prev.map((s) => (s.id === tempId ? res.schedule : s)));
      }
    } catch (err) {
      console.warn('Failed to persist exam schedule to backend:', err);
    }
    showToast('Exam Slot Added', `${newSched.subject} scheduled for ${newSched.date}`);
  };

  const deleteExamSchedule = async (id: string) => {
    setExamSchedules((prev) => prev.filter((s) => s.id !== id));
    try {
      await api.delete(`/erp/exam-schedules/${id}`);
    } catch (err) {
      console.warn('Failed to delete exam schedule from backend:', err);
    }
    showToast('Exam Slot Removed', 'Examination schedule item removed.', 'info');
  };

  const saveExamResults = async (results: Omit<ExamResult, 'id'>[]) => {
    const newResults: ExamResult[] = results.map((r, idx) => ({
      ...r,
      id: 'res-' + Date.now() + '-' + idx,
    }));

    // Deduplicate & upsert into local state so no duplicate records are generated
    setExamResults((prev) => {
      const filtered = prev.filter(
        (existing) =>
          !newResults.some(
            (nr) =>
              nr.studentId === existing.studentId &&
              nr.subject.toLowerCase() === existing.subject.toLowerCase() &&
              (nr.examId === existing.examId || (nr.term && nr.term === existing.term))
          )
      );
      return [...newResults, ...filtered];
    });

    try {
      await api.post('/erp/exam-results', { results: newResults });
    } catch (err) {
      console.warn('Failed to persist marks to backend:', err);
    }

    addAuditLog('EXAM_MARKS_SUBMITTED', 'Examinations', `Submitted marks for ${results.length} student entries`);
    showToast('Marks Entry Saved', `Recorded marks for ${results.length} subjects.`);
  };

  // Timetable
  const addTimetableSlot = async (slot: Omit<TimetableSlot, 'id'>) => {
    const tempId = 'tt-' + Date.now();
    const newSlot: TimetableSlot = { ...slot, id: tempId };
    setTimetableSlots((prev) => [...prev, newSlot]);
    try {
      const res = await api.post<{ success: boolean; slot: TimetableSlot }>('/erp/timetable', newSlot);
      if (res?.slot) {
        setTimetableSlots((prev) => prev.map((s) => (s.id === tempId ? res.slot : s)));
      }
    } catch (err) {
      console.warn('Failed to save timetable slot to backend:', err);
    }
    showToast('Timetable Updated', `${newSlot.subject} added on ${newSlot.day}`);
  };

  const deleteTimetableSlot = async (id: string) => {
    setTimetableSlots((prev) => prev.filter((s) => s.id !== id));
    try {
      await api.delete(`/erp/timetable/${id}`);
    } catch (err) {
      console.warn('Failed to delete timetable slot from backend:', err);
    }
    showToast('Slot Removed', 'Period removed from schedule.', 'info');
  };

  // Homework
  const addHomework = async (hw: Omit<Homework, 'id' | 'submissionsCount'>) => {
    const tempId = 'hw-' + Date.now();
    const newHw: Homework = {
      ...hw,
      id: tempId,
      submissionsCount: 0,
    };
    setHomeworks((prev) => [newHw, ...prev]);
    try {
      const res = await api.post<{ success: boolean; homework: Homework }>('/erp/homework', newHw);
      if (res?.homework) {
        setHomeworks((prev) => prev.map((h) => (h.id === tempId ? res.homework : h)));
      }
    } catch (err) {
      console.warn('Failed to save homework to backend:', err);
    }
    addAuditLog('HOMEWORK_ASSIGNED', 'Homework', `Assigned "${newHw.title}" to ${newHw.class} ${newHw.section}`);
    showToast('Homework Assigned', `"${newHw.title}" posted for ${newHw.class} - ${newHw.section}`);
  };

  const deleteHomework = async (id: string) => {
    setHomeworks((prev) => prev.filter((h) => h.id !== id));
    try {
      await api.delete(`/erp/homework/${id}`);
    } catch (err) {
      console.warn('Failed to delete homework from backend:', err);
    }
    showToast('Homework Deleted', 'Assignment deleted.', 'info');
  };

  const getHomeworkSubmissions = async (homeworkId: string): Promise<any[]> => {
    try {
      const res = await api.get<{ success: boolean; submissions: any[] }>(`/erp/homework/${homeworkId}/submissions`);
      return res?.submissions || [];
    } catch (err) {
      console.warn('Failed to fetch homework submissions:', err);
      return [];
    }
  };

  const gradeHomeworkSubmission = async (submissionId: string, obtainedMarks: number, teacherFeedback?: string): Promise<boolean> => {
    try {
      const res = await api.post<{ success: boolean; submission: any }>('/erp/homework/submissions/grade', {
        submissionId,
        obtainedMarks,
        teacherFeedback,
      });
      if (res?.success) {
        showToast('Submission Graded', `Marks (${obtainedMarks}) and feedback successfully recorded.`);
        return true;
      }
    } catch (err) {
      console.warn('Failed to grade homework submission:', err);
      showToast('Grading Failed', 'Unable to record marks.', 'error');
    }
    return false;
  };

  const submitHomework = async (submission: any): Promise<boolean> => {
    try {
      const res = await api.post<{ success: boolean; submission: any }>('/erp/homework/submissions/submit', submission);
      if (res?.success) {
        showToast('Assignment Submitted', 'Your assignment has been submitted successfully.');
        refreshHomework();
        return true;
      }
    } catch (err) {
      console.warn('Failed to submit assignment:', err);
      showToast('Submission Failed', 'Could not upload assignment.', 'error');
    }
    return false;
  };

  // Library
  const addLibraryBook = (book: Omit<LibraryBook, 'id' | 'bookId'>) => {
    const nextNum = (libraryBooks.length + 101).toString();
    const newBook: LibraryBook = {
      ...book,
      id: 'bk-' + Date.now(),
      bookId: `LIB-B-${nextNum}`,
      status: book.availableCopies > 5 ? 'Available' : book.availableCopies > 0 ? 'Low Stock' : 'Out of Stock',
    };
    setLibraryBooks((prev) => [newBook, ...prev]);
    showToast('Book Added to Catalog', `"${newBook.title}" registered with ID: ${newBook.bookId}`);
  };

  const issueBook = (bookId: string, studentId: string, dueDate: string) => {
    const book = libraryBooks.find((b) => b.id === bookId);
    const student = students.find((s) => s.id === studentId);
    if (!book || !student || book.availableCopies <= 0) {
      showToast('Issue Failed', 'Book is currently unavailable or copies exhausted.', 'error');
      return;
    }

    const tx: LibraryTransaction = {
      id: 'tx-' + Date.now(),
      bookId: book.id,
      bookTitle: book.title,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      class: `${student.class} ${student.section}`,
      issueDate: new Date().toISOString().substring(0, 10),
      dueDate,
      status: 'Issued',
      fineAmount: 0,
    };

    setLibraryTransactions((prev) => [tx, ...prev]);
    setLibraryBooks((prev) =>
      prev.map((b) =>
        b.id === bookId
          ? {
              ...b,
              availableCopies: b.availableCopies - 1,
              status: b.availableCopies - 1 <= 0 ? 'Out of Stock' : b.availableCopies - 1 < 3 ? 'Low Stock' : 'Available',
            }
          : b
      )
    );

    addAuditLog('BOOK_ISSUED', 'Library', `Issued "${book.title}" to ${student.firstName} ${student.lastName}`);
    showToast('Book Issued', `"${book.title}" issued to ${student.firstName} ${student.lastName}`);
  };

  const returnBook = (txId: string) => {
    const tx = libraryTransactions.find((t) => t.id === txId);
    if (!tx) return;

    setLibraryTransactions((prev) =>
      prev.map((t) =>
        t.id === txId
          ? { ...t, status: 'Returned', returnDate: new Date().toISOString().substring(0, 10) }
          : t
      )
    );

    setLibraryBooks((prev) =>
      prev.map((b) =>
        b.id === tx.bookId
          ? { ...b, availableCopies: b.availableCopies + 1, status: 'Available' }
          : b
      )
    );

    addAuditLog('BOOK_RETURNED', 'Library', `Returned copy of "${tx.bookTitle}"`);
    showToast('Book Returned', `"${tx.bookTitle}" checked back into library catalog.`);
  };

  // Transport
  const addVehicle = (v: Omit<Vehicle, 'id'>) => {
    const newV: Vehicle = { ...v, id: 'veh-' + Date.now() };
    setVehicles((prev) => [...prev, newV]);
    showToast('Vehicle Added', `${newV.vehicleNumber} added to active fleet.`);
  };

  const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
    setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
    showToast('Vehicle Updated', 'Fleet details saved.');
  };

  const addTransportRoute = (rt: Omit<TransportRoute, 'id'>) => {
    const routeName = rt.routeName || rt.name || 'New Route';
    const newRt: TransportRoute = {
      ...rt,
      id: 'rt-' + Date.now(),
      name: routeName,
      routeName: routeName,
      studentCount: rt.studentCount ?? 0,
      totalStudents: rt.totalStudents ?? 0,
      capacity: rt.capacity || 40,
      status: rt.status || 'Active',
      stops: rt.stops || [],
    };
    setTransportRoutes((prev) => [...prev, newRt]);
    addAuditLog('ROUTE_CREATED', 'Transport', `Created route "${newRt.name}"`);
    showToast('Route Created', `${newRt.name} registered.`);
  };

  const updateTransportRoute = (id: string, updates: Partial<TransportRoute>) => {
    setTransportRoutes((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const routeName = updates.routeName || updates.name || r.routeName || r.name;
        return {
          ...r,
          ...updates,
          name: routeName,
          routeName: routeName,
        };
      })
    );
    showToast('Route Updated', 'Route details successfully updated.');
  };

  const deleteTransportRoute = (id: string) => {
    const routeToDelete = transportRoutes.find((r) => r.id === id);
    setTransportRoutes((prev) => prev.filter((r) => r.id !== id));
    if (routeToDelete) {
      const rName = routeToDelete.routeName || routeToDelete.name;
      setStudents((prev) =>
        prev.map((s) => (s.transportRoute === rName ? { ...s, transportRoute: undefined } : s))
      );
    }
    showToast('Route Deleted', 'Transport route removed.');
  };

  const assignStudentToRoute = (studentId: string, routeName: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, transportRoute: routeName } : s))
    );
    setTransportRoutes((prev) =>
      prev.map((r) => {
        const rName = r.routeName || r.name;
        if (rName === routeName) {
          const currentCount = r.studentCount ?? 0;
          return { ...r, studentCount: currentCount + 1, totalStudents: currentCount + 1 };
        }
        return r;
      })
    );
    showToast('Student Assigned', `Assigned to ${routeName}.`);
  };

  const removeStudentFromRoute = (studentId: string) => {
    const st = students.find((s) => s.id === studentId);
    if (!st || !st.transportRoute) return;
    const oldRoute = st.transportRoute;
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, transportRoute: undefined } : s))
    );
    setTransportRoutes((prev) =>
      prev.map((r) => {
        const rName = r.routeName || r.name;
        if (rName === oldRoute) {
          const currentCount = r.studentCount ?? 1;
          const nextCount = Math.max(0, currentCount - 1);
          return { ...r, studentCount: nextCount, totalStudents: nextCount };
        }
        return r;
      })
    );
    showToast('Student Removed', 'Student removed from transport roster.');
  };

  // Staff & Payroll
  const addStaff = (stf: Omit<Staff, 'id' | 'employeeId'>) => {
    const nextNum = (staff.length + 1).toString().padStart(2, '0');
    const newStaff: Staff = {
      ...stf,
      id: 'stf-' + Date.now(),
      employeeId: `STF-2026-${nextNum}`,
    };
    setStaff((prev) => [...prev, newStaff]);
    // Sync to SQLite
    api.post('/erp/staff', newStaff).catch((err) => console.warn('Sync staff warning:', err));
    showToast('Staff Enrolled', `${newStaff.name} added to staff roster.`);
  };

  const saveStaffMember = async (stf: Partial<Staff>): Promise<boolean> => {
    try {
      const res = await api.post<{ success: boolean; staff?: Staff }>('/erp/staff', stf);
      if (res && res.success && res.staff) {
        setStaff((prev) => {
          const idx = prev.findIndex((s) => s.id === res.staff!.id || s.employeeId === res.staff!.employeeId);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], ...res.staff };
            return copy;
          }
          return [res.staff!, ...prev];
        });
        showToast('Staff Saved', `Record saved for ${res.staff.name}`);
        return true;
      }
    } catch (err: any) {
      showToast('Failed to Save Staff', err.response?.data?.error || err.message, 'error');
    }
    return false;
  };

  const deleteStaffMember = async (id: string): Promise<boolean> => {
    try {
      const res = await api.delete<{ success: boolean }>(`/erp/staff/${id}`);
      if (res && res.success) {
        setStaff((prev) => prev.filter((s) => s.id !== id && s.employeeId !== id));
        showToast('Staff Removed', 'Staff member removed from active roster.');
        return true;
      }
    } catch (err: any) {
      showToast('Failed to Delete Staff', err.response?.data?.error || err.message, 'error');
    }
    return false;
  };

  const addPayrollRecord = (pr: Omit<PayrollRecord, 'id'>) => {
    const newPr: PayrollRecord = { ...pr, id: 'pr-' + Date.now() };
    setPayroll((prev) => [newPr, ...prev]);
    showToast('Payroll Generated', `Payroll slip generated for ${newPr.employeeName}`);
  };

  const markPayrollPaid = (id: string) => {
    updatePayrollStatus(id, 'Paid', 'Bank Transfer');
  };

  const generateMonthlyPayroll = async (month: string) => {
    try {
      const res = await api.post<{
        success: boolean;
        result: { generated: number; skipped: number; totalAmount: number };
        payroll?: PayrollRecord[];
      }>('/erp/payroll/generate', { month });

      if (res && res.success) {
        if (Array.isArray(res.payroll) && res.payroll.length > 0) {
          setPayroll(res.payroll);
        } else {
          await refreshPayroll(month);
        }
        showToast(
          'Payroll Run Completed',
          `Generated ${res.result.generated} staff slips (Rs. ${res.result.totalAmount.toLocaleString()}). ${res.result.skipped} were already present.`
        );
        return { success: true, ...res.result };
      }
    } catch (err: any) {
      showToast('Payroll Generation Failed', err.response?.data?.error || err.message, 'error');
    }
    return { success: false, generated: 0, skipped: 0, totalAmount: 0 };
  };

  const disburseBulkPayroll = async (
    recordIds: string[],
    paymentMethod: string = 'Bank Transfer',
    paymentDate?: string
  ) => {
    const pDate = paymentDate || new Date().toISOString().substring(0, 10);
    try {
      const res = await api.post<{ success: boolean; updated: number }>('/erp/payroll/disburse', {
        recordIds,
        paymentMethod,
        paymentDate: pDate,
      });

      if (res && res.success) {
        setPayroll((prev) =>
          prev.map((p) =>
            recordIds.includes(p.id)
              ? {
                  ...p,
                  status: 'Paid',
                  paymentMethod: paymentMethod as any,
                  paymentDate: pDate,
                }
              : p
          )
        );
        showToast('Salaries Disbursed', `Successfully disbursed payments to ${res.updated} staff members.`);
        return { success: true, updated: res.updated };
      }
    } catch (err: any) {
      showToast('Disbursement Error', err.response?.data?.error || err.message, 'error');
    }
    return { success: false, updated: 0 };
  };

  // Leave Management
  const applyLeave = (req: Omit<LeaveRequest, 'id' | 'appliedDate' | 'status'>) => {
    const newReq: LeaveRequest = {
      ...req,
      id: 'lv-' + Date.now(),
      appliedDate: new Date().toISOString().substring(0, 10),
      status: 'Pending',
    };
    setLeaveRequests((prev) => [newReq, ...prev]);
    showToast('Leave Application Submitted', 'Your request has been forwarded to the Principal for review.');
  };

  const updateLeaveStatus = (id: string, status: 'Approved' | 'Rejected', remarks?: string, approvedBy?: string) => {
    setLeaveRequests((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              status,
              actionRemarks: remarks,
              approvedBy: approvedBy || 'Dr. Arthur Pendelton (Principal)',
            }
          : l
      )
    );
    addAuditLog('LEAVE_DECISION', 'Leave Management', `Marked leave ${id} as ${status}`);
    showToast(`Leave ${status}`, `Leave application has been marked as ${status.toLowerCase()}.`);
  };

  // Expenses
  const addExpense = (exp: Omit<ExpenseRecord, 'id'>) => {
    const newExp: ExpenseRecord = { ...exp, id: 'exp-' + Date.now() };
    setExpenses((prev) => [newExp, ...prev]);
    addAuditLog('EXPENSE_RECORDED', 'Financials', `Logged expense: ${newExp.title} ($${newExp.amount})`);
    showToast('Expense Recorded', `$${newExp.amount.toFixed(2)} logged under ${newExp.category}`);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    showToast('Expense Removed', 'Expense item deleted.', 'info');
  };

  // Notices
  const addNotice = (nt: Omit<Notice, 'id' | 'publishedDate'>) => {
    const newNt: Notice = {
      ...nt,
      id: 'nt-' + Date.now(),
      publishedDate: new Date().toISOString().substring(0, 10),
    };
    setNotices((prev) => [newNt, ...prev]);
    addAuditLog('NOTICE_PUBLISHED', 'Notice Board', `Posted announcement: "${newNt.title}"`);
    showToast('Notice Published', `"${newNt.title}" broadcasted to ${newNt.targetAudience}`);
  };

  const deleteNotice = (id: string) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
    showToast('Notice Deleted', 'Announcement removed.', 'info');
  };

  // Messages
  const sendMessage = (msg: Omit<MessageItem, 'id' | 'timestamp' | 'read'>) => {
    const newMsg: MessageItem = {
      ...msg,
      id: 'msg-' + Date.now(),
      timestamp: 'Just now',
      read: false,
    };
    setMessages((prev) => [newMsg, ...prev]);
    showToast('Message Sent', `Dispatched to ${newMsg.recipientName}`);
  };

  const markMessageRead = (id: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('Notifications Cleared', 'All alerts marked as read.');
  };

  // Settings - Single Source of Truth
  const updateSettings = useCallback(async (updates: Partial<SchoolSettings>) => {
    // 1. Optimistic update
    setSettings((prev) => ({ ...prev, ...updates }));

    // 2. Persist to SQLite backend database
    try {
      const res = await api.put<{ success?: boolean; settings?: SchoolSettings }>('/erp/settings', updates);
      if (res && res.settings) {
        setSettings((prev) => ({ ...prev, ...res.settings }));
      }
    } catch (err) {
      console.warn('Could not sync school settings to server database:', err);
    }

    addAuditLog('SETTINGS_MODIFIED', 'System Settings', 'Updated school operational parameters');
    showToast('Settings Saved', 'School ERP configurations updated.');
  }, [addAuditLog, showToast]);

  const resetToDefaults = () => {
    localStorage.clear();
    setSettings(initialSchoolSettings);
    setStudents(initialStudents);
    setTeachers(initialTeachers);
    setStaff(initialStaff);
    setClasses(initialClasses);
    setAttendanceRecords(initialAttendanceRecords);
    setFeeStructures(initialFeeStructures);
    setFeeInvoices(initialFeeInvoices);
    setExams(initialExams);
    setExamSchedules(initialExamSchedules);
    setExamResults(initialExamResults);
    setTimetableSlots(initialTimetableSlots);
    setHomeworks(initialHomeworks);
    setLibraryBooks(initialLibraryBooks);
    setLibraryTransactions(initialLibraryTransactions);
    setVehicles(initialVehicles);
    setTransportRoutes(initialRoutes);
    setPayroll(initialPayroll);
    setLeaveRequests(initialLeaveRequests);
    setExpenses(initialExpenses);
    setNotices(initialNotices);
    setMessages(initialMessages);
    setNotifications(initialNotifications);
    setAuditLogs(initialAuditLogs);
    showToast('Database Reset', 'System database restored to default institutional state.', 'info');
  };

  // Helpers and Aliases
  const addBook = (book: any) => {
    addLibraryBook({
      isbn: book.isbn || '978-0000000000',
      title: book.title || 'Untitled Book',
      author: book.author || 'Unknown',
      category: book.category || 'General',
      totalCopies: book.totalCopies || book.quantity || 5,
      quantity: book.totalCopies || book.quantity || 5,
      availableCopies: book.availableCopies ?? (book.totalCopies || 5),
      shelf: book.rackNumber || book.shelf || 'Rack A-01',
      rackNumber: book.rackNumber || book.shelf || 'Rack A-01',
      status: 'Available',
    });
  };

  const updatePayrollStatus = (
    id: string,
    status: 'Paid' | 'Pending' | 'Processing',
    paymentMethod?: string,
    paymentDate?: string
  ) => {
    const pDate = paymentDate || (status === 'Paid' ? new Date().toISOString().substring(0, 10) : undefined);
    const method = paymentMethod || 'Bank Transfer';

    setPayroll((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status,
              paymentMethod: (method || p.paymentMethod) as any,
              paymentDate: pDate ?? p.paymentDate,
            }
          : p
      )
    );

    api.patch(`/erp/payroll/${id}/status`, {
      status,
      paymentMethod: method,
      paymentDate: pDate,
    }).catch((err) => {
      console.warn('Backend update payroll warning:', err);
    });

    showToast('Payroll Updated', `Payment status changed to ${status}.`);
  };

  const markAttendance = (
    studentId: string,
    date: string,
    status: 'Present' | 'Absent' | 'Late' | 'Leave',
    remarks?: string
  ) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const recordToSave: AttendanceRecord = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      rollNumber: student.rollNumber,
      class: student.class,
      section: student.section,
      date,
      status,
      remarks,
    };

    // Save to backend SQLite
    api.post('/erp/attendance', { records: [recordToSave] }).catch((err) => {
      console.warn('Backend mark attendance sync warning:', err);
    });

    setAttendanceRecords((prev) => {
      const exists = prev.find((r) => r.studentId === studentId && r.date === date);
      if (exists) {
        return prev.map((r) =>
          r.studentId === studentId && r.date === date ? { ...r, status, remarks } : r
        );
      }
      return [recordToSave, ...prev];
    });
  };

  // Aggregated live analytics calculation from real records
  const voucherPaymentsSum = feePayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  const invoicePaidSum = feeInvoices
    .filter((inv) => inv.status === 'Paid')
    .reduce((sum, inv) => sum + (inv.paidAmount || inv.totalPayable || 0), 0);
  const totalFeesCollected = voucherPaymentsSum > 0 ? voucherPaymentsSum : invoicePaidSum;

  const voucherPendingSum = feeVouchers
    .filter((v) => v.status === 'PENDING' || v.status === 'PARTIALLY PAID')
    .reduce((sum, v) => sum + ((v.remainingBalance ?? (v.totalPayable - (v.paidAmount || 0)))), 0);
  const invoicePendingSum = feeInvoices
    .filter((inv) => inv.status === 'Pending' || inv.status === 'Partial')
    .reduce((sum, inv) => sum + (inv.dueAmount || inv.totalPayable - inv.paidAmount || 0), 0);
  const totalFeesPending = voucherPendingSum > 0 ? voucherPendingSum : invoicePendingSum;

  const voucherOverdueSum = feeVouchers
    .filter((v) => v.status === 'OVERDUE')
    .reduce((sum, v) => sum + ((v.remainingBalance ?? (v.totalPayable - (v.paidAmount || 0)))), 0);
  const invoiceOverdueSum = feeInvoices
    .filter((inv) => inv.status === 'Overdue')
    .reduce((sum, inv) => sum + (inv.dueAmount || inv.totalPayable || 0), 0);
  const totalFeesOverdue = voucherOverdueSum > 0 ? voucherOverdueSum : invoiceOverdueSum;

  // Real attendance computation
  const totalEnrolled = students.length;
  const totalFacultyCount = teachers.length;

  const todayStr = new Date().toISOString().split('T')[0];
  const realTodayRecords = attendanceRecords.filter((r) => r.date === todayStr);
  const realTodayPresent = realTodayRecords.filter((r) => r.status === 'Present').length;
  const calculatedTodayRate =
    realTodayRecords.length > 0
      ? Number(((realTodayPresent / realTodayRecords.length) * 100).toFixed(1))
      : 0;

  // Weekly attendance trends from real attendance records
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyAttendanceTrends = dayNames.map((day) => {
    const matched = attendanceRecords.filter((r) => {
      const d = new Date(r.date);
      const name = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
      return name === day;
    });
    const present = matched.filter((r) => r.status === 'Present').length;
    const rate = matched.length > 0 ? Number(((present / matched.length) * 100).toFixed(1)) : 0;
    return {
      day,
      students: rate,
      teachers: 0,
      target: 95,
      presentCount: present,
      absentCount: matched.length - present,
    };
  });

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyAttendanceTrends = monthNames.map((month, idx) => {
    const matched = attendanceRecords.filter((r) => {
      const m = new Date(r.date).getMonth();
      return m === idx;
    });
    const present = matched.filter((r) => r.status === 'Present').length;
    const rate = matched.length > 0 ? Number(((present / matched.length) * 100).toFixed(1)) : 0;
    return {
      month,
      students: rate,
      teachers: 0,
      target: 95,
      averageRate: rate,
      workingDays: 0,
    };
  });

  const totalExpenseSum = expenses.reduce((acc, e) => acc + e.amount, 0);

  const monthlyRevenue = monthNames.map((month, idx) => {
    const revFromPayments = feePayments
      .filter((p) => p.paymentDate && new Date(p.paymentDate).getMonth() === idx)
      .reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    const revFromInvoices = feeInvoices
      .filter((inv) => (inv.paymentDate || inv.dueDate) && new Date(inv.paymentDate || inv.dueDate).getMonth() === idx && inv.status === 'Paid')
      .reduce((sum, inv) => sum + (inv.paidAmount || inv.totalPayable || 0), 0);
    const rev = revFromPayments > 0 ? revFromPayments : revFromInvoices;

    const exp = expenses
      .filter((e) => e.date && new Date(e.date).getMonth() === idx)
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    return {
      month,
      revenue: rev,
      target: 0,
      expenses: exp,
    };
  });

  const analyticsData = {
    revenueVsExpense: monthlyRevenue.slice(0, 6),
    monthlyRevenue,
    attendanceTrends: weeklyAttendanceTrends.map((w) => ({
      day: w.day,
      attendance: w.students,
      students: w.students,
      teachers: w.teachers,
      target: w.target,
      presentCount: w.presentCount,
      absentCount: w.absentCount,
    })),
    weeklyAttendanceTrends,
    monthlyAttendanceTrends,
    dailyAttendance: weeklyAttendanceTrends.map((w) => ({ day: w.day, rate: w.students })),
    classAttendanceOverview: classes.map((c) => {
      const cRecords = attendanceRecords.filter((r) => r.class === c.name || r.class === c.id);
      const present = cRecords.filter((r) => r.status === 'Present').length;
      const rate = cRecords.length > 0 ? Number(((present / cRecords.length) * 100).toFixed(1)) : 0;
      return {
        name: `${c.name}-${c.section}`,
        attendance: rate,
      };
    }),
    gradeDistribution: ['A+', 'A', 'B', 'C', 'D', 'F'].map((grade) => ({
      grade,
      count: examResults.filter((r) => r.grade === grade).length,
    })),
    feeCollectionStats: {
      collected: totalFeesCollected,
      pending: totalFeesPending,
      overdue: totalFeesOverdue,
      total: totalFeesCollected + totalFeesPending + totalFeesOverdue,
    },
    totalStudents: students.length,
    totalTeachers: teachers.length,
    totalStaff: staff.length,
    totalClasses: classes.length,
    attendanceTodayRate: calculatedTodayRate,
  };

  return (
    <ERPDataContext.Provider
      value={{
        settings,
        schoolSettings: settings,
        students,
        teachers,
        staff,
        classes,
        attendanceRecords,
        feeStructures,
        feeCategories,
        feeVouchers,
        feePayments,
        feeInvoices,
        exams,
        examSchedules,
        examResults,
        timetableSlots,
        timetables: timetableSlots,
        homeworks,
        homework: homeworks,
        libraryBooks,
        libraryTransactions,
        vehicles,
        transportRoutes,
        payroll,
        payrollRecords: payroll,
        leaveRequests,
        leaves: leaveRequests,
        expenses,
        notices,
        messages,
        notifications,
        auditLogs,
        toasts,
        showToast,
        removeToast,
        addStudent,
        updateStudent,
        deleteStudent,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        addClass,
        updateClass,
        deleteClass,
        saveAttendance,
        markAttendance,
        addFeeCategory,
        updateFeeCategory,
        deleteFeeCategory,
        addFeeStructure,
        updateFeeStructure,
        deleteFeeStructure,
        refreshFees,
        deleteFeeVoucher,
        generateBulkVouchers,
        collectVoucherPayment,
        seed500DemoStudents,
        feeMetrics,
        addFeeInvoice,
        collectFeePayment,
        addExam,
        deleteExam,
        refreshExams,
        refreshExamResults,
        addExamSchedule,
        deleteExamSchedule,
        saveExamResults,
        addTimetableSlot,
        deleteTimetableSlot,
        refreshTimetable,
        addHomework,
        deleteHomework,
        refreshHomework,
        getHomeworkSubmissions,
        gradeHomeworkSubmission,
        submitHomework,
        addLibraryBook,
        addBook,
        issueBook,
        returnBook,
        addVehicle,
        updateVehicle,
        addTransportRoute,
        updateTransportRoute,
        deleteTransportRoute,
        assignStudentToRoute,
        removeStudentFromRoute,
        addStaff,
        saveStaffMember,
        deleteStaffMember,
        refreshStaff,
        addPayrollRecord,
        markPayrollPaid,
        updatePayrollStatus,
        refreshPayroll,
        generateMonthlyPayroll,
        disburseBulkPayroll,
        applyLeave,
        addLeave: applyLeave,
        updateLeaveStatus,
        addExpense,
        deleteExpense,
        addNotice,
        deleteNotice,
        sendMessage,
        markMessageRead,
        markNotificationRead,
        clearAllNotifications,
        updateSettings,
        updateSchoolSettings: updateSettings,
        refreshSchoolSettings,
        refreshAttendance,
        refreshStudents,
        refreshClasses,
        addAuditLog,
        resetToDefaults,
        analyticsData,
      }}
    >
      {children}
    </ERPDataContext.Provider>
  );
};

export const useERPData = (): ERPDataContextType => {
  const context = useContext(ERPDataContext);
  if (!context) {
    throw new Error('useERPData must be used within an ERPDataProvider');
  }
  return context;
};
