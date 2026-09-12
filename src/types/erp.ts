export type UserRole =
  | 'Super Admin'
  | 'School Admin'
  | 'Principal'
  | 'Teacher'
  | 'Student'
  | 'Parent'
  | 'Accountant'
  | 'Librarian'
  | 'Transport Manager';

export interface User {
  id: string;
  username?: string;
  name: string;
  email: string;
  role: UserRole | string;
  avatar?: string;
  phone?: string;
  department?: string;
  status: 'Active' | 'Inactive' | 'Suspended' | 'Pending' | 'Rejected';
  lastLogin: string;
  lastIp?: string;
  createdAt: string;
  twoFactorEnabled?: boolean;
  studentId?: string;
  parentChildIds?: string[];
  registrationReason?: string;
  requestedRole?: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  permissions?: RolePermissions;
  customModulePermissions?: Record<string, RolePermissions>;
}

export interface RolePermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
  print?: boolean;
  approve: boolean;
}

export interface ERPModuleDefinition {
  id: string;
  name: string;
  category: 'Core Academics' | 'Operations & Fleet' | 'Financial & HR' | 'Communication & System';
  description: string;
}

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  color: string;
  userCount?: number;
  permissions: Record<string, RolePermissions>;
}

export interface SecurityPolicy {
  twoFactorRequirement: 'Optional' | 'AdminOnly' | 'EnforcedAll';
  sessionTimeoutMinutes: number;
  minPasswordLength: number;
  requireSpecialChars: boolean;
  passwordExpirationDays: number;
  maxFailedLoginAttempts: number;
  restrictLoginHours: boolean;
  allowedIpRanges: string;
  forcePasswordResetOnFirstLogin: boolean;
}

export interface Student {
  id: string;
  admissionNo: string;
  admissionNumber?: string;
  name?: string;
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female' | 'Other';
  dob?: string;
  dateOfBirth?: string;
  cnicOrBForm?: string;
  cnic?: string;
  bFormNumber?: string;
  bloodGroup: string;
  phone?: string;
  email?: string;
  address: string;
  admissionDate: string;
  enrollmentDate?: string;
  class: string;
  section: string;
  rollNumber: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  parentOccupation?: string;
  parentRelation?: string;
  fatherName?: string;
  fatherCnic?: string;
  fatherPhone?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherCnic?: string;
  motherPhone?: string;
  motherOccupation?: string;
  guardianName?: string;
  guardianCnic?: string;
  guardianPhone?: string;
  guardianRelation?: string;
  previousSchool?: string;
  photoUrl?: string;
  avatar?: string;
  attendanceRate?: number;
  feeStatus?: 'Paid' | 'Pending' | 'Overdue' | 'Partial';
  status: 'Active' | 'Inactive' | 'Alumni' | 'Suspended';
  emergencyContact: string;
  emergencyContactPerson?: string;
  transportRoute?: string;
  medicalConditions?: string;
  monthlyFee?: number;
  studentType?: 'New' | 'Regular';
  previousBalance?: number;
  discount?: number;
  fine?: number;
  notes?: string;
}

export interface Teacher {
  id: string;
  employeeId: string;
  name: string;
  cnic?: string;
  gender?: 'Male' | 'Female' | 'Other';
  dateOfBirth?: string;
  maritalStatus?: 'Single' | 'Married' | 'Other';
  bloodGroup?: string;
  email: string;
  phone: string;
  emergencyContact?: string;
  emergencyContactPerson?: string;
  address?: string;
  subject: string;
  department?: string;
  assignedClasses: string[];
  qualification: string;
  experienceYears?: number;
  joiningDate: string;
  salary?: number;
  status: 'Active' | 'On Leave' | 'Inactive' | 'Resigned';
  photoUrl?: string;
  avatar?: string;
  attendanceRate?: number;
  leaveBalance?: number;
}

export interface Staff {
  id: string;
  employeeId: string;
  name: string;
  cnic?: string;
  role: 'Accountant' | 'Librarian' | 'Transport Manager' | 'Admin Staff' | 'Security' | 'Maintenance' | 'Teacher' | 'Principal' | string;
  department: string;
  designation: string;
  gender?: string;
  email: string;
  phone: string;
  salary?: number;
  basicSalary?: number;
  allowanceRate?: number;
  taxRate?: number;
  deductionRate?: number;
  joiningDate: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  photoUrl?: string;
  avatar?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  bankName?: string;
  bankAccountNo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClassSection {
  id: string;
  name: string; // e.g. "Grade 10"
  section: string; // e.g. "A"
  classTeacherId: string;
  classTeacherName: string;
  classTeacher?: string;
  roomNumber: string;
  capacity: number;
  currentEnrolled: number;
  enrolledCount?: number;
  academicSession: string;
  subjects: string[];
}

export type ClassInfo = ClassSection;

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  class: string;
  section: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Late' | 'Leave' | 'Excused';
  remarks?: string;
}

export interface FeeCategory {
  id: string;
  name: string;
  description?: string;
  studentType: 'New' | 'Regular' | 'All';
  isActive: boolean;
  createdAt?: string;
}

export interface FeeStructure {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  category?: 'Tuition Fee' | 'Admission Fee' | 'Examination Fee' | 'Transport Fee' | 'Library Fee' | 'Other' | string;
  feeName: string;
  amount: number;
  frequency: 'Monthly' | 'Quarterly' | 'Yearly' | 'One-Time' | 'Per Term' | string;
  studentType: 'New' | 'Regular' | 'All';
  class: string;
  className?: string;
  section?: string;
  sectionName?: string;
  isActive: boolean;
  dueDate?: string;
  createdAt?: string;
}

export interface FeeVoucherItem {
  id: string;
  voucherId?: string;
  feeStructureId?: string;
  srNo: number;
  feeDescription: string;
  amount: number;
}

export interface FeeVoucher {
  id: string;
  voucherNo: string;
  studentId: string;
  studentName: string;
  fatherName: string;
  admissionNo: string;
  class: string;
  className?: string;
  section: string;
  sectionName?: string;
  rollNumber?: string;
  academicYear: string;
  feeMonth: string;
  studentType: 'New' | 'Regular';
  issueDate: string;
  dueDate: string;
  items: FeeVoucherItem[];
  currentCharges: number;
  previousBalance: number;
  discount: number;
  fine: number;
  totalPayable: number;
  paidAmount: number;
  remainingBalance: number;
  status: 'PENDING' | 'PARTIALLY PAID' | 'PAID' | 'OVERDUE';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeePayment {
  id: string;
  voucherId: string;
  voucherNo: string;
  receiptNo: string;
  studentId: string;
  studentName: string;
  fatherName?: string;
  admissionNo?: string;
  class?: string;
  section?: string;
  amountPaid: number;
  amount?: number;
  previousPaid: number;
  remainingBalance: number;
  paymentMethod: 'Cash' | 'Bank' | 'Cheque' | 'Online Transfer' | 'Other';
  paymentDate: string;
  receivedBy: string;
  remarks?: string;
  status: 'PAID' | 'PARTIALLY PAID';
  createdAt: string;
}

export interface FeeInvoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  class: string;
  section: string;
  rollNumber: string;
  parentName: string;
  feeType: string;
  feeCategory?: string;
  amount: number;
  discount: number;
  fine: number;
  totalPayable: number;
  paidAmount: number;
  dueAmount: number;
  dueDate: string;
  paymentDate?: string;
  paymentMethod?: 'Cash' | 'Bank Transfer' | 'Online Payment' | 'Cheque';
  receivedBy?: string;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Partial';
  academicSession?: string;
  notes?: string;
}

export interface Exam {
  id: string;
  name: string; // e.g. "Mid-Term Examination 2026"
  term?: 'First Term' | 'Mid Term' | 'Final Term' | 'Regular';
  academicSession: string;
  startDate: string;
  endDate: string;
  classes: string[];
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Published';
  totalMarks: number;
  passingMarks: number;
}

export interface ExamScheduleItem {
  id: string;
  examId: string;
  examName: string;
  term?: 'First Term' | 'Mid Term' | 'Final Term' | 'Regular';
  class: string;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  maxMarks: number;
  invigilator?: string;
}

export interface ExamResult {
  id: string;
  examId: string;
  examName: string;
  term?: 'First Term' | 'Mid Term' | 'Final Term' | 'Regular';
  studentId: string;
  studentName: string;
  rollNumber: string;
  class: string;
  section: string;
  subject: string;
  totalMarks: number;
  obtainedMarks: number;
  theoryMarks?: number;
  practicalMarks?: number;
  grade: string;
  remarks: string;
}

export interface TimetableSlot {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  dayOfWeek?: string;
  period?: number;
  class: string;
  section: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacherName?: string;
  teacher?: string;
  roomNumber?: string;
  room?: string;
  isBreak?: boolean;
}

export interface Homework {
  id: string;
  title: string;
  class: string;
  section: string;
  subject: string;
  teacherName: string;
  assignDate?: string;
  assignedDate?: string;
  dueDate: string;
  description: string;
  attachmentName?: string;
  attachments?: string[];
  maxPoints?: number;
  submissionsCount: number;
  totalStudents: number;
  status: 'Active' | 'Closed';
}

export interface HomeworkSubmission {
  id: string;
  homeworkId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  submittedAt: string;
  fileAttachment?: string;
  status: 'Submitted' | 'Evaluated' | 'Pending';
  obtainedMarks?: number;
  maxMarks: number;
  teacherFeedback?: string;
}

export interface LibraryBook {
  id: string;
  bookId?: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  publisher?: string;
  quantity?: number;
  totalCopies?: number;
  availableCopies: number;
  shelf?: string;
  rackNumber?: string;
  status: 'Available' | 'Low Stock' | 'Out of Stock';
  borrowerName?: string;
  dueDate?: string;
}

export interface LibraryTransaction {
  id: string;
  bookId: string;
  bookTitle: string;
  studentId: string;
  studentName: string;
  class: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  fineAmount: number;
  status: 'Issued' | 'Returned' | 'Overdue';
}

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: 'School Bus' | 'Van' | 'Coaster' | 'Mini Bus';
  capacity: number;
  driverName: string;
  driverPhone: string;
  routeId: string;
  routeName: string;
  status: 'Active' | 'Under Maintenance' | 'Inactive';
  gpsStatus: 'Online' | 'Offline';
  fuelLevel: number;
}

export interface TransportRoute {
  id: string;
  name: string;
  routeName?: string;
  startPoint: string;
  endPoint: string;
  stops: { name: string; time: string; fee: number }[];
  vehicleNumber: string;
  vehicleNo?: string;
  driverName: string;
  driverPhone?: string;
  totalStudents: number;
  studentCount?: number;
  capacity?: number;
  monthlyFee: number;
  status?: 'On Route' | 'Completed' | 'Idle' | 'Active';
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  designation?: string;
  department: string;
  month: string; // e.g. "August 2026"
  basicSalary: number;
  allowances: number;
  deductions: number;
  tax: number;
  netSalary: number;
  paymentMethod: 'Bank Transfer' | 'Cheque' | 'Cash' | string;
  paymentDate?: string;
  status: 'Paid' | 'Pending' | 'Processing';
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveRequest {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantRole: string;
  leaveType: 'Sick Leave' | 'Casual Leave' | 'Maternity/Paternity' | 'Emergency' | 'Annual';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  appliedDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  actionRemarks?: string;
}

export interface ExpenseRecord {
  id: string;
  title: string;
  category: 'Electricity' | 'Water' | 'Internet' | 'Maintenance' | 'Salaries' | 'Stationery' | 'Transport' | 'Events' | 'Lab Equipment' | 'Other' | (string & {});
  amount: number;
  date: string;
  invoiceNo: string;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque';
  paidTo: string;
  approvedBy: string;
  receiptUrl?: string;
  notes?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  targetAudience: 'Everyone' | 'Teachers' | 'Students' | 'Parents' | 'Staff' | 'Class 10';
  priority: 'High' | 'Normal' | 'Urgent' | 'Medium' | 'Low';
  publishedDate: string;
  date?: string;
  expiryDate: string;
  authorName: string;
  author?: string;
  authorRole: string;
  attachmentName?: string;
  isPinned: boolean;
}

export interface MessageItem {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatar: string;
  recipientId: string;
  recipientName: string;
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
  hasAttachment?: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'Fee Reminder' | 'Attendance Alert' | 'Homework' | 'Exam' | 'Result' | 'Notice' | 'System';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: string;
  userRole?: string;
  action: string;
  module: string;
  ipAddress: string;
  details: string;
  status: 'Success' | 'Warning' | 'Failed';
}

export interface SchoolSettings {
  schoolName: string;
  name?: string;
  schoolCode?: string;
  city?: string;
  country?: string;
  state?: string;
  timeZone?: string;
  dateFormat?: string;
  tagline: string;
  affiliationNumber: string;
  registrationNumber: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  principalName: string;
  principalSignatureUrl?: string;
  currency: string;
  currencySymbol: string;
  currentSession: string;
  academicYear?: string;
  logoUrl: string;
  smsAlertsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  autoLateFine: boolean;
  lateFinePerDay: number;
  bankName?: string;
  bankBranch?: string;
  accountTitle?: string;
  accountNumber?: string;
  iban?: string;
  lateFeeAmount?: number;
  voucherDueDays?: number;
  voucherNotes?: string;
}
