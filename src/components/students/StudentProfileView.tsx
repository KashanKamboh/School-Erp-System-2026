import React, { useState, useMemo } from 'react';
import { Student } from '../../types/erp';
import { useERPData } from '../../context/ERPDataContext';
import { PageHeader } from '../common/PageHeader';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { Tabs } from '../common/Tabs';
import {
  User,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  BookOpen,
  Bus,
  Phone,
  Mail,
  MapPin,
  Heart,
  FileText,
  Printer,
  Edit,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  XCircle,
} from 'lucide-react';

interface StudentProfileViewProps {
  student: Student;
  onBack: () => void;
  onEdit: (student: Student) => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  student,
  onBack,
  onEdit,
}) => {
  const {
    feeVouchers,
    feePayments,
    feeInvoices,
    libraryBooks,
    examResults,
    exams,
    attendanceRecords,
    schoolSettings,
  } = useERPData();
  const [activeTab, setActiveTab] = useState('overview');

  // Real fee vouchers for this student from SQLite database
  const studentVouchers = useMemo(() => {
    return feeVouchers.filter(
      (v) =>
        v.studentId === student.id ||
        (student.admissionNo && v.admissionNo === student.admissionNo) ||
        (v.studentName && v.studentName.toLowerCase() === `${student.firstName} ${student.lastName}`.toLowerCase().trim())
    );
  }, [feeVouchers, student]);

  // Real fee payments for this student
  const studentPayments = useMemo(() => {
    return feePayments.filter(
      (p) =>
        p.studentId === student.id ||
        (student.admissionNo && p.admissionNo === student.admissionNo) ||
        (p.studentName && p.studentName.toLowerCase() === `${student.firstName} ${student.lastName}`.toLowerCase().trim())
    );
  }, [feePayments, student]);

  const studentInvoices = feeInvoices.filter((inv) =>
    inv.studentName.toLowerCase().includes(student.firstName.toLowerCase())
  );

  const studentResults = examResults.filter((r) => r.studentId === student.id);

  // Real attendance computation from SQLite database records
  const studentAttendance = useMemo(() => {
    return attendanceRecords
      .filter((r) => r.studentId === student.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendanceRecords, student.id]);

  const totalSessions = studentAttendance.length;
  const presentSessions = studentAttendance.filter((r) => r.status === 'Present').length;
  const absentSessions = studentAttendance.filter((r) => r.status === 'Absent').length;
  const leaveSessions = studentAttendance.filter(
    (r) => r.status === 'Leave' || (r.status as any) === 'Excused'
  ).length;
  const lateSessions = studentAttendance.filter((r) => r.status === 'Late').length;
  const attendanceRate =
    totalSessions > 0
      ? Number((((presentSessions + lateSessions) / totalSessions) * 100).toFixed(1))
      : 100;

  const tabs = [
    { id: 'overview', label: 'Overview & Profile', icon: User },
    { id: 'academics', label: 'Exam Results & GPA', icon: Award },
    { id: 'attendance', label: 'Attendance Record', icon: CalendarCheck },
    { id: 'fees', label: 'Fee Invoices', icon: CreditCard, badge: studentInvoices.length },
    { id: 'idcard', label: 'Printable ID Card', icon: Printer },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${student.firstName} ${student.lastName}`}
        subtitle={`Student Profile • Admission ID: ${student.admissionNo}`}
        breadcrumbs={[
          { label: 'Students', onClick: onBack },
          { label: `${student.firstName} ${student.lastName}` },
        ]}
        badge={
          <Badge variant={student.status === 'Active' ? 'success' : 'danger'}>
            {student.status}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Directory</span>
            </button>
            <button
              onClick={() => onEdit(student)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          </div>
        }
      />

      {/* Top Profile Summary Hero Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <Avatar
            name={`${student.firstName} ${student.lastName}`}
            src={student.photoUrl}
            size="xl"
            className="ring-4 ring-blue-50 dark:ring-blue-950"
          />

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {student.firstName} {student.lastName}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold">
                Roll #{student.rollNumber}
              </span>
              {student.cnicOrBForm && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-semibold">
                  CNIC/B-Form: {student.cnicOrBForm}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Class {student.class} • Section {student.section} • Enrolled: {student.admissionDate || student.enrollmentDate}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {student.address}
              </span>
              <span className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                Blood Group: <strong className="text-slate-800 dark:text-slate-200">{student.bloodGroup}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Bus className="w-3.5 h-3.5 text-amber-500" />
                Transport: {student.transportRoute || 'Self / Walking'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Guardian & Contacts */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span>Parental & Emergency Data</span>
            </h3>

            {/* Consolidated Parent / Guardian Details */}
            <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <p className="font-bold text-blue-900 dark:text-blue-300">
                  Parent / Guardian ({student.parentRelation || 'Father'})
                </p>
                {student.monthlyFee !== undefined && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold font-mono">
                    Fee: Rs. {student.monthlyFee.toLocaleString()}/mo
                  </span>
                )}
              </div>
              <p className="text-slate-900 dark:text-white font-bold text-sm">
                {student.parentName || student.fatherName || 'Not specified'}
              </p>
              {(student.fatherCnic || (student as any).parentCnic) && (
                <p className="text-slate-500 font-mono text-[11px]">
                  CNIC: {student.fatherCnic || (student as any).parentCnic}
                </p>
              )}
              {(student.parentPhone || student.fatherPhone) && (
                <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-medium">
                  <Phone className="w-3.5 h-3.5 text-blue-500" />
                  {student.parentPhone || student.fatherPhone}
                </p>
              )}
              {student.parentEmail && (
                <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {student.parentEmail}
                </p>
              )}
              {(student.fatherOccupation || (student as any).parentOccupation) && (
                <p className="text-slate-500 text-[11px]">
                  Occupation: {student.fatherOccupation || (student as any).parentOccupation}
                </p>
              )}
            </div>

            {student.emergencyContact && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-400 font-medium">Emergency Line</p>
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
                  {student.emergencyContact} {student.emergencyContactPerson ? `(${student.emergencyContactPerson})` : ''}
                </p>
              </div>
            )}
          </div>

          {/* Quick Academic Highlights */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              Academic & Behavioral Metrics
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Attendance</p>
                <p
                  className={`text-xl font-bold mt-1 ${
                    attendanceRate >= 90
                      ? 'text-emerald-600'
                      : attendanceRate >= 75
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }`}
                >
                  {attendanceRate}%
                </p>
                <p className="text-[10px] text-slate-400">
                  Present: {presentSessions} / {totalSessions} Sessions
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-slate-400">Cumulative GPA</p>
                <p className="text-xl font-bold text-blue-600 mt-1">3.85</p>
                <p className="text-[10px] text-slate-400">Grade Point Scale 4.0</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-slate-400">Class Rank</p>
                <p className="text-xl font-bold text-indigo-600 mt-1">#3</p>
                <p className="text-[10px] text-slate-400">Top 5% of class</p>
              </div>
            </div>

            <div className="pt-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Teacher's Behavioral Remarks
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/50 leading-relaxed">
                "{student.firstName} demonstrates exemplary dedication in Mathematics and Science projects. Regularly participates in classroom discussions and assists peers with problem-solving tasks."
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Academic Results Tab */}
      {activeTab === 'academics' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Examinations Transcript & Subject Scorecard
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Examination</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Marks Obtained</th>
                  <th className="px-4 py-3">Max Marks</th>
                  <th className="px-4 py-3">Percentage</th>
                  <th className="px-4 py-3">Grade</th>
                  <th className="px-4 py-3">Teacher Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {studentResults.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-400">
                      No published examination records for this term yet.
                    </td>
                  </tr>
                ) : (
                  studentResults.map((r) => {
                    const percent = Math.round((r.obtainedMarks / r.totalMarks) * 100);
                    return (
                      <tr key={r.id}>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {r.examName}
                        </td>
                        <td className="px-4 py-3">{r.subject}</td>
                        <td className="px-4 py-3 font-bold text-blue-600">{r.obtainedMarks}</td>
                        <td className="px-4 py-3 text-slate-400">{r.totalMarks}</td>
                        <td className="px-4 py-3 font-semibold">{percent}%</td>
                        <td className="px-4 py-3">
                          <Badge variant="success" size="sm">{r.grade}</Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{r.remarks || 'Excellent work'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Official Attendance Record & History
              </h3>
              <p className="text-xs text-slate-400">
                Institutional roll-call records fetched from SQLite database
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  attendanceRate >= 90
                    ? 'success'
                    : attendanceRate >= 75
                    ? 'warning'
                    : 'danger'
                }
              >
                {attendanceRate}% Regularity Rate
              </Badge>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Total Marked</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{totalSessions}</p>
              <span className="text-[10px] text-slate-400">Sessions</span>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-900/50">
              <span className="text-emerald-700 dark:text-emerald-300 text-[10px] uppercase font-bold">
                Present
              </span>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {presentSessions}
              </p>
              <span className="text-[10px] text-emerald-600/80">
                {totalSessions > 0 ? `${Math.round((presentSessions / totalSessions) * 100)}%` : '—'}
              </span>
            </div>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200/60 dark:border-rose-900/50">
              <span className="text-rose-700 dark:text-rose-300 text-[10px] uppercase font-bold">
                Absent
              </span>
              <p className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1">
                {absentSessions}
              </p>
              <span className="text-[10px] text-rose-600/80">
                {totalSessions > 0 ? `${Math.round((absentSessions / totalSessions) * 100)}%` : '—'}
              </span>
            </div>

            <div className="p-3 bg-sky-50 dark:bg-sky-950/30 rounded-xl border border-sky-200/60 dark:border-sky-900/50">
              <span className="text-sky-700 dark:text-sky-300 text-[10px] uppercase font-bold">
                Leaves
              </span>
              <p className="text-lg font-bold text-sky-600 dark:text-sky-400 mt-1">
                {leaveSessions}
              </p>
              <span className="text-[10px] text-sky-600/80">Authorized</span>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/50">
              <span className="text-amber-700 dark:text-amber-300 text-[10px] uppercase font-bold">
                Late
              </span>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">
                {lateSessions}
              </p>
              <span className="text-[10px] text-amber-600/80">Tardiness</span>
            </div>
          </div>

          {/* Historical Table */}
          <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Class & Section</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3">Teacher Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {studentAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No attendance records logged for {student.firstName} yet.
                      </td>
                    </tr>
                  ) : (
                    studentAttendance.map((r) => (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {r.date}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {r.class} - {r.section}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant={
                              r.status === 'Present'
                                ? 'success'
                                : r.status === 'Absent'
                                ? 'danger'
                                : r.status === 'Leave' || (r.status as any) === 'Excused'
                                ? 'info'
                                : 'warning'
                            }
                            size="sm"
                          >
                            {r.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {r.remarks || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Fees Tab */}
      {activeTab === 'fees' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Fee Vouchers & Payment History
              </h3>
              <p className="text-xs text-slate-500">
                Official billing records, monthly vouchers, and payment receipts from database
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  student.feeStatus === 'Paid'
                    ? 'success'
                    : student.feeStatus === 'Pending' || student.feeStatus === 'Partial'
                    ? 'warning'
                    : 'danger'
                }
              >
                Status: {student.feeStatus || 'Pending'}
              </Badge>
            </div>
          </div>

          {/* Vouchers list */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Issued Monthly Fee Vouchers ({studentVouchers.length})
            </h4>
            {studentVouchers.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                No fee vouchers issued yet for this student.
              </p>
            ) : (
              studentVouchers.map((v) => (
                <div
                  key={v.id}
                  className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-900 dark:text-amber-400">
                        {v.voucherNo}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        • {v.feeMonth} ({v.academicYear})
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Due: {v.dueDate} • Issue: {v.issueDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-slate-900 dark:text-white">
                        Rs. {v.totalPayable.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Paid: Rs. {v.paidAmount.toLocaleString()} • Bal: Rs. {v.remainingBalance.toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        v.status === 'PAID'
                          ? 'success'
                          : v.status === 'PARTIALLY PAID'
                          ? 'info'
                          : v.status === 'OVERDUE'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {v.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment Receipts list */}
          {studentPayments.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Payment Receipts ({studentPayments.length})
              </h4>
              <div className="space-y-2">
                {studentPayments.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-lg border border-emerald-100 dark:border-emerald-950/60 bg-emerald-50/30 dark:bg-emerald-950/20 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">
                        {p.receiptNo}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400 ml-2">
                        {p.paymentDate} via {p.paymentMethod}
                      </span>
                    </div>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      Rs. {(p.amountPaid ?? p.amount ?? 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Printable ID Card */}
      {activeTab === 'idcard' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center">
          <div className="w-full max-w-sm bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 rounded-2xl text-white p-6 shadow-2xl relative overflow-hidden border-2 border-white/20">
            <div className="flex items-center justify-between border-b border-white/20 pb-3">
              <div>
                <h4 className="font-extrabold text-sm tracking-wider uppercase">
                  {schoolSettings.schoolName || 'ACADEMY'}
                </h4>
                <p className="text-[9px] text-blue-200 uppercase">Official Student Identity Card</p>
              </div>
              {schoolSettings.logoUrl ? (
                <img src={schoolSettings.logoUrl} alt="Logo" className="w-7 h-7 object-contain rounded-full bg-white/20 p-0.5" />
              ) : (
                <GraduationCap className="w-6 h-6 text-blue-200" />
              )}
            </div>

            <div className="mt-5 flex items-center gap-4">
              <Avatar
                name={`${student.firstName} ${student.lastName}`}
                src={student.photoUrl}
                size="lg"
                className="ring-2 ring-white"
              />
              <div className="min-w-0">
                <h5 className="font-bold text-base leading-tight">
                  {student.firstName} {student.lastName}
                </h5>
                <p className="text-xs text-blue-200 mt-0.5">Class: {student.class}-{student.section}</p>
                <p className="text-xs text-blue-200">Roll: {student.rollNumber}</p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-white/20 grid grid-cols-2 gap-2 text-[10px] text-blue-100">
              <div>
                <span className="text-blue-300 block">Admission No:</span>
                <span className="font-bold text-white">{student.admissionNo}</span>
              </div>
              <div>
                <span className="text-blue-300 block">Emergency:</span>
                <span className="font-bold text-white">{student.parentPhone}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Student ID Card</span>
          </button>
        </div>
      )}
    </div>
  );
};
