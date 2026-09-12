import express, { Response } from 'express';
import { serverStore } from '../store.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import {
  db,
  generateVouchersTx,
  recordPaymentTx,
  deleteFeeVoucherTx,
  getSavedSchoolConfig,
  saveSchoolConfig,
  saveAttendanceTx,
  getAttendanceRecordsFromDb,
  getAttendanceSummaryFromDb,
  getStudentAttendanceHistoryFromDb,
  getAllClassesFromDb,
  getAllStaffFromDb,
  upsertStaffTx,
  deleteStaffTx,
  getAllPayrollFromDb,
  getPayrollStatsFromDb,
  generateMonthlyPayrollTx,
  updatePayrollStatusTx,
  disburseBulkPayrollTx,
  getAllExamsFromDb,
  upsertExamTx,
  deleteExamTx,
  getAllExamSchedulesFromDb,
  addExamScheduleTx,
  deleteExamScheduleTx,
  getAllExamResultsFromDb,
  upsertExamResultsTx,
  getAllTimetableSlotsFromDb,
  upsertTimetableSlotTx,
  deleteTimetableSlotTx,
  getAllHomeworkFromDb,
  upsertHomeworkTx,
  deleteHomeworkTx,
  getHomeworkSubmissionsFromDb,
  submitHomeworkTx,
  gradeHomeworkSubmissionTx,
} from '../db.js';

const router = express.Router();

// GET /settings - Allow institutional profile and logo retrieval across views & auth screens
router.get('/settings', (req, res): void => {
  const saved = getSavedSchoolConfig();
  if (saved) {
    serverStore.schoolSettings = {
      ...serverStore.schoolSettings,
      ...saved,
    };
  }
  res.json({ settings: serverStore.schoolSettings });
});

router.use(authenticateToken);

// ==========================================
// 1. TEACHERS & STAFF
// ==========================================
router.get('/teachers', (req: AuthenticatedRequest, res: Response): void => {
  res.json({ teachers: serverStore.teachers });
});

router.post('/teachers', requireRole('Super Admin', 'School Admin', 'Principal'), (req: AuthenticatedRequest, res: Response): void => {
  const newTeacher = {
    ...req.body,
    id: `tch-${Date.now()}`,
    employeeId: req.body.employeeId || `EMP-${Math.floor(100 + Math.random() * 900)}`,
  };
  serverStore.teachers.unshift(newTeacher);

  serverStore.recordAuditLog({
    userId: req.user?.id || 'admin',
    userName: req.user?.name || 'Administrator',
    userRole: req.user?.role || 'Admin',
    action: 'TEACHER_ADDED',
    module: 'Teachers',
    status: 'Success',
    ipAddress: req.ip || '127.0.0.1',
    details: `Added faculty member '${newTeacher.name}' (${newTeacher.department})`,
  });

  res.status(201).json({ success: true, teacher: newTeacher });
});

router.get('/staff', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const staff = getAllStaffFromDb();
    res.json({ staff });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve staff', details: err.message });
  }
});

router.post('/staff', requireRole('Super Admin', 'School Admin', 'Principal'), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const staffMember = upsertStaffTx(req.body);
    serverStore.recordAuditLog({
      userId: req.user?.id || 'admin',
      userName: req.user?.name || 'Administrator',
      userRole: req.user?.role || 'Admin',
      action: 'STAFF_SAVED',
      module: 'HR & Staff',
      status: 'Success',
      ipAddress: req.ip || '127.0.0.1',
      details: `Saved staff/faculty record for '${staffMember?.name}'`,
    });
    res.status(201).json({ success: true, staff: staffMember });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save staff record', details: err.message });
  }
});

router.delete('/staff/:id', requireRole('Super Admin', 'School Admin'), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const deleted = deleteStaffTx(req.params.id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete staff member', details: err.message });
  }
});

// ==========================================
// 2. CLASSES & SECTIONS
// ==========================================
router.get('/classes', (req: AuthenticatedRequest, res: Response): void => {
  const classes = getAllClassesFromDb();
  res.json({ classes: classes.length > 0 ? classes : serverStore.classes });
});

// ==========================================
// 3. ATTENDANCE (SQLite BACKED WITH REAL AGGREGATES & DUPLICATE PREVENTION)
// ==========================================
router.get('/attendance', (req: AuthenticatedRequest, res: Response): void => {
  const role = req.user?.role;
  const { date, class: className, section: sectionName, studentId, search, startDate, endDate } = req.query;

  let filterStudentId = studentId as string | undefined;
  if (role === 'Student' && req.user?.studentId) {
    filterStudentId = req.user.studentId;
  } else if (role === 'Parent' && req.user?.parentChildIds) {
    // If parent requested a specific studentId, ensure it's in their children
    if (filterStudentId && !req.user.parentChildIds.includes(filterStudentId)) {
      res.status(403).json({ error: 'Access denied to non-child student record' });
      return;
    }
  }

  const records = getAttendanceRecordsFromDb({
    date: date ? String(date) : undefined,
    className: className ? String(className) : undefined,
    sectionName: sectionName ? String(sectionName) : undefined,
    studentId: filterStudentId,
    search: search ? String(search) : undefined,
    startDate: startDate ? String(startDate) : undefined,
    endDate: endDate ? String(endDate) : undefined,
  });

  const summary = getAttendanceSummaryFromDb({
    date: date ? String(date) : undefined,
    className: className ? String(className) : undefined,
    sectionName: sectionName ? String(sectionName) : undefined,
  });

  res.json({
    success: true,
    attendance: records,
    summary,
  });
});

router.post('/attendance', requireRole('Super Admin', 'School Admin', 'Principal', 'Teacher'), (req: AuthenticatedRequest, res: Response): void => {
  const body = req.body;
  const recordsToSave = Array.isArray(body)
    ? body
    : Array.isArray(body.records)
    ? body.records
    : body.record
    ? [body.record]
    : [body];

  if (!recordsToSave || recordsToSave.length === 0) {
    res.status(400).json({ error: 'No attendance records provided to save.' });
    return;
  }

  try {
    const result = saveAttendanceTx(recordsToSave);

    // Sync in-memory store
    serverStore.attendanceRecords = getAttendanceRecordsFromDb();

    // Audit log
    const sample = recordsToSave[0];
    serverStore.recordAuditLog({
      userId: req.user?.id || 'admin',
      userName: req.user?.name || 'Staff',
      userRole: req.user?.role || 'Staff',
      action: 'ATTENDANCE_RECORDED',
      module: 'Attendance',
      status: 'Success',
      ipAddress: req.ip || '127.0.0.1',
      details: `Saved attendance for ${sample.class || sample.className} ${sample.section || sample.sectionName || ''} on ${sample.date} (${result.savedCount} records).`,
    });

    res.status(201).json({
      success: true,
      savedCount: result.savedCount,
      records: recordsToSave,
    });
  } catch (err: any) {
    console.error('Error saving attendance:', err);
    res.status(500).json({ error: 'Failed to save attendance to SQLite database: ' + err.message });
  }
});

router.get('/attendance/summary', (req: AuthenticatedRequest, res: Response): void => {
  const { date, class: className, section: sectionName } = req.query;
  const summary = getAttendanceSummaryFromDb({
    date: date ? String(date) : undefined,
    className: className ? String(className) : undefined,
    sectionName: sectionName ? String(sectionName) : undefined,
  });
  res.json({ success: true, summary });
});

router.get('/attendance/student/:studentId', (req: AuthenticatedRequest, res: Response): void => {
  const { studentId } = req.params;
  const role = req.user?.role;
  if (role === 'Student' && req.user?.studentId !== studentId) {
    res.status(403).json({ error: 'Access denied: You can only view your own attendance history.' });
    return;
  }

  const data = getStudentAttendanceHistoryFromDb(studentId);
  res.json({ success: true, data });
});

// ==========================================
// 4. EXAMS & RESULTS (SQLite Engine + Audit Logging)
// ==========================================
router.get('/exams', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const exams = getAllExamsFromDb();
    const schedules = getAllExamSchedulesFromDb();
    res.json({ exams, schedules });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch exams', details: err.message });
  }
});

router.post('/exams', requireRole('Super Admin', 'School Admin', 'Principal', 'Teacher'), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const saved = upsertExamTx(req.body);
    serverStore.recordAuditLog({
      userId: req.user?.id || 'admin',
      userName: req.user?.name || 'Staff',
      userRole: req.user?.role || 'Teacher',
      action: 'EXAM_SCHEDULED',
      module: 'Examinations',
      status: 'Success',
      ipAddress: req.ip || '127.0.0.1',
      details: `Scheduled examination '${saved.name}' (${saved.term || 'Mid Term'})`,
    });
    res.status(201).json({ success: true, exam: saved });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to schedule exam', details: err.message });
  }
});

router.delete('/exams/:id', requireRole('Super Admin', 'School Admin', 'Principal'), (req: AuthenticatedRequest, res: Response): void => {
  try {
    deleteExamTx(req.params.id);
    serverStore.recordAuditLog({
      userId: req.user?.id || 'admin',
      userName: req.user?.name || 'Admin',
      userRole: req.user?.role || 'Super Admin',
      action: 'EXAM_DELETED',
      module: 'Examinations',
      status: 'Warning',
      ipAddress: req.ip || '127.0.0.1',
      details: `Deleted examination ID '${req.params.id}' and associated date sheets/marks`,
    });
    res.json({ success: true, message: 'Exam deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete exam', details: err.message });
  }
});

router.get('/exam-schedules', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { examId } = req.query;
    const schedules = getAllExamSchedulesFromDb(examId as string | undefined);
    res.json({ schedules });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch exam schedules', details: err.message });
  }
});

router.post('/exam-schedules', requireRole('Super Admin', 'School Admin', 'Principal', 'Teacher'), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const saved = addExamScheduleTx(req.body);
    res.status(201).json({ success: true, schedule: saved });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to add exam schedule item', details: err.message });
  }
});

router.delete('/exam-schedules/:id', requireRole('Super Admin', 'School Admin', 'Principal', 'Teacher'), (req: AuthenticatedRequest, res: Response): void => {
  try {
    deleteExamScheduleTx(req.params.id);
    res.json({ success: true, message: 'Schedule item removed' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete schedule item', details: err.message });
  }
});

router.get('/exam-results', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { examId, studentId, class: className, term } = req.query;
    const role = req.user?.role;

    let targetStudentId = studentId as string | undefined;
    if (role === 'Student' && req.user?.studentId) {
      targetStudentId = req.user.studentId;
    }

    const allResults = getAllExamResultsFromDb({
      examId: examId as string | undefined,
      studentId: targetStudentId,
      class: className as string | undefined,
      term: term as string | undefined,
    });

    if (role === 'Parent' && req.user?.parentChildIds && req.user.parentChildIds.length > 0) {
      const childResults = allResults.filter((r) => req.user?.parentChildIds?.includes(r.studentId));
      res.json({ results: childResults });
      return;
    }

    res.json({ results: allResults });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch exam results', details: err.message });
  }
});

router.post('/exam-results', requireRole('Super Admin', 'School Admin', 'Principal', 'Teacher'), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const results = Array.isArray(req.body.results) ? req.body.results : Array.isArray(req.body) ? req.body : [req.body];
    if (results.length === 0) {
      res.status(400).json({ error: 'No marks results provided' });
      return;
    }

    const outcome = upsertExamResultsTx(results);
    serverStore.recordAuditLog({
      userId: req.user?.id || 'admin',
      userName: req.user?.name || 'Teacher',
      userRole: req.user?.role || 'Teacher',
      action: 'EXAM_MARKS_SUBMITTED',
      module: 'Examinations',
      status: 'Success',
      ipAddress: req.ip || '127.0.0.1',
      details: `Saved examination marks for ${outcome.savedCount} student records across curriculum subjects`,
    });

    res.status(200).json({ success: true, savedCount: outcome.savedCount });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save exam marks', details: err.message });
  }
});

// ==========================================
// 5. TIMETABLE & HOMEWORK (SQLite Persistence + Audit Trails)
// ==========================================
router.get('/timetable', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { class: className, section: sectionName, teacher: teacherName } = req.query;
    const slots = getAllTimetableSlotsFromDb({
      className: className ? String(className) : undefined,
      sectionName: sectionName ? String(sectionName) : undefined,
      teacherName: teacherName ? String(teacherName) : undefined,
    });
    res.json({ timetable: slots });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch timetable', details: err.message });
  }
});

router.post('/timetable', requireRole('Super Admin', 'School Admin', 'Principal', 'Teacher'), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const slot = upsertTimetableSlotTx(req.body);
    serverStore.recordAuditLog({
      userId: req.user?.id || 'admin',
      userName: req.user?.name || 'Staff',
      userRole: req.user?.role || 'Admin',
      action: 'TIMETABLE_SLOT_UPDATED',
      module: 'Timetable',
      status: 'Success',
      ipAddress: req.ip || '127.0.0.1',
      details: `Scheduled ${slot.subject} for ${slot.class}-${slot.section} on ${slot.day} (Period ${slot.period})`,
    });
    res.status(201).json({ success: true, slot });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save timetable slot', details: err.message });
  }
});

router.delete('/timetable/:id', requireRole('Super Admin', 'School Admin', 'Principal', 'Teacher'), (req: AuthenticatedRequest, res: Response): void => {
  try {
    deleteTimetableSlotTx(req.params.id);
    res.json({ success: true, message: 'Timetable slot deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete timetable slot', details: err.message });
  }
});

// Homework & Assignments
router.get('/homework', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { class: className, subject, status } = req.query;
    const homeworks = getAllHomeworkFromDb({
      className: className ? String(className) : undefined,
      subject: subject ? String(subject) : undefined,
      status: status ? String(status) : undefined,
    });
    res.json({ homeworks });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch homework assignments', details: err.message });
  }
});

router.post('/homework', requireRole('Super Admin', 'School Admin', 'Principal', 'Teacher'), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const hw = upsertHomeworkTx(req.body);
    serverStore.recordAuditLog({
      userId: req.user?.id || 'admin',
      userName: req.user?.name || 'Teacher',
      userRole: req.user?.role || 'Teacher',
      action: 'HOMEWORK_ASSIGNED',
      module: 'Homework',
      status: 'Success',
      ipAddress: req.ip || '127.0.0.1',
      details: `Assigned homework '${hw.title}' (${hw.subject}) for ${hw.class}-${hw.section} due ${hw.dueDate}`,
    });
    res.status(201).json({ success: true, homework: hw });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save homework assignment', details: err.message });
  }
});

router.delete('/homework/:id', requireRole('Super Admin', 'School Admin', 'Principal', 'Teacher'), (req: AuthenticatedRequest, res: Response): void => {
  try {
    deleteHomeworkTx(req.params.id);
    serverStore.recordAuditLog({
      userId: req.user?.id || 'admin',
      userName: req.user?.name || 'Teacher',
      userRole: req.user?.role || 'Teacher',
      action: 'HOMEWORK_DELETED',
      module: 'Homework',
      status: 'Warning',
      ipAddress: req.ip || '127.0.0.1',
      details: `Deleted homework assignment ID ${req.params.id}`,
    });
    res.json({ success: true, message: 'Homework assignment deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete homework assignment', details: err.message });
  }
});

// Submissions & Grading
router.get('/homework/:id/submissions', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const submissions = getHomeworkSubmissionsFromDb(req.params.id);
    res.json({ success: true, submissions });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch submissions', details: err.message });
  }
});

router.post('/homework/submissions/grade', requireRole('Super Admin', 'School Admin', 'Principal', 'Teacher'), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { submissionId, obtainedMarks, teacherFeedback } = req.body;
    if (!submissionId || obtainedMarks === undefined) {
      res.status(400).json({ error: 'submissionId and obtainedMarks are required' });
      return;
    }
    const graded = gradeHomeworkSubmissionTx(submissionId, Number(obtainedMarks), teacherFeedback);
    res.json({ success: true, submission: graded });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to grade submission', details: err.message });
  }
});

router.post('/homework/submissions/submit', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const result = submitHomeworkTx(req.body);
    res.status(201).json({ success: true, submission: result });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit homework', details: err.message });
  }
});

// ==========================================
// 6. FEES & PAKISTANI FEE VOUCHER SYSTEM (SQLite + Transactions)
// ==========================================

// 6.1 Get Fee Structures & Categories
router.get('/fee-structures', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const rawCategories = db.prepare('SELECT * FROM fee_categories ORDER BY created_at ASC').all() as any[];
    const categories = rawCategories.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description || '',
      studentType: c.student_type || 'All',
      isActive: Boolean(c.is_active),
      createdAt: c.created_at,
    }));

    const rawStructures = db.prepare('SELECT * FROM fee_structures ORDER BY created_at ASC').all() as any[];
    const structures = rawStructures.map((s) => ({
      id: s.id,
      name: s.name,
      categoryId: s.category_id,
      feeName: s.fee_name,
      amount: Number(s.amount),
      frequency: s.frequency,
      studentType: s.student_type || 'All',
      class: s.class_name,
      className: s.class_name,
      section: s.section_name,
      sectionName: s.section_name,
      isActive: Boolean(s.is_active),
      createdAt: s.created_at,
    }));

    res.json({ success: true, categories, structures });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch fee structures', details: err.message });
  }
});

router.post('/fee-structures', requireRole('Super Admin', 'School Admin', 'Accountant'), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { name, categoryId, feeName, amount, frequency, studentType, className, sectionName, isActive } = req.body;
    const id = `fs-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO fee_structures (id, name, category_id, fee_name, amount, frequency, student_type, class_name, section_name, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, categoryId || null, feeName, Number(amount), frequency || 'Monthly', studentType || 'All', className || 'All Classes', sectionName || 'All', isActive ? 1 : 0, now);

    const created = db.prepare('SELECT * FROM fee_structures WHERE id = ?').get(id);
    res.status(201).json({ success: true, structure: created });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save fee structure', details: err.message });
  }
});

router.put('/fee-structures/:id', requireRole('Super Admin', 'School Admin', 'Accountant'), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const { name, categoryId, feeName, amount, frequency, studentType, className, sectionName, isActive } = req.body;

    db.prepare(`
      UPDATE fee_structures
      SET name = ?, category_id = ?, fee_name = ?, amount = ?, frequency = ?, student_type = ?, class_name = ?, section_name = ?, is_active = ?
      WHERE id = ?
    `).run(name, categoryId || null, feeName, Number(amount), frequency || 'Monthly', studentType || 'All', className || 'All Classes', sectionName || 'All', isActive ? 1 : 0, id);

    const updated = db.prepare('SELECT * FROM fee_structures WHERE id = ?').get(id);
    res.json({ success: true, structure: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update fee structure', details: err.message });
  }
});

router.delete('/fee-structures/:id', requireRole('Super Admin', 'School Admin', 'Accountant'), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM fee_structures WHERE id = ?').run(id);
    res.json({ success: true, message: 'Fee structure removed' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete fee structure', details: err.message });
  }
});

// 6.2 Get Vouchers (with items)
router.get('/fee-vouchers', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { academicYear, feeMonth, className, sectionName, studentType, status, studentId } = req.query;

    let sql = 'SELECT * FROM fee_vouchers WHERE 1=1';
    const params: any[] = [];

    // RBAC scoping
    if (req.user?.role === 'Student' && req.user?.studentId) {
      sql += ' AND student_id = ?';
      params.push(req.user.studentId);
    } else if (req.user?.role === 'Parent' && req.user?.parentChildIds?.length) {
      const placeholders = req.user.parentChildIds.map(() => '?').join(',');
      sql += ` AND student_id IN (${placeholders})`;
      params.push(...req.user.parentChildIds);
    }

    if (academicYear) {
      sql += ' AND academic_year = ?';
      params.push(academicYear);
    }
    if (feeMonth) {
      sql += ' AND fee_month = ?';
      params.push(feeMonth);
    }
    if (className && className !== 'All') {
      sql += ' AND class_name = ?';
      params.push(className);
    }
    if (sectionName && sectionName !== 'All') {
      sql += ' AND section_name = ?';
      params.push(sectionName);
    }
    if (studentType && studentType !== 'All') {
      sql += ' AND student_type = ?';
      params.push(studentType);
    }
    if (status && status !== 'All') {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (studentId) {
      sql += ' AND student_id = ?';
      params.push(studentId);
    }

    sql += ' ORDER BY created_at DESC';

    const vouchers = db.prepare(sql).all(...params) as any[];

    // Fetch items for each voucher
    const getItemsStmt = db.prepare('SELECT * FROM fee_voucher_items WHERE voucher_id = ? ORDER BY sr_no ASC');
    const enriched = vouchers.map((v) => {
      const items = getItemsStmt.all(v.id);
      return {
        id: v.id,
        voucherNo: v.voucher_no,
        studentId: v.student_id,
        studentName: v.student_name,
        fatherName: v.father_name,
        admissionNo: v.admission_no,
        class: v.class_name,
        section: v.section_name,
        rollNumber: v.roll_number,
        academicYear: v.academic_year,
        feeMonth: v.fee_month,
        studentType: v.student_type,
        issueDate: v.issue_date,
        dueDate: v.due_date,
        currentCharges: v.current_charges,
        previousBalance: v.previous_balance,
        discount: v.discount,
        fine: v.fine,
        totalPayable: v.total_payable,
        paidAmount: v.paid_amount,
        remainingBalance: v.remaining_balance,
        status: v.status,
        notes: v.notes,
        createdAt: v.created_at,
        updatedAt: v.updated_at,
        items: items.map((it: any) => ({
          id: it.id,
          srNo: it.sr_no,
          feeDescription: it.fee_description,
          amount: it.amount,
        })),
      };
    });

    res.json({ success: true, vouchers: enriched });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch vouchers', details: err.message });
  }
});

// 6.3 Bulk Generate Vouchers (SQLite Transaction)
router.post('/fee-vouchers/generate', requireRole('Super Admin', 'School Admin', 'Accountant'), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { vouchers } = req.body;
    if (!vouchers || !Array.isArray(vouchers) || vouchers.length === 0) {
      res.status(400).json({ error: 'No voucher data provided for generation' });
      return;
    }

    const result = generateVouchersTx(vouchers);

    serverStore.recordAuditLog({
      userId: req.user?.id || 'admin',
      userName: req.user?.name || 'Administrator',
      userRole: req.user?.role || 'Accountant',
      action: 'BULK_FEE_VOUCHERS_GENERATED',
      module: 'Fee Management',
      status: 'Success',
      ipAddress: req.ip || '127.0.0.1',
      details: `Generated ${result.generated.length} fee vouchers. Skipped ${result.skippedDuplicates.length} duplicates.`,
    });

    res.status(201).json({
      success: true,
      generatedCount: result.generated.length,
      skippedCount: result.skippedDuplicates.length,
      skippedDuplicates: result.skippedDuplicates,
      generated: result.generated,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate vouchers in SQLite transaction', details: err.message });
  }
});

// 6.4 Collect Payment (SQLite Transaction + Receipt)
router.post('/fee-payments', requireRole('Super Admin', 'School Admin', 'Accountant'), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { voucherId, amountPaid, paymentMethod, paymentDate, remarks } = req.body;

    if (!voucherId || !amountPaid || Number(amountPaid) <= 0) {
      res.status(400).json({ error: 'Valid voucher ID and payment amount are required' });
      return;
    }

    const result = recordPaymentTx({
      voucherId,
      amountPaid: Number(amountPaid),
      paymentMethod: paymentMethod || 'Cash',
      paymentDate: paymentDate || new Date().toISOString().split('T')[0],
      receivedBy: req.user?.name || 'Accounts Desk',
      remarks: remarks || '',
    });

    serverStore.recordAuditLog({
      userId: req.user?.id || 'admin',
      userName: req.user?.name || 'Accountant',
      userRole: req.user?.role || 'Accountant',
      action: 'FEE_PAYMENT_COLLECTED',
      module: 'Fee Management',
      status: 'Success',
      ipAddress: req.ip || '127.0.0.1',
      details: `Collected Rs. ${amountPaid} for voucher '${(result.voucher as any).voucher_no}' via ${paymentMethod || 'Cash'}. Receipt: ${(result.payment as any).receipt_no}`,
    });

    const p = result.payment as any;
    const formattedPayment = {
      id: p.id,
      voucherId: p.voucher_id,
      voucherNo: p.voucher_no,
      receiptNo: p.receipt_no,
      studentId: p.student_id,
      studentName: p.student_name,
      fatherName: p.father_name,
      admissionNo: p.admission_no,
      class: p.class_name,
      className: p.class_name,
      section: p.section_name,
      sectionName: p.section_name,
      amountPaid: Number(p.amount_paid),
      previousPaid: Number(p.previous_paid),
      remainingBalance: Number(p.remaining_balance),
      paymentMethod: p.payment_method,
      paymentDate: p.payment_date,
      receivedBy: p.received_by,
      remarks: p.remarks,
      status: p.status,
      createdAt: p.created_at,
    };

    const v = result.voucher as any;
    const items = db.prepare('SELECT * FROM fee_voucher_items WHERE voucher_id = ? ORDER BY sr_no ASC').all(v.id) as any[];
    const formattedVoucher = {
      id: v.id,
      voucherNo: v.voucher_no,
      studentId: v.student_id,
      studentName: v.student_name,
      fatherName: v.father_name,
      admissionNo: v.admission_no,
      class: v.class_name,
      className: v.class_name,
      section: v.section_name,
      sectionName: v.section_name,
      rollNumber: v.roll_number,
      academicYear: v.academic_year,
      feeMonth: v.fee_month,
      studentType: v.student_type,
      issueDate: v.issue_date,
      dueDate: v.due_date,
      currentCharges: Number(v.current_charges),
      previousBalance: Number(v.previous_balance),
      discount: Number(v.discount),
      fine: Number(v.fine),
      totalPayable: Number(v.total_payable),
      paidAmount: Number(v.paid_amount),
      remainingBalance: Number(v.remaining_balance),
      status: v.status,
      notes: v.notes,
      createdAt: v.created_at,
      updatedAt: v.updated_at,
      items: items.map((it) => ({
        id: it.id,
        srNo: it.sr_no,
        feeDescription: it.fee_description,
        amount: Number(it.amount),
      })),
    };

    res.status(201).json({
      success: true,
      voucher: formattedVoucher,
      payment: formattedPayment,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to process fee payment in transaction', details: err.message });
  }
});

// 6.5 Get Payment History / Receipts
router.get('/fee-payments', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { voucherId, studentId } = req.query;
    let sql = 'SELECT * FROM fee_payments WHERE 1=1';
    const params: any[] = [];

    if (voucherId) {
      sql += ' AND voucher_id = ?';
      params.push(voucherId);
    }
    if (studentId) {
      sql += ' AND student_id = ?';
      params.push(studentId);
    }

    sql += ' ORDER BY created_at DESC';
    const rawPayments = db.prepare(sql).all(...params) as any[];
    const payments = rawPayments.map((p) => ({
      id: p.id,
      voucherId: p.voucher_id,
      voucherNo: p.voucher_no,
      receiptNo: p.receipt_no,
      studentId: p.student_id,
      studentName: p.student_name,
      fatherName: p.father_name,
      admissionNo: p.admission_no,
      class: p.class_name,
      className: p.class_name,
      section: p.section_name,
      sectionName: p.section_name,
      amountPaid: Number(p.amount_paid),
      previousPaid: Number(p.previous_paid),
      remainingBalance: Number(p.remaining_balance),
      paymentMethod: p.payment_method,
      paymentDate: p.payment_date,
      receivedBy: p.received_by,
      remarks: p.remarks,
      status: p.status,
      createdAt: p.created_at,
    }));

    res.json({ success: true, payments });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch payments', details: err.message });
  }
});

// 6.5b Delete / Void Voucher
router.delete('/fee-vouchers/:id', requireRole('Super Admin', 'School Admin', 'Accountant'), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { id } = req.params;
    deleteFeeVoucherTx(id);
    res.json({ success: true, message: 'Fee voucher deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete fee voucher', details: err.message });
  }
});

// 6.6 Fee Analytics & Reports (Demanded, Collected, Outstanding, Overdue, Current Month)
router.get('/fee-reports', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const summary = db.prepare(`
      SELECT
        COALESCE(SUM(total_payable), 0) as totalDemanded,
        COALESCE(SUM(paid_amount), 0) as totalCollected,
        COALESCE(SUM(remaining_balance), 0) as outstandingFees,
        COALESCE(SUM(CASE WHEN status = 'OVERDUE' THEN remaining_balance ELSE 0 END), 0) as overdueFees
      FROM fee_vouchers
    `).get() as any;

    const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const currentMonthStats = db.prepare(`
      SELECT
        COALESCE(SUM(total_payable), 0) as demanded,
        COALESCE(SUM(paid_amount), 0) as collected,
        COALESCE(SUM(remaining_balance), 0) as pending
      FROM fee_vouchers
      WHERE fee_month LIKE ?
    `).get(`%${new Date().toLocaleString('en-US', { month: 'long' })}%`) as any;

    // Daily collection for the past 30 days
    const dailyCollection = db.prepare(`
      SELECT payment_date as date, SUM(amount_paid) as total, COUNT(*) as count
      FROM fee_payments
      GROUP BY payment_date
      ORDER BY payment_date DESC
      LIMIT 30
    `).all();

    // Class-wise collection
    const classWise = db.prepare(`
      SELECT
        class_name as class,
        COUNT(*) as voucherCount,
        SUM(total_payable) as demanded,
        SUM(paid_amount) as collected,
        SUM(remaining_balance) as outstanding
      FROM fee_vouchers
      GROUP BY class_name
      ORDER BY class_name ASC
    `).all();

    res.json({
      success: true,
      stats: {
        totalDemanded: summary.totalDemanded,
        totalCollected: summary.totalCollected,
        outstandingFees: summary.outstandingFees,
        overdueFees: summary.overdueFees,
        currentMonthCollection: currentMonthStats.collected || 0,
      },
      dailyCollection,
      classWise,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to compute fee reports', details: err.message });
  }
});

// Legacy backward-compatibility routes
router.get('/fees', (req: AuthenticatedRequest, res: Response): void => {
  res.json({ invoices: serverStore.feeInvoices, structures: serverStore.feeStructures });
});

router.post('/fees/pay', requireRole('Super Admin', 'School Admin', 'Accountant', 'Student', 'Parent'), (req: AuthenticatedRequest, res: Response): void => {
  const { invoiceId, amountPaid, paymentMethod } = req.body;
  const invoice = serverStore.feeInvoices.find((i) => i.id === invoiceId);
  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }
  invoice.paidAmount = (invoice.paidAmount || 0) + Number(amountPaid);
  invoice.status = invoice.paidAmount >= invoice.totalAmount ? 'Paid' : 'Partial';
  res.json({ success: true, invoice });
});


// ==========================================
// 7. PAYROLL (STRICT RBAC: Super Admin, School Admin, Principal, Accountant ONLY)
// Teachers, Students, Parents, Librarians, Transport receive 403 Forbidden!
// ==========================================
router.get('/payroll', requireRole('Super Admin', 'School Admin', 'Principal', 'Accountant'), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const month = req.query.month as string | undefined;
    const records = getAllPayrollFromDb(month);
    const stats = getPayrollStatsFromDb(month);
    res.json({ payroll: records, stats });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve payroll', details: err.message });
  }
});

router.post('/payroll/generate', requireRole('Super Admin', 'School Admin', 'Accountant'), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { month } = req.body;
    if (!month) {
      res.status(400).json({ error: 'Month is required' });
      return;
    }
    const result = generateMonthlyPayrollTx(month);
    serverStore.recordAuditLog({
      userId: req.user?.id || 'admin',
      userName: req.user?.name || 'Accountant',
      userRole: req.user?.role || 'Accountant',
      action: 'PAYROLL_GENERATED',
      module: 'HR & Payroll',
      status: 'Success',
      ipAddress: req.ip || '127.0.0.1',
      details: `Generated monthly payroll for ${month}: ${result.generated} staff records generated (Rs. ${result.totalAmount.toLocaleString()}), ${result.skipped} skipped`,
    });
    const records = getAllPayrollFromDb(month);
    const stats = getPayrollStatsFromDb(month);
    res.json({ success: true, result, payroll: records, stats });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate payroll', details: err.message });
  }
});

router.post('/payroll/disburse', requireRole('Super Admin', 'School Admin', 'Accountant'), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { recordIds, paymentMethod, paymentDate } = req.body;
    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      res.status(400).json({ error: 'Record IDs array required' });
      return;
    }
    const result = disburseBulkPayrollTx(recordIds, paymentMethod, paymentDate);
    serverStore.recordAuditLog({
      userId: req.user?.id || 'admin',
      userName: req.user?.name || 'Accountant',
      userRole: req.user?.role || 'Accountant',
      action: 'PAYROLL_DISBURSED',
      module: 'HR & Payroll',
      status: 'Success',
      ipAddress: req.ip || '127.0.0.1',
      details: `Disbursed salary for ${result.updated} staff members via ${paymentMethod || 'Bank Transfer'}`,
    });
    res.json({ success: true, updated: result.updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to disburse payroll', details: err.message });
  }
});

router.patch('/payroll/:id/status', requireRole('Super Admin', 'School Admin', 'Accountant'), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { status, paymentMethod, paymentDate } = req.body;
    const updated = updatePayrollStatusTx(req.params.id, status, paymentMethod, paymentDate);
    serverStore.recordAuditLog({
      userId: req.user?.id || 'admin',
      userName: req.user?.name || 'Accountant',
      userRole: req.user?.role || 'Accountant',
      action: 'PAYROLL_STATUS_UPDATED',
      module: 'HR & Payroll',
      status: 'Success',
      ipAddress: req.ip || '127.0.0.1',
      details: `Updated payroll status for record ${req.params.id} to ${status}`,
    });
    res.json({ success: true, record: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update payroll status', details: err.message });
  }
});

router.post('/payroll/process', requireRole('Super Admin', 'School Admin', 'Accountant'), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { employeeId, month, netSalary } = req.body;
    const record = updatePayrollStatusTx(employeeId, 'Paid', 'Bank Transfer');
    res.json({ success: true, payrollRecord: record });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to process payroll', details: err.message });
  }
});

// ==========================================
// 8. EXPENSES (STRICT RBAC: Super Admin, School Admin, Principal, Accountant ONLY)
// ==========================================
router.get('/expenses', requireRole('Super Admin', 'School Admin', 'Principal', 'Accountant'), (req: AuthenticatedRequest, res: Response): void => {
  res.json({ expenses: serverStore.expenses });
});

router.post('/expenses', requireRole('Super Admin', 'School Admin', 'Accountant'), (req: AuthenticatedRequest, res: Response): void => {
  const newExpense = {
    ...req.body,
    id: `exp-${Date.now()}`,
    date: req.body.date || new Date().toISOString().split('T')[0],
  };
  serverStore.expenses.unshift(newExpense);

  serverStore.recordAuditLog({
    userId: req.user?.id || 'admin',
    userName: req.user?.name || 'Accountant',
    userRole: req.user?.role || 'Accountant',
    action: 'EXPENSE_RECORDED',
    module: 'Finance',
    status: 'Success',
    ipAddress: req.ip || '127.0.0.1',
    details: `Logged institutional expense '$${newExpense.amount}' under category '${newExpense.category}'`,
  });

  res.status(201).json({ success: true, expense: newExpense });
});

// ==========================================
// 9. LIBRARY
// ==========================================
router.get('/library', (req: AuthenticatedRequest, res: Response): void => {
  res.json({ books: serverStore.libraryBooks, transactions: serverStore.libraryTransactions });
});

// ==========================================
// 10. TRANSPORT
// ==========================================
router.get('/transport', (req: AuthenticatedRequest, res: Response): void => {
  res.json({ vehicles: serverStore.vehicles, routes: serverStore.transportRoutes });
});

// ==========================================
// 11. AUDIT LOGS (Super Admin & School Admin ONLY)
// ==========================================
router.get('/audit-logs', requireRole('Super Admin', 'School Admin'), (req: AuthenticatedRequest, res: Response): void => {
  res.json({ logs: serverStore.auditLogs });
});

// ==========================================
// 12. SECURITY POLICY & SYSTEM SETTINGS
// ==========================================
router.get('/security/policy', requireRole('Super Admin', 'School Admin'), (req: AuthenticatedRequest, res: Response): void => {
  res.json({ policy: serverStore.securityPolicy });
});

router.put('/security/policy', requireRole('Super Admin'), (req: AuthenticatedRequest, res: Response): void => {
  serverStore.securityPolicy = {
    ...serverStore.securityPolicy,
    ...req.body,
  };

  serverStore.recordAuditLog({
    userId: req.user?.id || 'admin',
    userName: req.user?.name || 'Super Admin',
    userRole: 'Super Admin',
    action: 'SECURITY_POLICY_MODIFIED',
    module: 'Security Administration',
    status: 'Success',
    ipAddress: req.ip || '127.0.0.1',
    details: 'Updated institutional multi-factor, session duration, and password policies.',
  });

  res.json({ success: true, policy: serverStore.securityPolicy });
});

router.put('/settings', requireRole('Super Admin', 'School Admin', 'Principal'), (req: AuthenticatedRequest, res: Response): void => {
  const currentSaved = getSavedSchoolConfig() || {};
  const merged = {
    ...currentSaved,
    ...serverStore.schoolSettings,
    ...req.body,
  };
  if (req.body.schoolName) {
    merged.name = req.body.schoolName;
  }
  const persisted = saveSchoolConfig(merged);
  serverStore.schoolSettings = persisted;

  serverStore.recordAuditLog({
    userId: req.user?.id || 'admin',
    userName: req.user?.name || 'Super Admin',
    userRole: req.user?.role || 'Super Admin',
    action: 'SETTINGS_MODIFIED',
    module: 'Institutional Settings',
    status: 'Success',
    ipAddress: req.ip || '127.0.0.1',
    details: `Updated school settings: ${req.body.schoolName || 'General parameters'}`
  });

  res.json({ success: true, settings: serverStore.schoolSettings });
});

export default router;
