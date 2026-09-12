import express, { Response } from 'express';
import { serverStore } from '../store.js';
import { authenticateToken, requireRole, enforceStudentObjectAccess, AuthenticatedRequest } from '../middleware/auth.js';
import { saveStudentToDb, deleteStudentFromDb, getAllStudentsFromDb } from '../db.js';

const router = express.Router();

router.use(authenticateToken);

/**
 * GET /api/students
 * Fetches student list with privacy filtering:
 * - Admin/Principal/Teacher/Accountant sees institutional list
 * - Student sees ONLY their own profile
 * - Parent sees ONLY linked children
 */
router.get('/', (req: AuthenticatedRequest, res: Response): void => {
  const role = req.user?.role;
  const dbStudents = getAllStudentsFromDb();
  const currentStudents = dbStudents.length > 0 ? dbStudents : serverStore.students;

  if (['Super Admin', 'School Admin', 'Principal', 'Teacher', 'Accountant'].includes(role || '')) {
    res.json({ students: currentStudents });
    return;
  }

  if (role === 'Student') {
    const selfStudent = currentStudents.filter((s) => s.id === req.user?.studentId);
    res.json({ students: selfStudent });
    return;
  }

  if (role === 'Parent') {
    const children = currentStudents.filter((s) => (req.user?.parentChildIds || []).includes(s.id));
    res.json({ students: children });
    return;
  }

  // Other roles
  res.json({ students: [] });
});

/**
 * GET /api/students/:id
 * Individual Student profile with strict IDOR verification
 */
router.get('/:id', enforceStudentObjectAccess, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const dbStudents = getAllStudentsFromDb();
  const currentStudents = dbStudents.length > 0 ? dbStudents : serverStore.students;
  const student = currentStudents.find((s) => s.id === id);

  if (!student) {
    res.status(404).json({ error: 'Student record not found.' });
    return;
  }

  res.json({ student });
});

/**
 * POST /api/students
 * Create student: Admin & Principal only
 */
router.post('/', requireRole('Super Admin', 'School Admin', 'Principal'), (req: AuthenticatedRequest, res: Response): void => {
  const studentData = req.body;
  if (!studentData.firstName || !studentData.lastName || !studentData.class) {
    res.status(400).json({ error: 'Missing required student fields: firstName, lastName, class' });
    return;
  }

  const newStudent = {
    ...studentData,
    id: `std-${Date.now()}`,
    admissionNo: studentData.admissionNo || `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
    status: studentData.status || 'Active',
    admissionDate: studentData.admissionDate || new Date().toISOString().split('T')[0],
    attendanceRate: 100,
    feeStatus: 'Pending',
  };

  try {
    saveStudentToDb(newStudent);
    serverStore.students.unshift(newStudent);

    serverStore.recordAuditLog({
      userId: req.user?.id || 'admin',
      userName: req.user?.name || 'Administrator',
      userRole: req.user?.role || 'Admin',
      action: 'STUDENT_ENROLLED',
      module: 'Students',
      status: 'Success',
      ipAddress: req.ip || '127.0.0.1',
      details: `Enrolled student '${newStudent.firstName} ${newStudent.lastName}' (${newStudent.admissionNo}) in Class ${newStudent.class}`,
    });

    res.status(201).json({ success: true, student: newStudent });
  } catch (err: any) {
    console.error('Error saving student to SQLite:', err);
    res.status(500).json({ error: 'Failed to persist student to database: ' + err.message });
  }
});

/**
 * PUT /api/students/:id
 * Update student: Admin & Principal only
 */
router.put('/:id', requireRole('Super Admin', 'School Admin', 'Principal'), (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const index = serverStore.students.findIndex((s) => s.id === id);

  const updatedData = {
    ...(index !== -1 ? serverStore.students[index] : {}),
    ...req.body,
    id,
  };

  try {
    saveStudentToDb(updatedData);
    if (index !== -1) {
      serverStore.students[index] = updatedData;
    } else {
      serverStore.students.unshift(updatedData);
    }

    serverStore.recordAuditLog({
      userId: req.user?.id || 'admin',
      userName: req.user?.name || 'Administrator',
      userRole: req.user?.role || 'Admin',
      action: 'STUDENT_UPDATED',
      module: 'Students',
      status: 'Success',
      ipAddress: req.ip || '127.0.0.1',
      details: `Updated details for student ID '${id}'`,
    });

    res.json({ success: true, student: updatedData });
  } catch (err: any) {
    console.error('Error updating student in SQLite:', err);
    res.status(500).json({ error: 'Failed to update student in database: ' + err.message });
  }
});

/**
 * DELETE /api/students/:id
 * Delete student: Super Admin & School Admin ONLY.
 */
router.delete('/:id', requireRole('Super Admin', 'School Admin'), (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const index = serverStore.students.findIndex((s) => s.id === id);

  try {
    deleteStudentFromDb(id);
    let deletedName = id;
    if (index !== -1) {
      deletedName = `${serverStore.students[index].firstName} ${serverStore.students[index].lastName}`;
      serverStore.students.splice(index, 1);
    }

    serverStore.recordAuditLog({
      userId: req.user?.id || 'admin',
      userName: req.user?.name || 'Administrator',
      userRole: req.user?.role || 'Super Admin',
      action: 'STUDENT_DELETED',
      module: 'Students',
      status: 'Success',
      ipAddress: req.ip || '127.0.0.1',
      details: `Permanently removed student '${deletedName}' (${id})`,
    });

    res.json({ success: true, message: 'Student record deleted successfully from database.' });
  } catch (err: any) {
    console.error('Error deleting student from SQLite:', err);
    res.status(500).json({ error: 'Failed to delete student from database: ' + err.message });
  }
});

export default router;
