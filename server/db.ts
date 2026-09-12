import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = process.env.ELECTRON_USER_DATA
  ? process.env.ELECTRON_USER_DATA
  : path.join(process.cwd(), 'server');

try {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
} catch (dirErr) {
  console.warn('[SQLite] Could not ensure directory for database:', dirErr);
}

const dbPath = path.join(dbDir, process.env.ELECTRON_USER_DATA ? 'edupulse_school_erp.sqlite' : 'edupulse.sqlite');

export const db: Database.Database = new Database(dbPath);

// Enable WAL mode for high concurrency & performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
export function initSQLiteSchema() {
  db.exec(`
    -- Fee Categories table
    CREATE TABLE IF NOT EXISTS fee_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      student_type TEXT NOT NULL DEFAULT 'All', -- 'New', 'Regular', 'All'
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    -- Fee Structures table
    CREATE TABLE IF NOT EXISTS fee_structures (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category_id TEXT,
      fee_name TEXT NOT NULL,
      amount REAL NOT NULL,
      frequency TEXT NOT NULL DEFAULT 'Monthly', -- 'Monthly', 'Quarterly', 'Yearly', 'One-Time', 'Per Term'
      student_type TEXT NOT NULL DEFAULT 'All', -- 'New', 'Regular', 'All'
      class_name TEXT NOT NULL DEFAULT 'All Classes',
      section_name TEXT NOT NULL DEFAULT 'All',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    -- Fee Vouchers table
    CREATE TABLE IF NOT EXISTS fee_vouchers (
      id TEXT PRIMARY KEY,
      voucher_no TEXT NOT NULL UNIQUE,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      father_name TEXT,
      admission_no TEXT NOT NULL,
      class_name TEXT NOT NULL,
      section_name TEXT NOT NULL,
      roll_number TEXT,
      academic_year TEXT NOT NULL,
      fee_month TEXT NOT NULL,
      student_type TEXT NOT NULL DEFAULT 'Regular', -- 'New', 'Regular'
      issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      current_charges REAL NOT NULL DEFAULT 0,
      previous_balance REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      fine REAL NOT NULL DEFAULT 0,
      total_payable REAL NOT NULL DEFAULT 0,
      paid_amount REAL NOT NULL DEFAULT 0,
      remaining_balance REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PARTIALLY PAID', 'PAID', 'OVERDUE'
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(student_id, fee_month, academic_year)
    );

    -- Fee Voucher Items table
    CREATE TABLE IF NOT EXISTS fee_voucher_items (
      id TEXT PRIMARY KEY,
      voucher_id TEXT NOT NULL,
      sr_no INTEGER NOT NULL,
      fee_description TEXT NOT NULL,
      amount REAL NOT NULL,
      FOREIGN KEY (voucher_id) REFERENCES fee_vouchers(id) ON DELETE CASCADE
    );

    -- Fee Payments table
    CREATE TABLE IF NOT EXISTS fee_payments (
      id TEXT PRIMARY KEY,
      voucher_id TEXT NOT NULL,
      voucher_no TEXT NOT NULL,
      receipt_no TEXT NOT NULL UNIQUE,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      father_name TEXT,
      admission_no TEXT,
      class_name TEXT,
      section_name TEXT,
      amount_paid REAL NOT NULL,
      previous_paid REAL NOT NULL DEFAULT 0,
      remaining_balance REAL NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL, -- 'Cash', 'Bank', 'Cheque', 'Online Transfer', 'Other'
      payment_date TEXT NOT NULL,
      received_by TEXT NOT NULL,
      remarks TEXT,
      status TEXT NOT NULL DEFAULT 'PAID',
      created_at TEXT NOT NULL,
      FOREIGN KEY (voucher_id) REFERENCES fee_vouchers(id)
    );

    CREATE INDEX IF NOT EXISTS idx_vouchers_student ON fee_vouchers(student_id);
    CREATE INDEX IF NOT EXISTS idx_vouchers_class ON fee_vouchers(class_name, section_name);
    CREATE INDEX IF NOT EXISTS idx_vouchers_status ON fee_vouchers(status);
    CREATE INDEX IF NOT EXISTS idx_vouchers_month_year ON fee_vouchers(fee_month, academic_year);
    CREATE INDEX IF NOT EXISTS idx_voucher_items_voucher ON fee_voucher_items(voucher_id);
    CREATE INDEX IF NOT EXISTS idx_payments_voucher ON fee_payments(voucher_id);
    CREATE INDEX IF NOT EXISTS idx_payments_student ON fee_payments(student_id);

    -- Attendance Records table
    CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      roll_number TEXT,
      class_name TEXT NOT NULL,
      section_name TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL, -- 'Present', 'Absent', 'Leave', 'Late', 'Excused'
      remarks TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(student_id, date)
    );

    CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);
    CREATE INDEX IF NOT EXISTS idx_attendance_class_sec_date ON attendance_records(class_name, section_name, date);
    CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance_records(student_id, date);

    -- Students table
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      admission_no TEXT NOT NULL UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      name TEXT NOT NULL,
      father_name TEXT,
      gender TEXT,
      dob TEXT,
      cnic_or_bform TEXT,
      blood_group TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      admission_date TEXT,
      class_name TEXT NOT NULL,
      section_name TEXT NOT NULL,
      roll_number TEXT,
      parent_name TEXT,
      parent_phone TEXT,
      parent_occupation TEXT,
      emergency_contact TEXT,
      fee_status TEXT DEFAULT 'Pending',
      status TEXT DEFAULT 'Active',
      photo_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_students_class_sec ON students(class_name, section_name);
    CREATE INDEX IF NOT EXISTS idx_students_admission ON students(admission_no);

    -- Classes table
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      section TEXT NOT NULL,
      room TEXT,
      capacity INTEGER DEFAULT 40,
      created_at TEXT NOT NULL,
      UNIQUE(name, section)
    );

    -- System Configuration & Setup Persistence table
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Staff & Faculty table
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT NOT NULL,
      designation TEXT NOT NULL,
      cnic TEXT,
      gender TEXT,
      email TEXT,
      phone TEXT,
      basic_salary REAL NOT NULL DEFAULT 0,
      allowance_rate REAL DEFAULT 15,
      tax_rate REAL DEFAULT 2.5,
      deduction_rate REAL DEFAULT 5,
      joining_date TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      photo_url TEXT,
      bank_name TEXT,
      bank_account_no TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_staff_emp_id ON staff(employee_id);
    CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);
    CREATE INDEX IF NOT EXISTS idx_staff_department ON staff(department);

    -- Monthly Payroll Records table
    CREATE TABLE IF NOT EXISTS payroll_records (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      employee_name TEXT NOT NULL,
      role TEXT NOT NULL,
      designation TEXT,
      department TEXT NOT NULL,
      month TEXT NOT NULL,
      basic_salary REAL NOT NULL,
      allowances REAL NOT NULL DEFAULT 0,
      deductions REAL NOT NULL DEFAULT 0,
      tax REAL NOT NULL DEFAULT 0,
      net_salary REAL NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'Bank Transfer',
      payment_date TEXT,
      status TEXT NOT NULL DEFAULT 'Pending',
      remarks TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(employee_id, month)
    );

    CREATE INDEX IF NOT EXISTS idx_payroll_emp_id ON payroll_records(employee_id);
    CREATE INDEX IF NOT EXISTS idx_payroll_month ON payroll_records(month);
    CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll_records(status);

    -- Exams table
    CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      term TEXT NOT NULL DEFAULT 'Mid Term',
      academic_session TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      classes TEXT NOT NULL, -- JSON array of strings
      status TEXT NOT NULL DEFAULT 'Upcoming',
      total_marks REAL NOT NULL DEFAULT 100,
      passing_marks REAL NOT NULL DEFAULT 40,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_exams_term ON exams(term);
    CREATE INDEX IF NOT EXISTS idx_exams_session ON exams(academic_session);

    -- Exam Schedules / Date Sheet table
    CREATE TABLE IF NOT EXISTS exam_schedules (
      id TEXT PRIMARY KEY,
      exam_id TEXT NOT NULL,
      exam_name TEXT NOT NULL,
      term TEXT NOT NULL DEFAULT 'Mid Term',
      class_name TEXT NOT NULL,
      subject TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      room_number TEXT,
      max_marks REAL NOT NULL DEFAULT 100,
      invigilator TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_exam_sched_exam ON exam_schedules(exam_id);
    CREATE INDEX IF NOT EXISTS idx_exam_sched_class ON exam_schedules(class_name);

    -- Exam Results / Detailed Marks table
    CREATE TABLE IF NOT EXISTS exam_results (
      id TEXT PRIMARY KEY,
      exam_id TEXT NOT NULL,
      exam_name TEXT NOT NULL,
      term TEXT NOT NULL DEFAULT 'Mid Term',
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      roll_number TEXT,
      class_name TEXT NOT NULL,
      section_name TEXT NOT NULL,
      subject TEXT NOT NULL,
      theory_marks REAL,
      practical_marks REAL,
      total_marks REAL NOT NULL DEFAULT 100,
      obtained_marks REAL NOT NULL DEFAULT 0,
      grade TEXT NOT NULL,
      remarks TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(exam_id, student_id, subject)
    );

    CREATE INDEX IF NOT EXISTS idx_exam_results_exam ON exam_results(exam_id);
    CREATE INDEX IF NOT EXISTS idx_exam_results_student ON exam_results(student_id);
    CREATE INDEX IF NOT EXISTS idx_exam_results_class ON exam_results(class_name, section_name);
    CREATE INDEX IF NOT EXISTS idx_exam_results_term ON exam_results(term);

    -- Timetable Slots table
    CREATE TABLE IF NOT EXISTS timetable_slots (
      id TEXT PRIMARY KEY,
      day TEXT NOT NULL,
      period INTEGER NOT NULL,
      class_name TEXT NOT NULL,
      section_name TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      subject TEXT NOT NULL,
      teacher_name TEXT,
      room_number TEXT,
      is_break INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_timetable_class_sec ON timetable_slots(class_name, section_name);
    CREATE INDEX IF NOT EXISTS idx_timetable_day_period ON timetable_slots(day, period);
    CREATE INDEX IF NOT EXISTS idx_timetable_teacher ON timetable_slots(teacher_name);

    -- Homework table
    CREATE TABLE IF NOT EXISTS homework (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      class_name TEXT NOT NULL,
      section_name TEXT NOT NULL,
      subject TEXT NOT NULL,
      teacher_name TEXT NOT NULL,
      assigned_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      description TEXT NOT NULL,
      max_points REAL DEFAULT 50,
      submissions_count INTEGER DEFAULT 0,
      total_students INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Active',
      attachments TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_hw_class ON homework(class_name, section_name);
    CREATE INDEX IF NOT EXISTS idx_hw_subject ON homework(subject);
    CREATE INDEX IF NOT EXISTS idx_hw_due ON homework(due_date);

    -- Homework Submissions table
    CREATE TABLE IF NOT EXISTS homework_submissions (
      id TEXT PRIMARY KEY,
      homework_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      roll_number TEXT,
      submitted_at TEXT NOT NULL,
      file_attachment TEXT,
      status TEXT NOT NULL DEFAULT 'Submitted',
      obtained_marks REAL,
      max_marks REAL NOT NULL DEFAULT 50,
      teacher_feedback TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(homework_id, student_id),
      FOREIGN KEY (homework_id) REFERENCES homework(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_hw_sub_hw ON homework_submissions(homework_id);
    CREATE INDEX IF NOT EXISTS idx_hw_sub_student ON homework_submissions(student_id);
  `);

  // Ensure default standard Pakistani fee categories & structures exist
  try {
    seedDefaultFeeStructures();
  } catch (err) {
    console.error('Error seeding default fee structures:', err);
  }

  // Ensure default institutional staff exist
  try {
    seedDefaultStaff();
  } catch (err) {
    console.error('Error seeding default staff:', err);
  }

  // Ensure default exam sessions exist
  try {
    seedDefaultExamsIfEmpty();
  } catch (err) {
    console.error('Error seeding default exams:', err);
  }

  // Ensure default timetable exists
  try {
    seedDefaultTimetableIfEmpty();
  } catch (err) {
    console.error('Error seeding default timetable:', err);
  }

  // Ensure default homework exists
  try {
    seedDefaultHomeworkIfEmpty();
  } catch (err) {
    console.error('Error seeding default homework:', err);
  }
}

// Ensure schema is created on initial load
initSQLiteSchema();

// System Settings Helpers
export function getSystemSetting(key: string): string | null {
  try {
    const row = db.prepare('SELECT value FROM system_settings WHERE key = ?').get(key) as { value: string } | undefined;
    return row ? row.value : null;
  } catch (err) {
    console.error('Error fetching system setting:', err);
    return null;
  }
}

export function setSystemSetting(key: string, value: string): void {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO system_settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(key, value, now);
}

export function isSystemSetupCompleted(): boolean {
  return getSystemSetting('system_setup_completed') === 'true';
}

export function getSavedSchoolConfig(): any | null {
  const raw = getSystemSetting('school_config');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error parsing school_config from system_settings:', err);
    return null;
  }
}

export function saveSchoolConfig(configUpdates: any): any {
  const current = getSavedSchoolConfig() || {};
  const merged = { ...current, ...configUpdates };
  setSystemSetting('school_config', JSON.stringify(merged));
  return merged;
}

export function markSystemSetupCompleted(schoolConfig: any): void {
  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    setSystemSetting('system_setup_completed', 'true');
    setSystemSetting('school_config', JSON.stringify(schoolConfig));
    setSystemSetting('setup_completed_at', now);
  });
  tx();
}

export function resetAllSystemData(): void {
  const tx = db.transaction(() => {
    // Delete all transactional, relational, and business data
    db.prepare('DELETE FROM attendance_records').run();
    db.prepare('DELETE FROM fee_payments').run();
    db.prepare('DELETE FROM fee_voucher_items').run();
    db.prepare('DELETE FROM fee_vouchers').run();
    db.prepare('DELETE FROM fee_structures').run();
    db.prepare('DELETE FROM fee_categories').run();
    db.prepare('DELETE FROM students').run();
    db.prepare('DELETE FROM classes').run();
    db.prepare('DELETE FROM exam_results').run();
    db.prepare('DELETE FROM exam_schedules').run();
    db.prepare('DELETE FROM exams').run();
    db.prepare('DELETE FROM timetable_slots').run();
    db.prepare('DELETE FROM homework_submissions').run();
    db.prepare('DELETE FROM homework').run();
    db.prepare("DELETE FROM system_settings WHERE key != 'initialized'").run();
    setSystemSetting('system_setup_completed', 'false');
  });
  tx();
}

export function seedDefaultFeeStructures() {
  const catCount = db.prepare('SELECT COUNT(*) as count FROM fee_categories').get() as { count: number };
  if (catCount.count === 0) {
    const insertCat = db.prepare(`
      INSERT INTO fee_categories (id, name, description, student_type, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const categories = [
      // New Student Fees
      { id: 'cat-adm', name: 'Admission Fee', desc: 'One-time admission charge for new students', type: 'New' },
      { id: 'cat-tui-new', name: 'Tuition Fee (New)', desc: 'Monthly academic instruction fee', type: 'New' },
      { id: 'cat-sch-new', name: 'School Fee', desc: 'Campus facilities and utility contribution', type: 'New' },
      { id: 'cat-crd-new', name: 'School Card Fee', desc: 'Institutional RFID ID card issuance', type: 'New' },
      // Regular Student Fees
      { id: 'cat-mon-reg', name: 'Monthly Fee', desc: 'Standard recurring monthly institutional fee', type: 'Regular' },
      { id: 'cat-tui-reg', name: 'Tuition Fee (Regular)', desc: 'Regular academic monthly tuition', type: 'Regular' },
      { id: 'cat-exam-reg', name: 'Examination Fee', desc: 'Term examinations and assessment fee', type: 'Regular' },
    ];

    const now = new Date().toISOString();
    const insertManyCats = db.transaction((cats) => {
      for (const c of cats) {
        insertCat.run(c.id, c.name, c.desc, c.type, 1, now);
      }
    });
    insertManyCats(categories);
  }

  const structCount = db.prepare('SELECT COUNT(*) as count FROM fee_structures').get() as { count: number };
  if (structCount.count === 0) {
    const insertStruct = db.prepare(`
      INSERT INTO fee_structures (id, name, category_id, fee_name, amount, frequency, student_type, class_name, section_name, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    const structures = [
      // NEW STUDENT DEFAULTS
      { id: 'fs-new-adm', name: 'Admission Fee (New Admission)', catId: 'cat-adm', feeName: 'Admission Fee', amount: 15000, freq: 'One-Time', type: 'New', cls: 'All Classes', sec: 'All' },
      { id: 'fs-new-tui', name: 'Tuition Fee (New Student)', catId: 'cat-tui-new', feeName: 'Tuition Fee', amount: 5000, freq: 'Monthly', type: 'New', cls: 'All Classes', sec: 'All' },
      { id: 'fs-new-sch', name: 'School Fee (New Student)', catId: 'cat-sch-new', feeName: 'School Fee', amount: 1000, freq: 'Monthly', type: 'New', cls: 'All Classes', sec: 'All' },
      { id: 'fs-new-crd', name: 'School Card Fee (ID Card)', catId: 'cat-crd-new', feeName: 'School Card Fee', amount: 500, freq: 'One-Time', type: 'New', cls: 'All Classes', sec: 'All' },

      // REGULAR STUDENT DEFAULTS
      { id: 'fs-reg-mon', name: 'Monthly Fee (Regular Student)', catId: 'cat-mon-reg', feeName: 'Monthly Fee', amount: 1000, freq: 'Monthly', type: 'Regular', cls: 'All Classes', sec: 'All' },
      { id: 'fs-reg-tui', name: 'Tuition Fee (Regular Student)', catId: 'cat-tui-reg', feeName: 'Tuition Fee', amount: 5000, freq: 'Monthly', type: 'Regular', cls: 'All Classes', sec: 'All' },
      { id: 'fs-reg-exam', name: 'Examination Fee (Regular Student)', catId: 'cat-exam-reg', feeName: 'Examination Fee', amount: 1500, freq: 'Per Term', type: 'Regular', cls: 'All Classes', sec: 'All' },
    ];

    const insertManyStructs = db.transaction((items) => {
      for (const item of items) {
        insertStruct.run(item.id, item.name, item.catId, item.feeName, item.amount, item.freq, item.type, item.cls, item.sec, 1, now);
      }
    });
    insertManyStructs(structures);
  }
}

// Transaction: Generate bulk vouchers atomically with duplicate prevention
export const generateVouchersTx = db.transaction((vouchersList: any[]) => {
  const insertVoucherStmt = db.prepare(`
    INSERT INTO fee_vouchers (
      id, voucher_no, student_id, student_name, father_name, admission_no,
      class_name, section_name, roll_number, academic_year, fee_month,
      student_type, issue_date, due_date, current_charges, previous_balance,
      discount, fine, total_payable, paid_amount, remaining_balance, status,
      notes, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?
    )
  `);

  const insertItemStmt = db.prepare(`
    INSERT INTO fee_voucher_items (id, voucher_id, sr_no, fee_description, amount)
    VALUES (?, ?, ?, ?, ?)
  `);

  const checkDuplicateStmt = db.prepare(`
    SELECT id, voucher_no FROM fee_vouchers
    WHERE student_id = ? AND fee_month = ? AND academic_year = ?
  `);

  const getStudentStmt = db.prepare(`
    SELECT id, admission_no, first_name, last_name, name, father_name, class_name, section_name, roll_number
    FROM students WHERE id = ?
  `);

  const updateStudentFeeStatusStmt = db.prepare(`
    UPDATE students SET fee_status = 'Pending' WHERE id = ? AND fee_status = 'Paid'
  `);

  const results: { generated: any[]; skippedDuplicates: string[] } = {
    generated: [],
    skippedDuplicates: [],
  };

  for (const v of vouchersList) {
    const existing = checkDuplicateStmt.get(v.studentId, v.feeMonth, v.academicYear) as any;
    if (existing) {
      results.skippedDuplicates.push(
        `${v.studentName || v.studentId} (${v.admissionNo || ''}) - already has voucher ${existing.voucher_no} for ${v.feeMonth} ${v.academicYear}`
      );
      continue;
    }

    // Resolve student fields if incomplete
    const std = getStudentStmt.get(v.studentId) as any;
    const finalStudentName = v.studentName || (std ? (std.name || `${std.first_name} ${std.last_name}`.trim()) : 'Student');
    const finalFatherName = v.fatherName !== undefined ? v.fatherName : (std ? std.father_name : '') || '';
    const finalAdmissionNo = v.admissionNo || (std ? std.admission_no : 'ADM-000');
    const finalClassName = v.className || v.class || (std ? std.class_name : 'General');
    const finalSectionName = v.sectionName || v.section || (std ? std.section_name : 'A');
    const finalRollNumber = v.rollNumber || (std ? std.roll_number : '') || '';

    const currentCharges = Number(v.currentCharges || 0);
    const previousBalance = Number(v.previousBalance || 0);
    const discount = Number(v.discount || 0);
    const fine = Number(v.fine || 0);
    const totalPayable = Number(v.totalPayable !== undefined ? v.totalPayable : (currentCharges + previousBalance + fine - discount));
    const paidAmount = Number(v.paidAmount || 0);
    const remainingBalance = Number(v.remainingBalance !== undefined ? v.remainingBalance : (totalPayable - paidAmount));
    const status = v.status || (paidAmount >= totalPayable && totalPayable > 0 ? 'PAID' : paidAmount > 0 ? 'PARTIALLY PAID' : 'PENDING');
    const now = new Date().toISOString();

    insertVoucherStmt.run(
      v.id,
      v.voucherNo,
      v.studentId,
      finalStudentName,
      finalFatherName,
      finalAdmissionNo,
      finalClassName,
      finalSectionName,
      finalRollNumber,
      v.academicYear,
      v.feeMonth,
      v.studentType || 'Regular',
      v.issueDate,
      v.dueDate,
      currentCharges,
      previousBalance,
      discount,
      fine,
      totalPayable,
      paidAmount,
      remainingBalance,
      status,
      v.notes || '',
      v.createdAt || now,
      v.updatedAt || now
    );

    if (v.items && Array.isArray(v.items)) {
      v.items.forEach((item: any, idx: number) => {
        insertItemStmt.run(
          item.id || `${v.id}-item-${idx + 1}`,
          v.id,
          item.srNo || idx + 1,
          item.feeDescription,
          Number(item.amount || 0)
        );
      });
    }

    // Mark student status as Pending if currently marked Paid
    if (v.studentId) {
      updateStudentFeeStatusStmt.run(v.studentId);
    }

    results.generated.push({
      ...v,
      studentName: finalStudentName,
      fatherName: finalFatherName,
      admissionNo: finalAdmissionNo,
      className: finalClassName,
      class: finalClassName,
      sectionName: finalSectionName,
      section: finalSectionName,
      rollNumber: finalRollNumber,
      totalPayable,
      remainingBalance,
      status,
    });
  }

  return results;
});

// Transaction: Process Payment with status calculation and receipt generation
export const recordPaymentTx = db.transaction((paymentData: {
  voucherId: string;
  amountPaid: number;
  paymentMethod: string;
  paymentDate: string;
  receivedBy: string;
  remarks?: string;
}) => {
  const getVoucherStmt = db.prepare('SELECT * FROM fee_vouchers WHERE id = ?');
  const voucher = getVoucherStmt.get(paymentData.voucherId) as any;

  if (!voucher) {
    throw new Error('Voucher not found in database');
  }

  const newPaid = Number(voucher.paid_amount || 0) + Number(paymentData.amountPaid);
  const totalPayable = Number(voucher.total_payable);
  const remaining = Math.max(0, totalPayable - newPaid);

  let newStatus: string;
  if (remaining <= 0) {
    newStatus = 'PAID';
  } else if (newPaid > 0) {
    newStatus = 'PARTIALLY PAID';
  } else {
    // Check if overdue
    const isPastDue = new Date(voucher.due_date).getTime() < new Date().getTime();
    newStatus = isPastDue ? 'OVERDUE' : 'PENDING';
  }

  // Generate unique receipt number
  const countRow = db.prepare('SELECT COUNT(*) as count FROM fee_payments').get() as { count: number };
  const receiptNo = `RCP-${new Date().getFullYear()}-${(countRow.count + 1).toString().padStart(4, '0')}`;
  const paymentId = `pay-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const now = new Date().toISOString();

  // Insert payment record
  db.prepare(`
    INSERT INTO fee_payments (
      id, voucher_id, voucher_no, receipt_no, student_id, student_name,
      father_name, admission_no, class_name, section_name, amount_paid,
      previous_paid, remaining_balance, payment_method, payment_date,
      received_by, remarks, status, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?
    )
  `).run(
    paymentId,
    voucher.id,
    voucher.voucher_no,
    receiptNo,
    voucher.student_id,
    voucher.student_name,
    voucher.father_name,
    voucher.admission_no,
    voucher.class_name,
    voucher.section_name,
    paymentData.amountPaid,
    voucher.paid_amount || 0,
    remaining,
    paymentData.paymentMethod,
    paymentData.paymentDate || now.split('T')[0],
    paymentData.receivedBy,
    paymentData.remarks || '',
    newStatus === 'PAID' ? 'PAID' : 'PARTIALLY PAID',
    now
  );

  // Update voucher
  db.prepare(`
    UPDATE fee_vouchers
    SET paid_amount = ?, remaining_balance = ?, status = ?, updated_at = ?
    WHERE id = ?
  `).run(newPaid, remaining, newStatus, now, voucher.id);

  // Update student fee_status in students table
  const studentFeeStatus = remaining <= 0 ? 'Paid' : newPaid > 0 ? 'Partial' : 'Pending';
  db.prepare(`
    UPDATE students SET fee_status = ? WHERE id = ?
  `).run(studentFeeStatus, voucher.student_id);

  const updatedVoucher = getVoucherStmt.get(voucher.id);
  const paymentRecord = db.prepare('SELECT * FROM fee_payments WHERE id = ?').get(paymentId);

  return {
    voucher: updatedVoucher,
    payment: paymentRecord,
  };
});

// Transaction: Delete / Void Fee Voucher
export const deleteFeeVoucherTx = db.transaction((voucherId: string) => {
  db.prepare('DELETE FROM fee_voucher_items WHERE voucher_id = ?').run(voucherId);
  db.prepare('DELETE FROM fee_vouchers WHERE id = ?').run(voucherId);
  return { success: true };
});

// =========================================================================
// ATTENDANCE MANAGEMENT (SQLite PERSISTENCE & DUPLICATE PREVENTION)
// =========================================================================

export interface DbAttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber?: string;
  class: string;
  section: string;
  date: string;
  status: 'Present' | 'Absent' | 'Leave' | 'Late' | 'Excused';
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Atomic SQLite Transaction to Save or Update Attendance Records.
 * Prevents duplicates for the same (student_id, date) via ON CONFLICT DO UPDATE.
 * Enables editing already saved attendance seamlessly.
 */
export const saveAttendanceTx = db.transaction((records: any[]) => {
  const now = new Date().toISOString();
  const upsertStmt = db.prepare(`
    INSERT INTO attendance_records (
      id, student_id, student_name, roll_number,
      class_name, section_name, date, status, remarks,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?
    )
    ON CONFLICT(student_id, date) DO UPDATE SET
      student_name = excluded.student_name,
      roll_number = excluded.roll_number,
      class_name = excluded.class_name,
      section_name = excluded.section_name,
      status = excluded.status,
      remarks = excluded.remarks,
      updated_at = excluded.updated_at
  `);

  const getStudentInfoStmt = db.prepare(`
    SELECT first_name, last_name, roll_number, class_name, section_name
    FROM students WHERE id = ?
  `);

  let count = 0;
  for (const r of records) {
    const studentId = r.studentId || r.student_id;
    let studentName = r.studentName || r.student_name;
    let rollNumber = r.rollNumber || r.roll_number;
    let className = r.class || r.className || r.class_name;
    let sectionName = r.section || r.sectionName || r.section_name;
    const date = r.date;
    const status = r.status || 'Present';
    const remarks = r.remarks || '';
    const id = r.id || `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    if (!studentId || !date) {
      continue;
    }

    if ((!className || !studentName) && studentId) {
      const studentRow = getStudentInfoStmt.get(studentId) as any;
      if (studentRow) {
        if (!studentName) studentName = `${studentRow.first_name || ''} ${studentRow.last_name || ''}`.trim() || 'Student';
        if (!rollNumber) rollNumber = studentRow.roll_number || '';
        if (!className) className = studentRow.class_name || 'General';
        if (!sectionName) sectionName = studentRow.section_name || 'A';
      }
    }

    if (!className) className = 'General';
    if (!sectionName) sectionName = 'A';
    if (!studentName) studentName = 'Student';

    upsertStmt.run(
      id,
      studentId,
      studentName,
      rollNumber || '',
      className,
      sectionName,
      date,
      status,
      remarks,
      now,
      now
    );
    count++;
  }

  return {
    success: true,
    savedCount: count,
  };
});

/**
 * Query attendance records with real-time SQLite filtering.
 */
export function getAttendanceRecordsFromDb(filters?: {
  date?: string;
  className?: string;
  sectionName?: string;
  studentId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}): DbAttendanceRecord[] {
  let query = `
    SELECT
      id,
      student_id AS studentId,
      student_name AS studentName,
      roll_number AS rollNumber,
      class_name AS class,
      section_name AS section,
      date,
      status,
      remarks,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM attendance_records
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters?.date) {
    query += ' AND date = ?';
    params.push(filters.date);
  }
  if (filters?.className && filters.className !== 'All') {
    query += ' AND class_name = ?';
    params.push(filters.className);
  }
  if (filters?.sectionName && filters.sectionName !== 'All') {
    query += ' AND section_name = ?';
    params.push(filters.sectionName);
  }
  if (filters?.studentId) {
    query += ' AND student_id = ?';
    params.push(filters.studentId);
  }
  if (filters?.startDate) {
    query += ' AND date >= ?';
    params.push(filters.startDate);
  }
  if (filters?.endDate) {
    query += ' AND date <= ?';
    params.push(filters.endDate);
  }
  if (filters?.search && filters.search.trim()) {
    query += ' AND (student_name LIKE ? OR roll_number LIKE ?)';
    params.push(`%${filters.search.trim()}%`, `%${filters.search.trim()}%`);
  }

  query += ' ORDER BY date DESC, class_name ASC, section_name ASC, CAST(roll_number AS INTEGER) ASC, student_name ASC';

  try {
    return db.prepare(query).all(...params) as DbAttendanceRecord[];
  } catch (err) {
    console.error('Failed to query attendance_records from DB:', err);
    return [];
  }
}

/**
 * Aggregate Attendance Summary strictly from SQLite database.
 */
export function getAttendanceSummaryFromDb(filters?: {
  date?: string;
  className?: string;
  sectionName?: string;
}) {
  let query = 'SELECT status, COUNT(*) as count FROM attendance_records WHERE 1=1';
  const params: any[] = [];

  if (filters?.date) {
    query += ' AND date = ?';
    params.push(filters.date);
  }
  if (filters?.className && filters.className !== 'All') {
    query += ' AND class_name = ?';
    params.push(filters.className);
  }
  if (filters?.sectionName && filters.sectionName !== 'All') {
    query += ' AND section_name = ?';
    params.push(filters.sectionName);
  }

  query += ' GROUP BY status';

  try {
    const rows = db.prepare(query).all(...params) as { status: string; count: number }[];
    let present = 0;
    let absent = 0;
    let leave = 0;
    let late = 0;
    let excused = 0;

    for (const row of rows) {
      if (row.status === 'Present') present += row.count;
      else if (row.status === 'Absent') absent += row.count;
      else if (row.status === 'Leave') leave += row.count;
      else if (row.status === 'Late') late += row.count;
      else if (row.status === 'Excused') excused += row.count;
    }

    const total = present + absent + leave + late + excused;
    const percentage = total > 0 ? Number((((present + late) / total) * 100).toFixed(1)) : 0;

    return {
      total,
      present,
      absent,
      leave: leave + excused,
      late,
      percentage,
    };
  } catch (err) {
    console.error('Failed to get attendance summary:', err);
    return {
      total: 0,
      present: 0,
      absent: 0,
      leave: 0,
      late: 0,
      percentage: 0,
    };
  }
}

/**
 * Student Individual Attendance History and Percentage.
 */
export function getStudentAttendanceHistoryFromDb(studentId: string) {
  try {
    const records = db.prepare(`
      SELECT
        id,
        student_id AS studentId,
        student_name AS studentName,
        roll_number AS rollNumber,
        class_name AS class,
        section_name AS section,
        date,
        status,
        remarks,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM attendance_records
      WHERE student_id = ?
      ORDER BY date DESC
    `).all(studentId) as DbAttendanceRecord[];

    let present = 0;
    let absent = 0;
    let leave = 0;
    let late = 0;

    for (const r of records) {
      if (r.status === 'Present') present++;
      else if (r.status === 'Absent') absent++;
      else if (r.status === 'Leave' || r.status === 'Excused') leave++;
      else if (r.status === 'Late') late++;
    }

    const total = records.length;
    const percentage = total > 0 ? Number((((present + late) / total) * 100).toFixed(1)) : 0;

    return {
      studentId,
      totalDays: total,
      presentDays: present,
      absentDays: absent,
      leaveDays: leave,
      lateDays: late,
      percentage,
      records,
    };
  } catch (err) {
    console.error('Failed to get student attendance history:', err);
    return {
      studentId,
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      leaveDays: 0,
      lateDays: 0,
      percentage: 0,
      records: [],
    };
  }
}

// =========================================================================
// STUDENTS & CLASSES PERSISTENCE IN SQLITE
// =========================================================================

export function getAllStudentsFromDb(): any[] {
  try {
    return db.prepare(`
      SELECT
        id,
        admission_no AS admissionNo,
        first_name AS firstName,
        last_name AS lastName,
        name,
        father_name AS fatherName,
        gender,
        dob,
        dob AS dateOfBirth,
        cnic_or_bform AS cnicOrBForm,
        blood_group AS bloodGroup,
        phone,
        email,
        address,
        admission_date AS admissionDate,
        class_name AS class,
        section_name AS section,
        roll_number AS rollNumber,
        parent_name AS parentName,
        parent_phone AS parentPhone,
        parent_occupation AS parentOccupation,
        emergency_contact AS emergencyContact,
        fee_status AS feeStatus,
        status,
        photo_url AS photoUrl,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM students
      ORDER BY class_name ASC, section_name ASC, CAST(roll_number AS INTEGER) ASC
    `).all();
  } catch (err) {
    console.error('Failed to query students from DB:', err);
    return [];
  }
}

export function saveStudentToDb(s: any): any {
  const now = new Date().toISOString();
  const id = s.id || `std-${Date.now()}`;
  const firstName = s.firstName || (s.name ? s.name.split(' ')[0] : 'Student');
  const lastName = s.lastName || (s.name ? s.name.split(' ').slice(1).join(' ') : '');
  const name = s.name || `${firstName} ${lastName}`.trim();
  const admissionNo = s.admissionNo || `ADM-${Math.floor(1000 + Math.random() * 9000)}`;

  db.prepare(`
    INSERT INTO students (
      id, admission_no, first_name, last_name, name, father_name,
      gender, dob, cnic_or_bform, blood_group, phone, email, address,
      admission_date, class_name, section_name, roll_number, parent_name,
      parent_phone, parent_occupation, emergency_contact, fee_status,
      status, photo_url, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?
    )
    ON CONFLICT(admission_no) DO UPDATE SET
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      name = excluded.name,
      father_name = excluded.father_name,
      gender = excluded.gender,
      dob = excluded.dob,
      cnic_or_bform = excluded.cnic_or_bform,
      blood_group = excluded.blood_group,
      phone = excluded.phone,
      email = excluded.email,
      address = excluded.address,
      class_name = excluded.class_name,
      section_name = excluded.section_name,
      roll_number = excluded.roll_number,
      parent_name = excluded.parent_name,
      parent_phone = excluded.parent_phone,
      parent_occupation = excluded.parent_occupation,
      emergency_contact = excluded.emergency_contact,
      fee_status = excluded.fee_status,
      status = excluded.status,
      photo_url = excluded.photo_url,
      updated_at = excluded.updated_at
  `).run(
    id,
    admissionNo,
    firstName,
    lastName,
    name,
    s.fatherName || s.parentName || '',
    s.gender || 'Male',
    s.dob || s.dateOfBirth || '',
    s.cnicOrBForm || '',
    s.bloodGroup || '',
    s.phone || '',
    s.email || '',
    s.address || '',
    s.admissionDate || now.split('T')[0],
    s.class || s.className || '',
    s.section || s.sectionName || 'A',
    s.rollNumber || '',
    s.parentName || s.fatherName || '',
    s.parentPhone || '',
    s.parentOccupation || '',
    s.emergencyContact || '',
    s.feeStatus || 'Pending',
    s.status || 'Active',
    s.photoUrl || '',
    now,
    now
  );

  return db.prepare('SELECT * FROM students WHERE id = ? OR admission_no = ?').get(id, admissionNo);
}

export function deleteStudentFromDb(id: string): void {
  db.prepare('DELETE FROM students WHERE id = ?').run(id);
}

export function getAllClassesFromDb(): any[] {
  try {
    return db.prepare('SELECT id, name, section, room, capacity FROM classes ORDER BY name ASC, section ASC').all();
  } catch (err) {
    console.error('Failed to get classes from DB:', err);
    return [];
  }
}

export function seedDefaultClassesIfEmpty(): void {
  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM classes').get() as { count: number };
    if (count.count === 0) {
      const defaultClasses = [
        'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
        'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'
      ];
      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO classes (id, name, section, room, capacity, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const now = new Date().toISOString();
      for (let i = 0; i < defaultClasses.length; i++) {
        const name = defaultClasses[i];
        insertStmt.run(`cls-${i + 1}-A`, name, 'A', `Room ${i + 1}A`, 40, now);
        insertStmt.run(`cls-${i + 1}-B`, name, 'B', `Room ${i + 1}B`, 40, now);
      }
    }
  } catch (err) {
    console.error('Failed to seed classes:', err);
  }
}

export function seedDefaultStudentsIfEmpty(): void {
  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM students').get() as { count: number };
    if (count.count > 0) return;

    const boys = ['Muhammad', 'Ahmed', 'Ali', 'Bilal', 'Hamza', 'Usman', 'Hassan', 'Umar', 'Zayn', 'Saad', 'Daniyal', 'Mustafa', 'Abdullah', 'Farhan', 'Ibrahim'];
    const girls = ['Fatima', 'Ayesha', 'Zainab', 'Maryam', 'Noor', 'Hafsa', 'Eman', 'Sara', 'Khadija', 'Hania', 'Anaya', 'Amina', 'Mehak', 'Laiba', 'Dua'];
    const lastNames = ['Khan', 'Malik', 'Chaudhry', 'Sheikh', 'Bhatti', 'Raza', 'Qureshi', 'Siddiqui', 'Shah', 'Akhtar', 'Abbasi', 'Butt', 'Mirza', 'Jutt', 'Rehman'];
    const fatherNames = ['Tariq Mehmood', 'Imran Khan', 'Abdul Rasheed', 'Naveed Akhtar', 'Muhammad Ashraf', 'Zahid Hussain', 'Farooq Ahmed', 'Shahid Iqbal', 'Khalid Mahmood', 'Nasir Ali'];

    const classes = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'];
    const sections = ['A', 'B'];

    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO students (
        id, admission_no, first_name, last_name, name, father_name,
        gender, dob, cnic_or_bform, blood_group, phone, email, address,
        admission_date, class_name, section_name, roll_number, parent_name,
        parent_phone, parent_occupation, emergency_contact, fee_status,
        status, photo_url, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `);

    const now = new Date().toISOString();
    let admCounter = 101;

    const tx = db.transaction(() => {
      for (let cIdx = 0; cIdx < classes.length; cIdx++) {
        const cls = classes[cIdx];
        for (const sec of sections) {
          const countPerSec = 12; // 12 students per section = 240 students total across school
          for (let roll = 1; roll <= countPerSec; roll++) {
            const isBoy = roll % 2 !== 0;
            const firstName = isBoy ? boys[(roll + cIdx) % boys.length] : girls[(roll + cIdx) % girls.length];
            const lastName = lastNames[(roll * 2 + cIdx) % lastNames.length];
            const fullName = `${firstName} ${lastName}`;
            const father = fatherNames[(roll + cIdx) % fatherNames.length];
            const rollStr = roll.toString().padStart(2, '0');
            const admNo = `ADM-2026-${admCounter.toString().padStart(4, '0')}`;
            const id = `std-${admCounter}`;
            admCounter++;

            insertStmt.run(
              id,
              admNo,
              firstName,
              lastName,
              fullName,
              father,
              isBoy ? 'Male' : 'Female',
              `201${Math.max(0, 8 - Math.floor(cIdx / 2))}-0${(roll % 9) + 1}-15`,
              `35201-${Math.floor(1000000 + roll * 12345)}-${isBoy ? 1 : 2}`,
              roll % 4 === 0 ? 'A+' : roll % 4 === 1 ? 'B+' : roll % 4 === 2 ? 'O+' : 'AB+',
              `0300-${Math.floor(1000000 + roll * 23456)}`,
              `${firstName.toLowerCase()}.${admNo.toLowerCase()}@school.edu.pk`,
              `House #${roll * 4}, Street ${(roll % 5) + 1}, Sector G-9, Islamabad`,
              '2026-01-10',
              cls,
              sec,
              rollStr,
              father,
              `0321-${Math.floor(1000000 + roll * 34567)}`,
              roll % 3 === 0 ? 'Government Officer' : roll % 3 === 1 ? 'Business Owner' : 'Engineer',
              `0333-${Math.floor(1000000 + roll * 45678)}`,
              roll % 3 === 0 ? 'Paid' : 'Pending',
              'Active',
              `https://images.unsplash.com/photo-${isBoy ? '1539571696357-5a69c17a67c6' : '1494790108377-be9c29b29330'}?w=150`,
              now,
              now
            );
          }
        }
      }
    });

    tx();
    console.log(`Seeded ${admCounter - 101} standard students across all classes into SQLite.`);
  } catch (err) {
    console.error('Failed to seed default students:', err);
  }
}

// ==========================================
// STAFF & PAYROLL PERSISTENCE & TRANSACTIONS
// ==========================================

export function seedDefaultStaff() {
  try {
    const count = (db.prepare('SELECT COUNT(*) as cnt FROM staff').get() as any)?.cnt || 0;
    if (count > 0) return;

    const now = new Date().toISOString();
    const defaultStaff = [
      {
        id: 'stf-1',
        employeeId: 'EMP-101',
        name: 'Dr. Tariq Mehmood',
        role: 'Principal',
        department: 'Executive Management',
        designation: 'Principal & Senior Administrator',
        cnic: '35201-1234567-1',
        gender: 'Male',
        email: 'tariq.mehmood@school.edu.pk',
        phone: '0300-1234567',
        basicSalary: 180000,
        allowanceRate: 20,
        taxRate: 5,
        deductionRate: 5,
        joiningDate: '2020-08-01',
        status: 'Active',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        bankName: 'Habib Bank Limited',
        bankAccountNo: '0123-4567890123',
      },
      {
        id: 'stf-2',
        employeeId: 'EMP-102',
        name: 'Muhammad Salman',
        role: 'Teacher',
        department: 'Mathematics',
        designation: 'Head of Mathematics',
        cnic: '35201-2345678-1',
        gender: 'Male',
        email: 'salman.math@school.edu.pk',
        phone: '0301-2345678',
        basicSalary: 95000,
        allowanceRate: 15,
        taxRate: 2.5,
        deductionRate: 5,
        joiningDate: '2021-09-15',
        status: 'Active',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        bankName: 'Meezan Bank',
        bankAccountNo: '0234-5678901234',
      },
      {
        id: 'stf-3',
        employeeId: 'EMP-103',
        name: 'Ayesha Siddiqui',
        role: 'Teacher',
        department: 'Natural Sciences',
        designation: 'Senior Physics Faculty',
        cnic: '35201-3456789-2',
        gender: 'Female',
        email: 'ayesha.science@school.edu.pk',
        phone: '0302-3456789',
        basicSalary: 88000,
        allowanceRate: 15,
        taxRate: 2.5,
        deductionRate: 5,
        joiningDate: '2022-01-10',
        status: 'Active',
        photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        bankName: 'Bank Alfalah',
        bankAccountNo: '0345-6789012345',
      },
      {
        id: 'stf-4',
        employeeId: 'EMP-104',
        name: 'Bilal Ahmed',
        role: 'Teacher',
        department: 'Humanities & Languages',
        designation: 'English Literature Coordinator',
        cnic: '35201-4567890-1',
        gender: 'Male',
        email: 'bilal.english@school.edu.pk',
        phone: '0303-4567890',
        basicSalary: 82000,
        allowanceRate: 15,
        taxRate: 2.5,
        deductionRate: 5,
        joiningDate: '2022-04-01',
        status: 'Active',
        photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        bankName: 'Faysal Bank',
        bankAccountNo: '0456-7890123456',
      },
      {
        id: 'stf-5',
        employeeId: 'EMP-105',
        name: 'Fatima Zahra',
        role: 'Teacher',
        department: 'Information Technology',
        designation: 'Computer Science & ICT Head',
        cnic: '35201-5678901-2',
        gender: 'Female',
        email: 'fatima.cs@school.edu.pk',
        phone: '0304-5678901',
        basicSalary: 92000,
        allowanceRate: 15,
        taxRate: 2.5,
        deductionRate: 5,
        joiningDate: '2021-11-01',
        status: 'Active',
        photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
        bankName: 'Standard Chartered',
        bankAccountNo: '0567-8901234567',
      },
      {
        id: 'stf-6',
        employeeId: 'EMP-106',
        name: 'Usman Ghani',
        role: 'Accountant',
        department: 'Finance & Accounts',
        designation: 'Chief Bursar & Accountant',
        cnic: '35201-6789012-1',
        gender: 'Male',
        email: 'usman.finance@school.edu.pk',
        phone: '0305-6789012',
        basicSalary: 110000,
        allowanceRate: 18,
        taxRate: 3.5,
        deductionRate: 5,
        joiningDate: '2019-03-15',
        status: 'Active',
        photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        bankName: 'Allied Bank Limited',
        bankAccountNo: '0678-9012345678',
      },
      {
        id: 'stf-7',
        employeeId: 'EMP-107',
        name: 'Zainab Bibi',
        role: 'Librarian',
        department: 'Library & Learning Resources',
        designation: 'Senior Librarian & Archivist',
        cnic: '35201-7890123-2',
        gender: 'Female',
        email: 'zainab.library@school.edu.pk',
        phone: '0306-7890123',
        basicSalary: 68000,
        allowanceRate: 12,
        taxRate: 0,
        deductionRate: 5,
        joiningDate: '2023-01-05',
        status: 'Active',
        photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        bankName: 'MCB Bank',
        bankAccountNo: '0789-0123456789',
      },
      {
        id: 'stf-8',
        employeeId: 'EMP-108',
        name: 'Tariq Jameel',
        role: 'Transport Manager',
        department: 'Transport & Fleet',
        designation: 'Fleet Supervisor',
        cnic: '35201-8901234-1',
        gender: 'Male',
        email: 'tariq.transport@school.edu.pk',
        phone: '0307-8901234',
        basicSalary: 62000,
        allowanceRate: 12,
        taxRate: 0,
        deductionRate: 5,
        joiningDate: '2022-06-15',
        status: 'Active',
        photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
        bankName: 'United Bank Limited',
        bankAccountNo: '0890-1234567890',
      },
      {
        id: 'stf-9',
        employeeId: 'EMP-109',
        name: 'Abdul Sattar',
        role: 'Security',
        department: 'Security & Estates',
        designation: 'Chief Security Officer',
        cnic: '35201-9012345-1',
        gender: 'Male',
        email: 'security@school.edu.pk',
        phone: '0308-9012345',
        basicSalary: 52000,
        allowanceRate: 10,
        taxRate: 0,
        deductionRate: 5,
        joiningDate: '2021-02-01',
        status: 'Active',
        photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
        bankName: 'National Bank of Pakistan',
        bankAccountNo: '0901-2345678901',
      },
      {
        id: 'stf-10',
        employeeId: 'EMP-110',
        name: 'Maria Khan',
        role: 'Teacher',
        department: 'Primary Section',
        designation: 'Junior Wing Head Coordinator',
        cnic: '35201-0123456-2',
        gender: 'Female',
        email: 'maria.primary@school.edu.pk',
        phone: '0309-0123456',
        basicSalary: 78000,
        allowanceRate: 15,
        taxRate: 2.5,
        deductionRate: 5,
        joiningDate: '2022-08-15',
        status: 'Active',
        photoUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150',
        bankName: 'Askari Bank',
        bankAccountNo: '1012-3456789012',
      },
    ];

    const insertStmt = db.prepare(`
      INSERT INTO staff (
        id, employee_id, name, role, department, designation,
        cnic, gender, email, phone, basic_salary,
        allowance_rate, tax_rate, deduction_rate, joining_date,
        status, photo_url, bank_name, bank_account_no,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const tx = db.transaction(() => {
      for (const s of defaultStaff) {
        insertStmt.run(
          s.id,
          s.employeeId,
          s.name,
          s.role,
          s.department,
          s.designation,
          s.cnic,
          s.gender,
          s.email,
          s.phone,
          s.basicSalary,
          s.allowanceRate,
          s.taxRate,
          s.deductionRate,
          s.joiningDate,
          s.status,
          s.photoUrl,
          s.bankName,
          s.bankAccountNo,
          now,
          now
        );
      }
    });

    tx();
    console.log(`Seeded ${defaultStaff.length} standard institutional staff into SQLite.`);

    // Also generate payroll for the current month
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonth = `${months[new Date().getMonth()]} ${new Date().getFullYear()}`;
    generateMonthlyPayrollTx(currentMonth);
  } catch (err) {
    console.error('Failed to seed default staff:', err);
  }
}

export function getAllStaffFromDb(): any[] {
  try {
    const rows = db.prepare('SELECT * FROM staff ORDER BY employee_id ASC').all() as any[];
    return rows.map((r) => ({
      id: r.id,
      employeeId: r.employee_id,
      name: r.name,
      role: r.role,
      department: r.department,
      designation: r.designation,
      cnic: r.cnic,
      gender: r.gender,
      email: r.email,
      phone: r.phone,
      salary: Number(r.basic_salary),
      basicSalary: Number(r.basic_salary),
      allowanceRate: Number(r.allowance_rate || 0),
      taxRate: Number(r.tax_rate || 0),
      deductionRate: Number(r.deduction_rate || 0),
      joiningDate: r.joining_date,
      status: r.status,
      photoUrl: r.photo_url,
      avatar: r.photo_url,
      bankName: r.bank_name,
      bankAccountNo: r.bank_account_no,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  } catch (err) {
    console.error('Failed to fetch staff from DB:', err);
    return [];
  }
}

export function upsertStaffTx(stf: any): any {
  const now = new Date().toISOString();
  const id = stf.id || `stf-${Date.now()}`;
  const employeeId = stf.employeeId || `EMP-${Math.floor(100 + Math.random() * 900)}`;

  db.prepare(`
    INSERT INTO staff (
      id, employee_id, name, role, department, designation,
      cnic, gender, email, phone, basic_salary,
      allowance_rate, tax_rate, deduction_rate, joining_date,
      status, photo_url, bank_name, bank_account_no,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(employee_id) DO UPDATE SET
      name = excluded.name,
      role = excluded.role,
      department = excluded.department,
      designation = excluded.designation,
      cnic = excluded.cnic,
      gender = excluded.gender,
      email = excluded.email,
      phone = excluded.phone,
      basic_salary = excluded.basic_salary,
      allowance_rate = excluded.allowance_rate,
      tax_rate = excluded.tax_rate,
      deduction_rate = excluded.deduction_rate,
      status = excluded.status,
      photo_url = excluded.photo_url,
      bank_name = excluded.bank_name,
      bank_account_no = excluded.bank_account_no,
      updated_at = excluded.updated_at
  `).run(
    id,
    employeeId,
    stf.name,
    stf.role || 'Teacher',
    stf.department || 'Academics',
    stf.designation || 'Faculty Member',
    stf.cnic || '',
    stf.gender || 'Male',
    stf.email || '',
    stf.phone || '',
    Number(stf.basicSalary || stf.salary || 60000),
    Number(stf.allowanceRate ?? 15),
    Number(stf.taxRate ?? 2.5),
    Number(stf.deductionRate ?? 5),
    stf.joiningDate || now.split('T')[0],
    stf.status || 'Active',
    stf.photoUrl || '',
    stf.bankName || 'Habib Bank Limited',
    stf.bankAccountNo || '',
    now,
    now
  );

  return db.prepare('SELECT * FROM staff WHERE employee_id = ?').get(employeeId);
}

export function deleteStaffTx(id: string): boolean {
  const res = db.prepare('DELETE FROM staff WHERE id = ? OR employee_id = ?').run(id, id);
  return res.changes > 0;
}

export function generateMonthlyPayrollTx(month: string): { generated: number; skipped: number; totalAmount: number } {
  const activeStaff = db.prepare("SELECT * FROM staff WHERE status = 'Active'").all() as any[];
  const existingRecords = db.prepare('SELECT employee_id FROM payroll_records WHERE month = ?').all(month) as { employee_id: string }[];
  const existingSet = new Set(existingRecords.map((r) => r.employee_id));

  const insertStmt = db.prepare(`
    INSERT INTO payroll_records (
      id, employee_id, employee_name, role, designation, department,
      month, basic_salary, allowances, deductions, tax, net_salary,
      payment_method, payment_date, status, remarks, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let generated = 0;
  let skipped = 0;
  let totalAmount = 0;
  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    for (const stf of activeStaff) {
      if (existingSet.has(stf.employee_id)) {
        skipped++;
        continue;
      }

      const basic = Number(stf.basic_salary) || 50000;
      const allowanceRate = Number(stf.allowance_rate ?? 15);
      const deductionRate = Number(stf.deduction_rate ?? 5);
      const taxRate = Number(stf.tax_rate ?? 2.5);

      const allowances = Math.round(basic * (allowanceRate / 100));
      const deductions = Math.round(basic * (deductionRate / 100));
      const tax = Math.round(basic * (taxRate / 100));
      const netSalary = Math.round(basic + allowances - deductions - tax);

      const id = `pr-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      insertStmt.run(
        id,
        stf.employee_id,
        stf.name,
        stf.role,
        stf.designation,
        stf.department,
        month,
        basic,
        allowances,
        deductions,
        tax,
        netSalary,
        'Bank Transfer',
        null,
        'Pending',
        `Automated monthly payroll calculation for ${month}`,
        now,
        now
      );

      generated++;
      totalAmount += netSalary;
    }
  });

  tx();
  return { generated, skipped, totalAmount };
}

export function getAllPayrollFromDb(monthFilter?: string): any[] {
  try {
    let query = 'SELECT * FROM payroll_records WHERE 1=1';
    const params: any[] = [];
    if (monthFilter && monthFilter !== 'All Months') {
      query += ' AND month = ?';
      params.push(monthFilter);
    }
    query += ' ORDER BY created_at DESC, employee_name ASC';

    const rows = db.prepare(query).all(...params) as any[];
    return rows.map((r) => ({
      id: r.id,
      employeeId: r.employee_id,
      employeeName: r.employee_name,
      role: r.role,
      designation: r.designation,
      department: r.department,
      month: r.month,
      basicSalary: Number(r.basic_salary),
      allowances: Number(r.allowances),
      deductions: Number(r.deductions),
      tax: Number(r.tax),
      netSalary: Number(r.net_salary),
      paymentMethod: r.payment_method,
      paymentDate: r.payment_date,
      status: r.status,
      remarks: r.remarks,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  } catch (err) {
    console.error('Failed to fetch payroll records from DB:', err);
    return [];
  }
}

export function updatePayrollStatusTx(id: string, status: string, paymentMethod?: string, paymentDate?: string): any {
  const now = new Date().toISOString();
  const dateStr = paymentDate || (status === 'Paid' ? now.split('T')[0] : null);
  const method = paymentMethod || 'Bank Transfer';

  db.prepare(`
    UPDATE payroll_records
    SET status = ?,
        payment_method = COALESCE(?, payment_method),
        payment_date = ?,
        updated_at = ?
    WHERE id = ?
  `).run(status, method, dateStr, now, id);

  return db.prepare('SELECT * FROM payroll_records WHERE id = ?').get(id);
}

export function disburseBulkPayrollTx(ids: string[], paymentMethod?: string, paymentDate?: string): { updated: number } {
  const now = new Date().toISOString();
  const dateStr = paymentDate || now.split('T')[0];
  const method = paymentMethod || 'Bank Transfer';

  const stmt = db.prepare(`
    UPDATE payroll_records
    SET status = 'Paid',
        payment_method = ?,
        payment_date = ?,
        updated_at = ?
    WHERE id = ? AND status != 'Paid'
  `);

  let updated = 0;
  const tx = db.transaction(() => {
    for (const id of ids) {
      const res = stmt.run(method, dateStr, now, id);
      if (res.changes > 0) updated++;
    }
  });

  tx();
  return { updated };
}

export function getPayrollStatsFromDb(monthFilter?: string) {
  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];
    if (monthFilter && monthFilter !== 'All Months') {
      where += ' AND month = ?';
      params.push(monthFilter);
    }

    const totalBudgetRow = db.prepare(`SELECT SUM(net_salary) as total FROM payroll_records ${where}`).get(...params) as any;
    const disbursedRow = db.prepare(`SELECT SUM(net_salary) as total, COUNT(*) as cnt FROM payroll_records ${where} AND status = 'Paid'`).get(...params) as any;
    const pendingRow = db.prepare(`SELECT SUM(net_salary) as total, COUNT(*) as cnt FROM payroll_records ${where} AND status != 'Paid'`).get(...params) as any;
    const staffCountRow = db.prepare("SELECT COUNT(*) as cnt FROM staff WHERE status = 'Active'").get() as any;

    return {
      totalBudget: Number(totalBudgetRow?.total || 0),
      totalDisbursed: Number(disbursedRow?.total || 0),
      paidCount: Number(disbursedRow?.cnt || 0),
      totalPending: Number(pendingRow?.total || 0),
      pendingCount: Number(pendingRow?.cnt || 0),
      activeStaffCount: Number(staffCountRow?.cnt || 0),
    };
  } catch (err) {
    console.error('Failed to get payroll stats from DB:', err);
    return {
      totalBudget: 0,
      totalDisbursed: 0,
      paidCount: 0,
      totalPending: 0,
      pendingCount: 0,
      activeStaffCount: 0,
    };
  }
}

// ==========================================
// EXAMS, SCHEDULES & RESULTS (SQLite Engine)
// ==========================================

export function getAllExamsFromDb() {
  try {
    seedDefaultExamsIfEmpty();
    const rows = db.prepare('SELECT * FROM exams ORDER BY start_date DESC').all() as any[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      term: r.term,
      academicSession: r.academic_session,
      startDate: r.start_date,
      endDate: r.end_date,
      classes: JSON.parse(r.classes || '[]'),
      status: r.status,
      totalMarks: Number(r.total_marks || 100),
      passingMarks: Number(r.passing_marks || 40),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  } catch (err) {
    console.error('Failed to get exams from DB:', err);
    return [];
  }
}

export function upsertExamTx(exam: any) {
  const now = new Date().toISOString();
  const id = exam.id || `exam-${Date.now()}`;
  const classesJson = JSON.stringify(exam.classes || []);

  const stmt = db.prepare(`
    INSERT INTO exams (id, name, term, academic_session, start_date, end_date, classes, status, total_marks, passing_marks, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      term = excluded.term,
      academic_session = excluded.academic_session,
      start_date = excluded.start_date,
      end_date = excluded.end_date,
      classes = excluded.classes,
      status = excluded.status,
      total_marks = excluded.total_marks,
      passing_marks = excluded.passing_marks,
      updated_at = excluded.updated_at
  `);

  stmt.run(
    id,
    exam.name,
    exam.term || 'Mid Term',
    exam.academicSession || '2025-2026',
    exam.startDate,
    exam.endDate,
    classesJson,
    exam.status || 'Upcoming',
    exam.totalMarks || 100,
    exam.passingMarks || 40,
    now,
    now
  );

  return { id, ...exam, classes: exam.classes || [] };
}

export function deleteExamTx(id: string) {
  db.prepare('DELETE FROM exam_results WHERE exam_id = ?').run(id);
  db.prepare('DELETE FROM exam_schedules WHERE exam_id = ?').run(id);
  return db.prepare('DELETE FROM exams WHERE id = ?').run(id);
}

export function getAllExamSchedulesFromDb(examId?: string) {
  try {
    let sql = 'SELECT * FROM exam_schedules';
    const params: any[] = [];
    if (examId) {
      sql += ' WHERE exam_id = ?';
      params.push(examId);
    }
    sql += ' ORDER BY date ASC, start_time ASC';

    const rows = db.prepare(sql).all(...params) as any[];
    return rows.map((r) => ({
      id: r.id,
      examId: r.exam_id,
      examName: r.exam_name,
      term: r.term,
      class: r.class_name,
      subject: r.subject,
      date: r.date,
      startTime: r.start_time,
      endTime: r.end_time,
      roomNumber: r.room_number,
      maxMarks: Number(r.max_marks || 100),
      invigilator: r.invigilator,
    }));
  } catch (err) {
    console.error('Failed to get exam schedules from DB:', err);
    return [];
  }
}

export function addExamScheduleTx(sched: any) {
  const now = new Date().toISOString();
  const id = sched.id || `exs-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

  db.prepare(`
    INSERT INTO exam_schedules (id, exam_id, exam_name, term, class_name, subject, date, start_time, end_time, room_number, max_marks, invigilator, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    sched.examId,
    sched.examName || '',
    sched.term || 'Mid Term',
    sched.class || sched.className || '',
    sched.subject,
    sched.date,
    sched.startTime || '09:00 AM',
    sched.endTime || '12:00 PM',
    sched.roomNumber || 'Hall A',
    sched.maxMarks || 100,
    sched.invigilator || '',
    now
  );

  return { id, ...sched };
}

export function deleteExamScheduleTx(id: string) {
  return db.prepare('DELETE FROM exam_schedules WHERE id = ?').run(id);
}

export function getAllExamResultsFromDb(filter?: {
  examId?: string;
  studentId?: string;
  class?: string;
  term?: string;
}) {
  try {
    let sql = 'SELECT * FROM exam_results WHERE 1=1';
    const params: any[] = [];

    if (filter?.examId) {
      sql += ' AND exam_id = ?';
      params.push(filter.examId);
    }
    if (filter?.studentId) {
      sql += ' AND student_id = ?';
      params.push(filter.studentId);
    }
    if (filter?.class) {
      sql += ' AND class_name = ?';
      params.push(filter.class);
    }
    if (filter?.term) {
      sql += ' AND term = ?';
      params.push(filter.term);
    }

    sql += ' ORDER BY class_name ASC, roll_number ASC, subject ASC';
    const rows = db.prepare(sql).all(...params) as any[];

    return rows.map((r) => ({
      id: r.id,
      examId: r.exam_id,
      examName: r.exam_name,
      term: r.term,
      studentId: r.student_id,
      studentName: r.student_name,
      rollNumber: r.roll_number,
      class: r.class_name,
      section: r.section_name,
      subject: r.subject,
      theoryMarks: r.theory_marks !== null ? Number(r.theory_marks) : null,
      practicalMarks: r.practical_marks !== null ? Number(r.practical_marks) : null,
      totalMarks: Number(r.total_marks || 100),
      obtainedMarks: Number(r.obtained_marks || 0),
      grade: r.grade,
      remarks: r.remarks || '',
    }));
  } catch (err) {
    console.error('Failed to get exam results from DB:', err);
    return [];
  }
}

export function upsertExamResultsTx(results: any[]) {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO exam_results (
      id, exam_id, exam_name, term, student_id, student_name, roll_number,
      class_name, section_name, subject, theory_marks, practical_marks,
      total_marks, obtained_marks, grade, remarks, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(exam_id, student_id, subject) DO UPDATE SET
      exam_name = excluded.exam_name,
      term = excluded.term,
      student_name = excluded.student_name,
      roll_number = excluded.roll_number,
      class_name = excluded.class_name,
      section_name = excluded.section_name,
      theory_marks = excluded.theory_marks,
      practical_marks = excluded.practical_marks,
      total_marks = excluded.total_marks,
      obtained_marks = excluded.obtained_marks,
      grade = excluded.grade,
      remarks = excluded.remarks,
      updated_at = excluded.updated_at
  `);

  const tx = db.transaction(() => {
    for (const r of results) {
      const id = r.id || `res-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      stmt.run(
        id,
        r.examId,
        r.examName || '',
        r.term || 'Mid Term',
        r.studentId,
        r.studentName,
        r.rollNumber || '',
        r.class || r.className || '',
        r.section || r.sectionName || '',
        r.subject,
        r.theoryMarks !== undefined && r.theoryMarks !== null ? Number(r.theoryMarks) : Number(r.obtainedMarks),
        r.practicalMarks !== undefined && r.practicalMarks !== null ? Number(r.practicalMarks) : null,
        Number(r.totalMarks || 100),
        Number(r.obtainedMarks || 0),
        r.grade || 'A',
        r.remarks || 'Satisfactory',
        now,
        now
      );
    }
  });

  tx();
  return { savedCount: results.length };
}

export function seedDefaultExamsIfEmpty() {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM exams').get() as { count: number };
  if (countRow.count > 0) return;

  const now = new Date().toISOString();
  const defaultExams = [
    {
      id: 'exam-first-term',
      name: 'First Term Examination 2025-2026',
      term: 'First Term',
      academic_session: '2025-2026',
      start_date: '2025-10-10',
      end_date: '2025-10-22',
      classes: JSON.stringify(['Grade 10', 'Grade 9', 'Grade 8', 'Grade 7', 'Grade 6']),
      status: 'Completed',
      total_marks: 100,
      passing_marks: 40,
    },
    {
      id: 'exam-mid-term',
      name: 'Mid-Term Examination 2025-2026',
      term: 'Mid Term',
      academic_session: '2025-2026',
      start_date: '2025-12-15',
      end_date: '2025-12-24',
      classes: JSON.stringify(['Grade 10', 'Grade 9', 'Grade 8', 'Grade 7', 'Grade 6']),
      status: 'Completed',
      total_marks: 100,
      passing_marks: 40,
    },
    {
      id: 'exam-final-term',
      name: 'Final Term Annual Examination 2026',
      term: 'Final Term',
      academic_session: '2025-2026',
      start_date: '2026-03-10',
      end_date: '2026-03-25',
      classes: JSON.stringify(['Grade 10', 'Grade 9', 'Grade 8', 'Grade 7', 'Grade 6']),
      status: 'Upcoming',
      total_marks: 100,
      passing_marks: 40,
    },
  ];

  const stmt = db.prepare(`
    INSERT INTO exams (id, name, term, academic_session, start_date, end_date, classes, status, total_marks, passing_marks, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const ex of defaultExams) {
    stmt.run(
      ex.id,
      ex.name,
      ex.term,
      ex.academic_session,
      ex.start_date,
      ex.end_date,
      ex.classes,
      ex.status,
      ex.total_marks,
      ex.passing_marks,
      now,
      now
    );
  }
}

// ==========================================
// TIMETABLE SLOTS SQLITE OPERATIONS
// ==========================================

export function getAllTimetableSlotsFromDb(filters?: { className?: string; sectionName?: string; teacherName?: string }): any[] {
  let sql = 'SELECT * FROM timetable_slots WHERE 1=1';
  const params: any[] = [];

  if (filters?.className) {
    sql += ' AND class_name = ?';
    params.push(filters.className);
  }
  if (filters?.sectionName && filters.sectionName !== 'All') {
    sql += ' AND section_name = ?';
    params.push(filters.sectionName);
  }
  if (filters?.teacherName) {
    sql += ' AND teacher_name = ?';
    params.push(filters.teacherName);
  }

  sql += ' ORDER BY CASE day WHEN "Monday" THEN 1 WHEN "Tuesday" THEN 2 WHEN "Wednesday" THEN 3 WHEN "Thursday" THEN 4 WHEN "Friday" THEN 5 WHEN "Saturday" THEN 6 ELSE 7 END, period ASC';

  const rows = db.prepare(sql).all(...params) as any[];
  return rows.map((r) => ({
    id: r.id,
    day: r.day,
    dayOfWeek: r.day,
    period: Number(r.period),
    class: r.class_name,
    section: r.section_name,
    startTime: r.start_time,
    endTime: r.end_time,
    subject: r.subject,
    teacherName: r.teacher_name || '',
    teacher: r.teacher_name || '',
    roomNumber: r.room_number || '',
    room: r.room_number || '',
    isBreak: Boolean(r.is_break),
  }));
}

export function upsertTimetableSlotTx(slot: any): any {
  const now = new Date().toISOString();
  const id = slot.id || `tt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

  const stmt = db.prepare(`
    INSERT INTO timetable_slots (
      id, day, period, class_name, section_name, start_time, end_time, subject, teacher_name, room_number, is_break, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      day = excluded.day,
      period = excluded.period,
      class_name = excluded.class_name,
      section_name = excluded.section_name,
      start_time = excluded.start_time,
      end_time = excluded.end_time,
      subject = excluded.subject,
      teacher_name = excluded.teacher_name,
      room_number = excluded.room_number,
      is_break = excluded.is_break,
      updated_at = excluded.updated_at
  `);

  stmt.run(
    id,
    slot.day || slot.dayOfWeek || 'Monday',
    Number(slot.period || 1),
    slot.class || slot.className || 'Grade 10',
    slot.section || slot.sectionName || 'A',
    slot.startTime || '08:30',
    slot.endTime || '09:15',
    slot.subject || 'Mathematics',
    slot.teacherName || slot.teacher || '',
    slot.roomNumber || slot.room || '',
    slot.isBreak ? 1 : 0,
    now,
    now
  );

  return {
    id,
    day: slot.day || slot.dayOfWeek || 'Monday',
    dayOfWeek: slot.day || slot.dayOfWeek || 'Monday',
    period: Number(slot.period || 1),
    class: slot.class || slot.className || 'Grade 10',
    section: slot.section || slot.sectionName || 'A',
    startTime: slot.startTime || '08:30',
    endTime: slot.endTime || '09:15',
    subject: slot.subject || 'Mathematics',
    teacherName: slot.teacherName || slot.teacher || '',
    teacher: slot.teacherName || slot.teacher || '',
    roomNumber: slot.roomNumber || slot.room || '',
    room: slot.roomNumber || slot.room || '',
    isBreak: Boolean(slot.isBreak),
  };
}

export function deleteTimetableSlotTx(id: string): boolean {
  const res = db.prepare('DELETE FROM timetable_slots WHERE id = ?').run(id);
  return res.changes > 0;
}

export function seedDefaultTimetableIfEmpty() {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM timetable_slots').get() as { count: number };
  if (countRow.count > 0) return;

  const now = new Date().toISOString();
  const scheduleData = [
    // Grade 10-A
    { day: 'Monday', period: 1, class: 'Grade 10', section: 'A', start: '08:30', end: '09:15', subject: 'Mathematics', teacher: 'Dr. Arthur Pendelton', room: 'Room 201' },
    { day: 'Monday', period: 2, class: 'Grade 10', section: 'A', start: '09:20', end: '10:05', subject: 'Physics', teacher: 'Prof. Marcus Vance', room: 'Physics Lab' },
    { day: 'Monday', period: 3, class: 'Grade 10', section: 'A', start: '10:10', end: '10:55', subject: 'English Language & Literature', teacher: 'Mrs. Eleanor Hayes', room: 'Room 201' },
    { day: 'Monday', period: 4, class: 'Grade 10', section: 'A', start: '11:00', end: '11:45', subject: 'Urdu Literature', teacher: 'Mr. Tariq Mehmood', room: 'Room 201' },
    { day: 'Monday', period: 5, class: 'Grade 10', section: 'A', start: '12:15', end: '01:00', subject: 'Islamiat / Ethics', teacher: 'Qari Abdul Rahman', room: 'Room 201' },
    { day: 'Monday', period: 6, class: 'Grade 10', section: 'A', start: '01:05', end: '01:50', subject: 'Computer Science', teacher: 'Ms. Clara Oswald', room: 'Computer Lab' },
    { day: 'Monday', period: 7, class: 'Grade 10', section: 'A', start: '01:55', end: '02:40', subject: 'Pakistan Studies', teacher: 'Mr. Tariq Mehmood', room: 'Room 201' },

    { day: 'Tuesday', period: 1, class: 'Grade 10', section: 'A', start: '08:30', end: '09:15', subject: 'Chemistry', teacher: 'Dr. Arthur Pendelton', room: 'Chemistry Lab' },
    { day: 'Tuesday', period: 2, class: 'Grade 10', section: 'A', start: '09:20', end: '10:05', subject: 'Mathematics', teacher: 'Dr. Arthur Pendelton', room: 'Room 201' },
    { day: 'Tuesday', period: 3, class: 'Grade 10', section: 'A', start: '10:10', end: '10:55', subject: 'Biology', teacher: 'Prof. Marcus Vance', room: 'Bio Lab' },
    { day: 'Tuesday', period: 4, class: 'Grade 10', section: 'A', start: '11:00', end: '11:45', subject: 'English Language & Literature', teacher: 'Mrs. Eleanor Hayes', room: 'Room 201' },
    { day: 'Tuesday', period: 5, class: 'Grade 10', section: 'A', start: '12:15', end: '01:00', subject: 'Pakistan Studies', teacher: 'Mr. Tariq Mehmood', room: 'Room 201' },
    { day: 'Tuesday', period: 6, class: 'Grade 10', section: 'A', start: '01:05', end: '01:50', subject: 'Holy Quran (Nazra)', teacher: 'Qari Abdul Rahman', room: 'Room 201' },
    { day: 'Tuesday', period: 7, class: 'Grade 10', section: 'A', start: '01:55', end: '02:40', subject: 'Physical Education / Sports', teacher: 'Coach Bilal', room: 'Ground' },

    { day: 'Wednesday', period: 1, class: 'Grade 10', section: 'A', start: '08:30', end: '09:15', subject: 'Physics', teacher: 'Prof. Marcus Vance', room: 'Physics Lab' },
    { day: 'Wednesday', period: 2, class: 'Grade 10', section: 'A', start: '09:20', end: '10:05', subject: 'Mathematics', teacher: 'Dr. Arthur Pendelton', room: 'Room 201' },
    { day: 'Wednesday', period: 3, class: 'Grade 10', section: 'A', start: '10:10', end: '10:55', subject: 'Computer Science', teacher: 'Ms. Clara Oswald', room: 'Computer Lab' },
    { day: 'Wednesday', period: 4, class: 'Grade 10', section: 'A', start: '11:00', end: '11:45', subject: 'Urdu Literature', teacher: 'Mr. Tariq Mehmood', room: 'Room 201' },
    { day: 'Wednesday', period: 5, class: 'Grade 10', section: 'A', start: '12:15', end: '01:00', subject: 'Chemistry', teacher: 'Dr. Arthur Pendelton', room: 'Chemistry Lab' },
    { day: 'Wednesday', period: 6, class: 'Grade 10', section: 'A', start: '01:05', end: '01:50', subject: 'English Language & Literature', teacher: 'Mrs. Eleanor Hayes', room: 'Room 201' },
    { day: 'Wednesday', period: 7, class: 'Grade 10', section: 'A', start: '01:55', end: '02:40', subject: 'Islamiat / Ethics', teacher: 'Qari Abdul Rahman', room: 'Room 201' },

    { day: 'Thursday', period: 1, class: 'Grade 10', section: 'A', start: '08:30', end: '09:15', subject: 'Mathematics', teacher: 'Dr. Arthur Pendelton', room: 'Room 201' },
    { day: 'Thursday', period: 2, class: 'Grade 10', section: 'A', start: '09:20', end: '10:05', subject: 'English Language & Literature', teacher: 'Mrs. Eleanor Hayes', room: 'Room 201' },
    { day: 'Thursday', period: 3, class: 'Grade 10', section: 'A', start: '10:10', end: '10:55', subject: 'Biology', teacher: 'Prof. Marcus Vance', room: 'Bio Lab' },
    { day: 'Thursday', period: 4, class: 'Grade 10', section: 'A', start: '11:00', end: '11:45', subject: 'Pakistan Studies', teacher: 'Mr. Tariq Mehmood', room: 'Room 201' },
    { day: 'Thursday', period: 5, class: 'Grade 10', section: 'A', start: '12:15', end: '01:00', subject: 'Computer Science', teacher: 'Ms. Clara Oswald', room: 'Computer Lab' },
    { day: 'Thursday', period: 6, class: 'Grade 10', section: 'A', start: '01:05', end: '01:50', subject: 'Urdu Literature', teacher: 'Mr. Tariq Mehmood', room: 'Room 201' },
    { day: 'Thursday', period: 7, class: 'Grade 10', section: 'A', start: '01:55', end: '02:40', subject: 'General Science', teacher: 'Prof. Marcus Vance', room: 'Room 201' },

    { day: 'Friday', period: 1, class: 'Grade 10', section: 'A', start: '08:30', end: '09:15', subject: 'Holy Quran & Translation', teacher: 'Qari Abdul Rahman', room: 'Room 201' },
    { day: 'Friday', period: 2, class: 'Grade 10', section: 'A', start: '09:20', end: '10:05', subject: 'Mathematics', teacher: 'Dr. Arthur Pendelton', room: 'Room 201' },
    { day: 'Friday', period: 3, class: 'Grade 10', section: 'A', start: '10:10', end: '10:55', subject: 'Physics', teacher: 'Prof. Marcus Vance', room: 'Physics Lab' },
    { day: 'Friday', period: 4, class: 'Grade 10', section: 'A', start: '11:00', end: '11:45', subject: 'English Language & Literature', teacher: 'Mrs. Eleanor Hayes', room: 'Room 201' },
    { day: 'Friday', period: 5, class: 'Grade 10', section: 'A', start: '11:50', end: '12:30', subject: 'Jummah Prayer & Moral Assembly', teacher: 'Qari Abdul Rahman', room: 'Mosque / Hall' },
  ];

  const stmt = db.prepare(`
    INSERT INTO timetable_slots (
      id, day, period, class_name, section_name, start_time, end_time, subject, teacher_name, room_number, is_break, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `);

  const tx = db.transaction(() => {
    scheduleData.forEach((s, idx) => {
      stmt.run(
        `tt-seed-${idx + 1}`,
        s.day,
        s.period,
        s.class,
        s.section,
        s.start,
        s.end,
        s.subject,
        s.teacher,
        s.room,
        now,
        now
      );
    });
  });

  tx();
}

// ==========================================
// HOMEWORK & ASSIGNMENTS SQLITE OPERATIONS
// ==========================================

export function getAllHomeworkFromDb(filters?: { className?: string; subject?: string; status?: string }): any[] {
  let sql = 'SELECT * FROM homework WHERE 1=1';
  const params: any[] = [];

  if (filters?.className && filters.className !== 'All') {
    sql += ' AND class_name = ?';
    params.push(filters.className);
  }
  if (filters?.subject && filters.subject !== 'All') {
    sql += ' AND subject = ?';
    params.push(filters.subject);
  }
  if (filters?.status && filters.status !== 'All') {
    sql += ' AND status = ?';
    params.push(filters.status);
  }

  sql += ' ORDER BY due_date ASC, created_at DESC';

  const rows = db.prepare(sql).all(...params) as any[];
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    class: r.class_name,
    section: r.section_name,
    subject: r.subject,
    teacherName: r.teacher_name,
    assignDate: r.assigned_date,
    assignedDate: r.assigned_date,
    dueDate: r.due_date,
    description: r.description,
    maxPoints: Number(r.max_points || 50),
    submissionsCount: Number(r.submissions_count || 0),
    totalStudents: Number(r.total_students || 32),
    status: r.status,
    attachments: r.attachments ? JSON.parse(r.attachments) : [],
  }));
}

export function upsertHomeworkTx(hw: any): any {
  const now = new Date().toISOString();
  const id = hw.id || `hw-${Date.now()}`;

  const stmt = db.prepare(`
    INSERT INTO homework (
      id, title, class_name, section_name, subject, teacher_name, assigned_date, due_date, description, max_points, submissions_count, total_students, status, attachments, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      class_name = excluded.class_name,
      section_name = excluded.section_name,
      subject = excluded.subject,
      teacher_name = excluded.teacher_name,
      assigned_date = excluded.assigned_date,
      due_date = excluded.due_date,
      description = excluded.description,
      max_points = excluded.max_points,
      total_students = excluded.total_students,
      status = excluded.status,
      attachments = excluded.attachments,
      updated_at = excluded.updated_at
  `);

  stmt.run(
    id,
    hw.title,
    hw.class || hw.className || 'Grade 10',
    hw.section || hw.sectionName || 'A',
    hw.subject || 'Mathematics',
    hw.teacherName || 'Faculty Member',
    hw.assignedDate || hw.assignDate || now.split('T')[0],
    hw.dueDate || now.split('T')[0],
    hw.description || '',
    Number(hw.maxPoints || 50),
    Number(hw.submissionsCount || 0),
    Number(hw.totalStudents || 32),
    hw.status || 'Active',
    JSON.stringify(hw.attachments || []),
    now,
    now
  );

  return {
    id,
    title: hw.title,
    class: hw.class || hw.className || 'Grade 10',
    section: hw.section || hw.sectionName || 'A',
    subject: hw.subject || 'Mathematics',
    teacherName: hw.teacherName || 'Faculty Member',
    assignDate: hw.assignedDate || hw.assignDate || now.split('T')[0],
    assignedDate: hw.assignedDate || hw.assignDate || now.split('T')[0],
    dueDate: hw.dueDate,
    description: hw.description,
    maxPoints: Number(hw.maxPoints || 50),
    submissionsCount: Number(hw.submissionsCount || 0),
    totalStudents: Number(hw.totalStudents || 32),
    status: hw.status || 'Active',
    attachments: hw.attachments || [],
  };
}

export function deleteHomeworkTx(id: string): boolean {
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM homework_submissions WHERE homework_id = ?').run(id);
    db.prepare('DELETE FROM homework WHERE id = ?').run(id);
  });
  tx();
  return true;
}

export function getHomeworkSubmissionsFromDb(homeworkId: string): any[] {
  const rows = db.prepare('SELECT * FROM homework_submissions WHERE homework_id = ? ORDER BY submitted_at DESC').all(homeworkId) as any[];
  return rows.map((r) => ({
    id: r.id,
    homeworkId: r.homework_id,
    studentId: r.student_id,
    studentName: r.student_name,
    rollNumber: r.roll_number,
    submittedAt: r.submitted_at,
    fileAttachment: r.file_attachment,
    status: r.status,
    obtainedMarks: r.obtained_marks !== null && r.obtained_marks !== undefined ? Number(r.obtained_marks) : undefined,
    maxMarks: Number(r.max_marks || 50),
    teacherFeedback: r.teacher_feedback || '',
  }));
}

export function submitHomeworkTx(submission: any): any {
  const now = new Date().toISOString();
  const id = submission.id || `sub-${Date.now()}`;

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO homework_submissions (
        id, homework_id, student_id, student_name, roll_number, submitted_at, file_attachment, status, obtained_marks, max_marks, teacher_feedback, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(homework_id, student_id) DO UPDATE SET
        submitted_at = excluded.submitted_at,
        file_attachment = excluded.file_attachment,
        status = excluded.status,
        updated_at = excluded.updated_at
    `).run(
      id,
      submission.homeworkId,
      submission.studentId,
      submission.studentName,
      submission.rollNumber || '',
      now,
      submission.fileAttachment || 'completed_assignment.pdf',
      submission.status || 'Submitted',
      submission.obtainedMarks !== undefined && submission.obtainedMarks !== null ? Number(submission.obtainedMarks) : null,
      Number(submission.maxMarks || 50),
      submission.teacherFeedback || '',
      now,
      now
    );

    // Update homework count
    const countRow = db.prepare('SELECT COUNT(*) as count FROM homework_submissions WHERE homework_id = ?').get(submission.homeworkId) as { count: number };
    db.prepare('UPDATE homework SET submissions_count = ?, updated_at = ? WHERE id = ?').run(countRow.count, now, submission.homeworkId);
  });

  tx();

  return {
    id,
    homeworkId: submission.homeworkId,
    studentId: submission.studentId,
    studentName: submission.studentName,
    rollNumber: submission.rollNumber,
    submittedAt: now,
    fileAttachment: submission.fileAttachment || 'completed_assignment.pdf',
    status: submission.status || 'Submitted',
    maxMarks: Number(submission.maxMarks || 50),
  };
}

export function gradeHomeworkSubmissionTx(submissionId: string, obtainedMarks: number, teacherFeedback?: string): any {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE homework_submissions
    SET obtained_marks = ?, teacher_feedback = ?, status = 'Evaluated', updated_at = ?
    WHERE id = ?
  `).run(Number(obtainedMarks), teacherFeedback || '', now, submissionId);

  const row = db.prepare('SELECT * FROM homework_submissions WHERE id = ?').get(submissionId) as any;
  if (!row) return null;

  return {
    id: row.id,
    homeworkId: row.homework_id,
    studentId: row.student_id,
    studentName: row.student_name,
    rollNumber: row.roll_number,
    submittedAt: row.submitted_at,
    fileAttachment: row.file_attachment,
    status: row.status,
    obtainedMarks: Number(row.obtained_marks),
    maxMarks: Number(row.max_marks),
    teacherFeedback: row.teacher_feedback,
  };
}

export function seedDefaultHomeworkIfEmpty() {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM homework').get() as { count: number };
  if (countRow.count > 0) return;

  const now = new Date().toISOString();
  const defaultHws = [
    {
      id: 'hw-1',
      title: 'Chapter 4: Quadratic Equations & Roots Exercises',
      class_name: 'Grade 10',
      section_name: 'A',
      subject: 'Mathematics',
      teacher_name: 'Dr. Arthur Pendelton',
      assigned_date: '2026-03-01',
      due_date: '2026-03-15',
      description: 'Solve textbook Exercise 4.2 questions 1 to 15. Show complete discriminant derivations and factorization steps.',
      max_points: 50,
      submissions_count: 2,
      total_students: 32,
      status: 'Active',
      attachments: JSON.stringify(['Math_Ex_4.2_Guidance.pdf']),
    },
    {
      id: 'hw-2',
      title: 'Newtonian Dynamics & Momentum Lab Report',
      class_name: 'Grade 10',
      section_name: 'A',
      subject: 'Physics',
      teacher_name: 'Prof. Marcus Vance',
      assigned_date: '2026-03-05',
      due_date: '2026-03-18',
      description: 'Submit formal practical write-up for the cart collision experiment with error margin calculations and velocity graphs.',
      max_points: 50,
      submissions_count: 1,
      total_students: 32,
      status: 'Active',
      attachments: JSON.stringify(['Physics_Lab_Format.pdf']),
    },
    {
      id: 'hw-3',
      title: 'Julius Caesar: Character Analysis of Brutus',
      class_name: 'Grade 10',
      section_name: 'A',
      subject: 'English Literature',
      teacher_name: 'Mrs. Eleanor Hayes',
      assigned_date: '2026-03-06',
      due_date: '2026-03-20',
      description: 'Write a 600-word critical essay examining Brutus internal conflict between patriotism and friendship in Act III.',
      max_points: 50,
      submissions_count: 1,
      total_students: 32,
      status: 'Active',
      attachments: JSON.stringify(['Essay_Rubric.pdf']),
    },
  ];

  const stmt = db.prepare(`
    INSERT INTO homework (
      id, title, class_name, section_name, subject, teacher_name, assigned_date, due_date, description, max_points, submissions_count, total_students, status, attachments, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const h of defaultHws) {
    stmt.run(
      h.id,
      h.title,
      h.class_name,
      h.section_name,
      h.subject,
      h.teacher_name,
      h.assigned_date,
      h.due_date,
      h.description,
      h.max_points,
      h.submissions_count,
      h.total_students,
      h.status,
      h.attachments,
      now,
      now
    );
  }

  // Seed sample submissions for hw-1
  const subStmt = db.prepare(`
    INSERT INTO homework_submissions (
      id, homework_id, student_id, student_name, roll_number, submitted_at, file_attachment, status, obtained_marks, max_marks, teacher_feedback, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  subStmt.run(
    'sub-seed-1',
    'hw-1',
    'std-1',
    'Muhammad Ali',
    '101',
    '2026-03-08T10:30:00.000Z',
    'Muhammad_Ali_Math_Ex4.2.pdf',
    'Evaluated',
    48,
    50,
    'Excellent algebraic rigor and neatly presented solutions.',
    now,
    now
  );

  subStmt.run(
    'sub-seed-2',
    'hw-1',
    'std-2',
    'Fatima Zahra',
    '102',
    '2026-03-09T14:15:00.000Z',
    'Fatima_Zahra_Math_HW.pdf',
    'Evaluated',
    46,
    50,
    'Great working; re-check question 12 sign convention.',
    now,
    now
  );
}



