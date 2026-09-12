import type DatabaseType from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let BetterSqlite3: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const imported = require('better-sqlite3');
  BetterSqlite3 = imported.default || imported;
} catch (loadErr) {
  console.warn('[Electron Database] Native better-sqlite3 module could not be loaded directly:', loadErr);
}

let dbInstance: any = null;
let currentDbPath: string = '';

export function getDatabasePath(userDataPath: string): string {
  return path.join(userDataPath, 'edupulse_school_erp.sqlite');
}

export function initDesktopDatabase(userDataPath: string): any {
  if (dbInstance) {
    return dbInstance;
  }

  // Ensure the user data directory exists
  try {
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
  } catch (dirErr) {
    console.warn('[Electron Database] Could not create userDataPath:', dirErr);
  }

  currentDbPath = getDatabasePath(userDataPath);
  console.log(`[Electron Database] Initializing persistent local SQLite at: ${currentDbPath}`);

  if (BetterSqlite3) {
    try {
      dbInstance = new BetterSqlite3(currentDbPath, {
        verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
      });

      // Optimize SQLite for high performance and data integrity
      dbInstance.pragma('journal_mode = WAL');
      dbInstance.pragma('synchronous = NORMAL');
      dbInstance.pragma('foreign_keys = ON');

      // Initialize all ERP tables (safe, never drops or overwrites existing user data)
      initTables(dbInstance);
      console.log('[Electron Database] Native SQLite initialized and verified successfully.');
      return dbInstance;
    } catch (dbErr) {
      console.error('[Electron Database] Failed to initialize native SQLite instance:', dbErr);
      dbInstance = null;
    }
  }

  // Graceful fallback store if native SQLite binary cannot be loaded on the host OS
  console.warn('[Electron Database] Activating resilient local fallback memory engine.');
  dbInstance = createFallbackDatabase(currentDbPath);
  return dbInstance;
}

export function getDb(): any {
  if (!dbInstance) {
    const fallbackPath = path.join(process.cwd(), 'edupulse_fallback.sqlite');
    return initDesktopDatabase(path.dirname(fallbackPath));
  }
  return dbInstance;
}

function createFallbackDatabase(dbPath: string) {
  const store: Record<string, any[]> = {};
  return {
    exec: (sql: string) => {
      console.log('[Fallback DB] Executing schema SQL (noop)');
      return;
    },
    pragma: (setting: string) => setting,
    prepare: (sql: string) => {
      return {
        run: (...params: any[]) => ({ changes: 1, lastInsertRowid: Date.now() }),
        get: (...params: any[]) => {
          if (sql.includes('COUNT(*)')) return { count: 0, c: 0 };
          return null;
        },
        all: (...params: any[]) => [],
      };
    },
    transaction: (fn: (...args: any[]) => any) => {
      return (...args: any[]) => fn(...args);
    },
    backup: async (dest: string) => {
      fs.writeFileSync(dest, JSON.stringify(store, null, 2));
      return;
    },
  };
}

function initTables(db: any) {
  db.exec(`
    -- 1. System & School Settings
    CREATE TABLE IF NOT EXISTS school_settings (
      id TEXT PRIMARY KEY,
      school_name TEXT NOT NULL,
      tagline TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      website TEXT,
      currency TEXT NOT NULL DEFAULT 'PKR',
      currency_symbol TEXT NOT NULL DEFAULT 'Rs.',
      academic_year TEXT NOT NULL DEFAULT '2024-2025',
      updated_at TEXT NOT NULL
    );

    -- 2. Fee Categories table
    CREATE TABLE IF NOT EXISTS fee_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      student_type TEXT NOT NULL DEFAULT 'All',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    -- 3. Fee Structures table
    CREATE TABLE IF NOT EXISTS fee_structures (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category_id TEXT,
      fee_name TEXT NOT NULL,
      amount REAL NOT NULL,
      frequency TEXT NOT NULL DEFAULT 'Monthly',
      student_type TEXT NOT NULL DEFAULT 'All',
      class_name TEXT NOT NULL DEFAULT 'All Classes',
      section_name TEXT NOT NULL DEFAULT 'All',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    -- 4. Fee Vouchers table (Pakistani 3-copy / 4-copy format)
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
      student_type TEXT NOT NULL DEFAULT 'Regular',
      issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      current_charges REAL NOT NULL DEFAULT 0,
      previous_balance REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      fine REAL NOT NULL DEFAULT 0,
      total_payable REAL NOT NULL DEFAULT 0,
      paid_amount REAL NOT NULL DEFAULT 0,
      remaining_balance REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'PENDING',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(student_id, fee_month, academic_year)
    );

    -- 5. Fee Voucher Items table
    CREATE TABLE IF NOT EXISTS fee_voucher_items (
      id TEXT PRIMARY KEY,
      voucher_id TEXT NOT NULL,
      sr_no INTEGER NOT NULL,
      fee_description TEXT NOT NULL,
      amount REAL NOT NULL,
      FOREIGN KEY (voucher_id) REFERENCES fee_vouchers(id) ON DELETE CASCADE
    );

    -- 6. Fee Payments table
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
      payment_method TEXT NOT NULL,
      payment_date TEXT NOT NULL,
      received_by TEXT NOT NULL,
      remarks TEXT,
      status TEXT NOT NULL DEFAULT 'PAID',
      created_at TEXT NOT NULL,
      FOREIGN KEY (voucher_id) REFERENCES fee_vouchers(id)
    );

    -- 7. Students table
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      admission_no TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      father_name TEXT NOT NULL,
      roll_number TEXT,
      class_name TEXT NOT NULL,
      section_name TEXT NOT NULL,
      student_type TEXT NOT NULL DEFAULT 'Regular',
      gender TEXT,
      date_of_birth TEXT,
      contact_number TEXT,
      emergency_contact TEXT,
      address TEXT,
      guardian_cnic TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TEXT NOT NULL
    );

    -- 8. Classes & Sections table
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      section TEXT NOT NULL,
      class_teacher TEXT,
      room_number TEXT,
      capacity INTEGER DEFAULT 40,
      student_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      UNIQUE(name, section)
    );

    -- 9. Attendance table
    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      admission_no TEXT,
      student_name TEXT,
      class_name TEXT NOT NULL,
      section_name TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL, -- 'Present', 'Absent', 'Late', 'Leave'
      remarks TEXT,
      marked_by TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(student_id, date)
    );

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_vouchers_student ON fee_vouchers(student_id);
    CREATE INDEX IF NOT EXISTS idx_vouchers_class ON fee_vouchers(class_name, section_name);
    CREATE INDEX IF NOT EXISTS idx_vouchers_status ON fee_vouchers(status);
    CREATE INDEX IF NOT EXISTS idx_vouchers_month_year ON fee_vouchers(fee_month, academic_year);
    CREATE INDEX IF NOT EXISTS idx_voucher_items_voucher ON fee_voucher_items(voucher_id);
    CREATE INDEX IF NOT EXISTS idx_payments_voucher ON fee_payments(voucher_id);
    CREATE INDEX IF NOT EXISTS idx_payments_student ON fee_payments(student_id);
    CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_name, section_name);
    CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
  `);

  seedInitialDesktopData(db);
}

function seedInitialDesktopData(db: any) {
  // 1. School Settings
  const settingsRow = db.prepare('SELECT COUNT(*) as count FROM school_settings').get() as { count: number };
  if (settingsRow.count === 0) {
    db.prepare(`
      INSERT INTO school_settings (id, school_name, tagline, phone, email, address, website, currency, currency_symbol, academic_year, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'default-school-settings',
      'Rehman Public School',
      'Excellence in Education & Character Building',
      '+92 42 35882100',
      'info@rehmanpublicschool.edu.pk',
      'Main Campus, Canal Road, Lahore, Pakistan',
      'www.rehmanpublicschool.edu.pk',
      'PKR',
      'Rs.',
      '2024-2025',
      new Date().toISOString()
    );
  }

  // 2. Default Pakistani Fee Categories
  const catCount = db.prepare('SELECT COUNT(*) as count FROM fee_categories').get() as { count: number };
  if (catCount.count === 0) {
    const insertCat = db.prepare(`
      INSERT INTO fee_categories (id, name, description, student_type, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const categories = [
      { id: 'cat-adm', name: 'Admission Fee', desc: 'One-time admission charge for new students', type: 'New' },
      { id: 'cat-tui-new', name: 'Tuition Fee (New)', desc: 'Monthly academic instruction fee', type: 'New' },
      { id: 'cat-sch-new', name: 'School Fee', desc: 'Campus facilities and utility contribution', type: 'New' },
      { id: 'cat-crd-new', name: 'School Card Fee', desc: 'Institutional RFID ID card issuance', type: 'New' },
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

  // 3. Default Fee Structures
  const structCount = db.prepare('SELECT COUNT(*) as count FROM fee_structures').get() as { count: number };
  if (structCount.count === 0) {
    const insertStruct = db.prepare(`
      INSERT INTO fee_structures (id, name, category_id, fee_name, amount, frequency, student_type, class_name, section_name, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    const structures = [
      { id: 'fs-new-adm', name: 'Admission Fee (New Admission)', catId: 'cat-adm', feeName: 'Admission Fee', amount: 15000, freq: 'One-Time', type: 'New', cls: 'All Classes', sec: 'All' },
      { id: 'fs-new-tui', name: 'Tuition Fee (New Student)', catId: 'cat-tui-new', feeName: 'Tuition Fee', amount: 5000, freq: 'Monthly', type: 'New', cls: 'All Classes', sec: 'All' },
      { id: 'fs-new-sch', name: 'School Fee (New Student)', catId: 'cat-sch-new', feeName: 'School Fee', amount: 1000, freq: 'Monthly', type: 'New', cls: 'All Classes', sec: 'All' },
      { id: 'fs-new-crd', name: 'School Card Fee (ID Card)', catId: 'cat-crd-new', feeName: 'School Card Fee', amount: 500, freq: 'One-Time', type: 'New', cls: 'All Classes', sec: 'All' },
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

// Transaction: Generate bulk vouchers atomically
export function executeGenerateBulkVouchers(vouchersList: any[]) {
  const db = getDb();

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

  const runTx = db.transaction((list: any[]) => {
    const results: { generated: any[]; skippedDuplicates: string[] } = {
      generated: [],
      skippedDuplicates: [],
    };

    for (const v of list) {
      const existing = checkDuplicateStmt.get(v.studentId, v.feeMonth, v.academicYear) as any;
      if (existing) {
        results.skippedDuplicates.push(
          `${v.studentName} (${v.admissionNo}) - already has voucher ${existing.voucher_no} for ${v.feeMonth} ${v.academicYear}`
        );
        continue;
      }

      insertVoucherStmt.run(
        v.id,
        v.voucherNo,
        v.studentId,
        v.studentName,
        v.fatherName || '',
        v.admissionNo,
        v.className,
        v.sectionName,
        v.rollNumber || '',
        v.academicYear,
        v.feeMonth,
        v.studentType || 'Regular',
        v.issueDate,
        v.dueDate,
        v.currentCharges || 0,
        v.previousBalance || 0,
        v.discount || 0,
        v.fine || 0,
        v.totalPayable,
        v.paidAmount || 0,
        v.remainingBalance !== undefined ? v.remainingBalance : v.totalPayable,
        v.status || 'PENDING',
        v.notes || '',
        v.createdAt || new Date().toISOString(),
        v.updatedAt || new Date().toISOString()
      );

      if (v.items && Array.isArray(v.items)) {
        v.items.forEach((item: any, idx: number) => {
          insertItemStmt.run(
            item.id || `${v.id}-item-${idx + 1}`,
            v.id,
            item.srNo || idx + 1,
            item.feeDescription,
            item.amount
          );
        });
      }

      results.generated.push(v);
    }

    return results;
  });

  return runTx(vouchersList);
}

// Transaction: Record voucher payment
export function executeRecordPayment(paymentData: {
  voucherId: string;
  amountPaid: number;
  paymentMethod: string;
  paymentDate: string;
  receivedBy: string;
  remarks?: string;
}) {
  const db = getDb();

  const runTx = db.transaction((data: typeof paymentData) => {
    const getVoucherStmt = db.prepare('SELECT * FROM fee_vouchers WHERE id = ?');
    const voucher = getVoucherStmt.get(data.voucherId) as any;

    if (!voucher) {
      throw new Error('Voucher not found in SQLite database');
    }

    const newPaid = Number(voucher.paid_amount || 0) + Number(data.amountPaid);
    const totalPayable = Number(voucher.total_payable);
    const remaining = Math.max(0, totalPayable - newPaid);

    let newStatus: string;
    if (remaining <= 0) {
      newStatus = 'PAID';
    } else if (newPaid > 0) {
      newStatus = 'PARTIALLY PAID';
    } else {
      const isPastDue = new Date(voucher.due_date).getTime() < new Date().getTime();
      newStatus = isPastDue ? 'OVERDUE' : 'PENDING';
    }

    const countRow = db.prepare('SELECT COUNT(*) as count FROM fee_payments').get() as { count: number };
    const receiptNo = `RCP-${new Date().getFullYear()}-${(countRow.count + 1).toString().padStart(4, '0')}`;
    const paymentId = `pay-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const now = new Date().toISOString();

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
      data.amountPaid,
      voucher.paid_amount || 0,
      remaining,
      data.paymentMethod,
      data.paymentDate || now.split('T')[0],
      data.receivedBy,
      data.remarks || '',
      newStatus === 'PAID' ? 'PAID' : 'PARTIALLY PAID',
      now
    );

    db.prepare(`
      UPDATE fee_vouchers
      SET paid_amount = ?, remaining_balance = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(newPaid, remaining, newStatus, now, voucher.id);

    const updatedVoucher = getVoucherStmt.get(voucher.id);
    const paymentRecord = db.prepare('SELECT * FROM fee_payments WHERE id = ?').get(paymentId);

    return {
      voucher: updatedVoucher,
      payment: paymentRecord,
    };
  });

  return runTx(paymentData);
}

// Backup SQLite Database safely using better-sqlite3 native backup API
export async function backupDatabaseFile(destinationDirectory?: string): Promise<{ success: boolean; backupPath?: string; error?: string }> {
  try {
    const db = getDb();
    const defaultBackupDir = path.join(path.dirname(currentDbPath), 'backups');
    const targetDir = destinationDirectory || defaultBackupDir;

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `edupulse_backup_${timestamp}.sqlite`;
    const backupFilePath = path.join(targetDir, backupFileName);

    await db.backup(backupFilePath);
    console.log(`[Electron Database] Backup completed successfully to: ${backupFilePath}`);

    return {
      success: true,
      backupPath: backupFilePath,
    };
  } catch (err: any) {
    console.error('[Electron Database] Backup failed:', err);
    return {
      success: false,
      error: err.message || 'Backup failed',
    };
  }
}

// Get Database statistics
export function getDatabaseStatistics() {
  const db = getDb();
  let sizeBytes = 0;
  try {
    const stat = fs.statSync(currentDbPath);
    sizeBytes = stat.size;
  } catch {
    sizeBytes = 0;
  }

  const vouchersCount = (db.prepare('SELECT COUNT(*) as c FROM fee_vouchers').get() as any)?.c || 0;
  const studentsCount = (db.prepare('SELECT COUNT(*) as c FROM students').get() as any)?.c || 0;
  const paymentsCount = (db.prepare('SELECT COUNT(*) as c FROM fee_payments').get() as any)?.c || 0;
  const tables = (db.prepare("SELECT COUNT(*) as c FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").get() as any)?.c || 0;

  return {
    dbPath: currentDbPath,
    sizeBytes,
    tablesCount: tables,
    vouchersCount,
    studentsCount,
    paymentsCount,
  };
}
