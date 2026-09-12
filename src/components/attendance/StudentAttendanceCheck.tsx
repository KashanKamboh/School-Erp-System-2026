import React, { useState, useMemo } from 'react';
import { useERPData } from '../../context/ERPDataContext';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import {
  Search,
  User,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Calendar,
  Filter,
} from 'lucide-react';

interface StudentAttendanceCheckProps {
  initialStudentId?: string;
}

export const StudentAttendanceCheck: React.FC<StudentAttendanceCheckProps> = ({
  initialStudentId,
}) => {
  const { students, attendanceRecords, classes } = useERPData();

  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || (students[0]?.id || '')
  );

  // Filter student list by class and search
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchClass = selectedClass === 'All' || s.class === selectedClass;
      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
      const matchSearch =
        searchQuery.trim() === '' ||
        fullName.includes(searchQuery.toLowerCase()) ||
        (s.admissionNo && s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.rollNumber && s.rollNumber.toString().includes(searchQuery));
      return matchClass && matchSearch;
    });
  }, [students, selectedClass, searchQuery]);

  // Selected student object
  const activeStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || students[0];
  }, [students, selectedStudentId]);

  // Selected student's attendance records from database
  const studentRecords = useMemo(() => {
    if (!activeStudent) return [];
    return attendanceRecords
      .filter((r) => r.studentId === activeStudent.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendanceRecords, activeStudent]);

  // Calculate student statistics
  const totalDays = studentRecords.length;
  const presentDays = studentRecords.filter((r) => r.status === 'Present').length;
  const absentDays = studentRecords.filter((r) => r.status === 'Absent').length;
  const leaveDays = studentRecords.filter((r) => r.status === 'Leave' || (r.status as any) === 'Excused').length;
  const lateDays = studentRecords.filter((r) => r.status === 'Late').length;

  const attendancePercentage =
    totalDays > 0 ? Number((((presentDays + lateDays) / totalDays) * 100).toFixed(1)) : 100;

  const uniqueClasses = useMemo(() => {
    const list = Array.from(new Set(students.map((s) => s.class))).filter(Boolean);
    return ['All', ...list];
  }, [students]);

  return (
    <div className="space-y-6">
      {/* Student Selector & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Student Attendance Profile & Audit
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select or search any student to inspect their individual attendance rate and historical logs.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Class Filter */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-slate-500">Class:</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {uniqueClasses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, roll, or admission..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-56"
              />
            </div>

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              className="p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs cursor-pointer"
              title="Print Student Report"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Student Chip Selector */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto pb-1">
          {filteredStudents.slice(0, 15).map((s) => {
            const isSelected = activeStudent?.id === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedStudentId(s.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>{s.firstName} {s.lastName}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isSelected ? 'bg-blue-700' : 'bg-slate-200 dark:bg-slate-700'}`}>
                  {s.class}-{s.section}
                </span>
              </button>
            );
          })}
          {filteredStudents.length > 15 && (
            <span className="text-xs text-slate-400 shrink-0">
              +{filteredStudents.length - 15} more (use search)
            </span>
          )}
        </div>
      </div>

      {activeStudent ? (
        <>
          {/* Active Student Header Card & Metric Badges */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar
                  name={`${activeStudent.firstName} ${activeStudent.lastName}`}
                  src={activeStudent.avatar}
                  size="lg"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {activeStudent.firstName} {activeStudent.lastName}
                    </h2>
                    <Badge variant={activeStudent.status === 'Active' ? 'success' : 'warning'}>
                      {activeStudent.status || 'Active'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Admission #: <strong className="text-slate-700 dark:text-slate-300">{activeStudent.admissionNo}</strong> • Roll #: <strong className="text-slate-700 dark:text-slate-300">#{activeStudent.rollNumber || '—'}</strong> • Class: <strong className="text-slate-700 dark:text-slate-300">{activeStudent.class} ({activeStudent.section})</strong>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Guardian: {activeStudent.fatherName || 'Parent'} • Contact: {activeStudent.parentPhone || activeStudent.phone || '—'}
                  </p>
                </div>
              </div>

              {/* Overall Percentage Badge */}
              <div className="text-right sm:border-l sm:border-slate-100 sm:dark:border-slate-800 sm:pl-6">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Attendance Score
                </span>
                <p
                  className={`text-2xl font-black mt-0.5 ${
                    attendancePercentage >= 90
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : attendancePercentage >= 75
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {attendancePercentage}%
                </p>
                <p className="text-[11px] text-slate-400">
                  {attendancePercentage >= 90
                    ? 'Excellent Regularity'
                    : attendancePercentage >= 75
                    ? 'Satisfactory'
                    : 'Irregular Attendance'}
                </p>
              </div>
            </div>

            {/* Attendance Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span>Overall Presence Ratio</span>
                <span>{presentCountFrom(presentDays, lateDays)} of {totalDays} sessions</span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all"
                  style={{ width: `${totalDays > 0 ? (presentDays / totalDays) * 100 : 100}%` }}
                  title={`Present: ${presentDays}`}
                />
                <div
                  className="bg-amber-400 h-full transition-all"
                  style={{ width: `${totalDays > 0 ? (lateDays / totalDays) * 100 : 0}%` }}
                  title={`Late: ${lateDays}`}
                />
                <div
                  className="bg-sky-400 h-full transition-all"
                  style={{ width: `${totalDays > 0 ? (leaveDays / totalDays) * 100 : 0}%` }}
                  title={`Leave: ${leaveDays}`}
                />
                <div
                  className="bg-rose-500 h-full transition-all"
                  style={{ width: `${totalDays > 0 ? (absentDays / totalDays) * 100 : 0}%` }}
                  title={`Absent: ${absentDays}`}
                />
              </div>
            </div>

            {/* Metrics Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Total Sessions</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{totalDays}</p>
                <span className="text-[10px] text-slate-400">Marked days</span>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-900/50">
                <span className="text-emerald-700 dark:text-emerald-300 text-[10px] uppercase font-bold">
                  Present Days
                </span>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {presentDays}
                </p>
                <span className="text-[10px] text-emerald-600/80">
                  {totalDays > 0 ? `${Math.round((presentDays / totalDays) * 100)}%` : '—'}
                </span>
              </div>

              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200/60 dark:border-rose-900/50">
                <span className="text-rose-700 dark:text-rose-300 text-[10px] uppercase font-bold">
                  Absent Days
                </span>
                <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                  {absentDays}
                </p>
                <span className="text-[10px] text-rose-600/80">
                  {totalDays > 0 ? `${Math.round((absentDays / totalDays) * 100)}%` : '—'}
                </span>
              </div>

              <div className="p-3 bg-sky-50 dark:bg-sky-950/30 rounded-xl border border-sky-200/60 dark:border-sky-900/50">
                <span className="text-sky-700 dark:text-sky-300 text-[10px] uppercase font-bold">
                  Leave / Excused
                </span>
                <p className="text-xl font-bold text-sky-600 dark:text-sky-400 mt-1">{leaveDays}</p>
                <span className="text-[10px] text-sky-600/80">Authorized</span>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/50">
                <span className="text-amber-700 dark:text-amber-300 text-[10px] uppercase font-bold">
                  Late Arrivals
                </span>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{lateDays}</p>
                <span className="text-[10px] text-amber-600/80">Tardiness</span>
              </div>
            </div>
          </div>

          {/* Student Historical Attendance Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Attendance Logs for {activeStudent.firstName} {activeStudent.lastName}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chronological session logs recorded in SQLite database.
                </p>
              </div>
              <Badge variant="primary" size="sm">
                {studentRecords.length} Records Found
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Day of Week</th>
                    <th className="px-4 py-3">Class & Section</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3">Remarks / Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {studentRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <CalendarCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm font-semibold">No attendance records found for this student.</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Mark attendance in the "Class-wise Register" tab to generate logs.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    studentRecords.map((r) => {
                      const dateObj = new Date(r.date);
                      const dayName = isNaN(dateObj.getTime())
                        ? '—'
                        : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
                            dateObj.getDay()
                          ];

                      return (
                        <tr
                          key={r.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                            {r.date}
                          </td>
                          <td className="px-4 py-3 text-slate-500">{dayName}</td>
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
                            >
                              {r.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                            {r.remarks || '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 text-slate-400">
          <User className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-semibold text-sm">No students available to display.</p>
        </div>
      )}
    </div>
  );
};

function presentCountFrom(present: number, late: number) {
  return present + late;
}
