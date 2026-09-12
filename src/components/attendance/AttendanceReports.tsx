import React, { useState, useMemo } from 'react';
import { useERPData } from '../../context/ERPDataContext';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import {
  BarChart3,
  Users,
  Printer,
  Download,
  Calendar,
  Layers,
  FileSpreadsheet,
  TrendingUp,
} from 'lucide-react';

export const AttendanceReports: React.FC = () => {
  const { classes, students, attendanceRecords, showToast, settings } = useERPData();

  const [activeReportTab, setActiveReportTab] = useState<'class' | 'student'>('class');

  // Class-wise Report Filters
  const [reportDate, setReportDate] = useState<string>(''); // empty means all-time / cumulative

  // Student-wise Report Filters
  const [selectedClass, setSelectedClass] = useState<string>('Grade 10');
  const [selectedSection, setSelectedSection] = useState<string>('All');

  // Unique classes and sections
  const classList = useMemo(() => {
    if (classes && classes.length > 0) {
      return Array.from(new Set(classes.map((c) => c.name)));
    }
    return ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'];
  }, [classes]);

  // Class-wise Summary Data Computation
  const classReportData = useMemo(() => {
    // Generate for all known classes and sections
    const rows = classes.map((c) => {
      // Find all students enrolled in this class and section
      const enrolledStudents = students.filter(
        (s) => s.class === c.name && s.section === c.section
      );
      const enrolledCount = enrolledStudents.length;

      // Find attendance records for this class & section (optionally filtered by date)
      const matchingRecords = attendanceRecords.filter((r) => {
        const matchClass = r.class === c.name;
        const matchSection = r.section === c.section;
        const matchDate = !reportDate || r.date === reportDate;
        return matchClass && matchSection && matchDate;
      });

      const totalMarked = matchingRecords.length;
      const present = matchingRecords.filter((r) => r.status === 'Present').length;
      const absent = matchingRecords.filter((r) => r.status === 'Absent').length;
      const leave = matchingRecords.filter(
        (r) => r.status === 'Leave' || (r.status as any) === 'Excused'
      ).length;
      const late = matchingRecords.filter((r) => r.status === 'Late').length;

      const rate =
        totalMarked > 0 ? Math.round(((present + late) / totalMarked) * 100) : 0;

      return {
        id: c.id,
        className: c.name,
        section: c.section,
        roomNumber: c.roomNumber,
        enrolledCount,
        totalMarked,
        present,
        absent,
        leave,
        late,
        rate,
      };
    });

    return rows;
  }, [classes, students, attendanceRecords, reportDate]);

  // Student-wise Summary Data Computation for selected class
  const studentReportData = useMemo(() => {
    const classStudents = students.filter((s) => {
      const matchClass = s.class === selectedClass;
      const matchSection = selectedSection === 'All' || s.section === selectedSection;
      return matchClass && matchSection;
    });

    return classStudents
      .map((s) => {
        const studentRecords = attendanceRecords.filter((r) => r.studentId === s.id);
        const total = studentRecords.length;
        const present = studentRecords.filter((r) => r.status === 'Present').length;
        const absent = studentRecords.filter((r) => r.status === 'Absent').length;
        const leave = studentRecords.filter(
          (r) => r.status === 'Leave' || (r.status as any) === 'Excused'
        ).length;
        const late = studentRecords.filter((r) => r.status === 'Late').length;
        const percentage =
          total > 0 ? Number((((present + late) / total) * 100).toFixed(1)) : 100;

        return {
          id: s.id,
          rollNumber: s.rollNumber,
          admissionNo: s.admissionNo,
          name: `${s.firstName} ${s.lastName}`,
          avatar: s.avatar,
          class: s.class,
          section: s.section,
          fatherName: s.fatherName,
          phone: s.parentPhone || s.phone,
          total,
          present,
          absent,
          leave,
          late,
          percentage,
        };
      })
      .sort((a, b) => Number(a.rollNumber || 0) - Number(b.rollNumber || 0));
  }, [students, attendanceRecords, selectedClass, selectedSection]);

  const handleExportCSV = () => {
    let headers: string[];
    let rows: (string | number)[][];
    let filename: string;

    if (activeReportTab === 'class') {
      headers = [
        'Class',
        'Section',
        'Enrolled Students',
        'Total Sessions Marked',
        'Present Count',
        'Absent Count',
        'Leave Count',
        'Attendance Rate %',
      ];
      rows = classReportData.map((r) => [
        r.className,
        r.section,
        r.enrolledCount,
        r.totalMarked,
        r.present,
        r.absent,
        r.leave,
        `${r.rate}%`,
      ]);
      filename = `class_attendance_report_${reportDate || 'all_dates'}.csv`;
    } else {
      headers = [
        'Roll #',
        'Admission #',
        'Student Name',
        'Class',
        'Section',
        'Total Recorded Days',
        'Present Days',
        'Absent Days',
        'Leave Days',
        'Late Days',
        'Attendance %',
      ];
      rows = studentReportData.map((s) => [
        s.rollNumber || '',
        s.admissionNo || '',
        `"${s.name}"`,
        s.class,
        s.section,
        s.total,
        s.present,
        s.absent,
        s.leave,
        s.late,
        `${s.percentage}%`,
      ]);
      filename = `student_attendance_report_${selectedClass}_${selectedSection}.csv`;
    }

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Report Exported', 'CSV report downloaded successfully.', 'success');
  };

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Official Institutional Print Header */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex items-center gap-3">
          {settings?.logoUrl ? (
            <div className="w-14 h-14 rounded-lg border border-slate-300 p-1 flex items-center justify-center shrink-0">
              <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : null}
          <div>
            <h1 className="text-xl font-black uppercase text-slate-950">
              {settings?.schoolName || 'Academic Institution'}
            </h1>
            <p className="text-xs text-slate-600">
              {settings?.address || (settings?.city ? `${settings.city}, ${settings.country || 'Pakistan'}` : 'Institutional Campus')}
            </p>
            <p className="text-[10px] text-slate-500">
              {settings?.affiliationNumber ? `Affiliation: ${settings.affiliationNumber} • ` : ''}Academic Session {settings?.currentSession || '2025–2026'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-block px-3 py-1 bg-slate-900 text-white font-mono text-xs font-bold uppercase rounded-xs">
            {activeReportTab === 'class' ? 'Class Attendance Audit' : 'Student Attendance Profile'}
          </span>
          <p className="text-[10px] text-slate-500 mt-1">Generated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Sub-navigation Pills */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveReportTab('class')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeReportTab === 'class'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Class-wise Attendance Report</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveReportTab('student')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeReportTab === 'student'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Student-wise Attendance Report</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer shadow-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs cursor-pointer"
            title="Print Report"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activeReportTab === 'class' ? (
        /* ================= CLASS-WISE ATTENDANCE REPORT ================= */
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between flex-wrap gap-4">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Class-wise Attendance Analysis
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Overview of presence, absenteeism, and authorized leaves across all academic classes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">Filter Date:</label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              {reportDate && (
                <button
                  type="button"
                  onClick={() => setReportDate('')}
                  className="text-xs text-blue-600 hover:underline cursor-pointer"
                >
                  Show All Dates
                </button>
              )}
            </div>
          </div>

          {/* Class-wise Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Class & Section</th>
                    <th className="px-4 py-3 text-center">Enrolled</th>
                    <th className="px-4 py-3 text-center">Sessions Logged</th>
                    <th className="px-4 py-3 text-center text-emerald-600 dark:text-emerald-400">
                      Present
                    </th>
                    <th className="px-4 py-3 text-center text-rose-600 dark:text-rose-400">
                      Absent
                    </th>
                    <th className="px-4 py-3 text-center text-sky-600 dark:text-sky-400">
                      Leave
                    </th>
                    <th className="px-4 py-3 text-center">Attendance %</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {classReportData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No classes configured.
                      </td>
                    </tr>
                  ) : (
                    classReportData.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          {row.className} - Section {row.section}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-slate-600 dark:text-slate-300">
                          {row.enrolledCount}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-500 font-medium">
                          {row.totalMarked}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                          {row.present}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-rose-600 dark:text-rose-400">
                          {row.absent}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-sky-600 dark:text-sky-400">
                          {row.leave}
                        </td>
                        <td className="px-4 py-3 text-center font-extrabold text-slate-900 dark:text-white">
                          {row.totalMarked > 0 ? `${row.rate}%` : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {row.totalMarked === 0 ? (
                            <Badge variant="neutral">No Records</Badge>
                          ) : row.rate >= 90 ? (
                            <Badge variant="success">Optimal (≥90%)</Badge>
                          ) : row.rate >= 75 ? (
                            <Badge variant="warning">Acceptable</Badge>
                          ) : (
                            <Badge variant="danger">Low Rate</Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ================= STUDENT-WISE ATTENDANCE REPORT ================= */
        <div className="space-y-4">
          {/* Class and Section Filter */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between flex-wrap gap-4">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Student-wise Attendance Report
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Detailed presence ratios and absence audit for all students in the selected class.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-semibold text-slate-500">Class:</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {classList.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <label className="text-xs font-semibold text-slate-500">Section:</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Sections</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>
            </div>
          </div>

          {/* Student Report Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 w-16">Roll #</th>
                    <th className="px-4 py-3">Student Name & Admission</th>
                    <th className="px-4 py-3">Class & Section</th>
                    <th className="px-4 py-3 text-center">Total Sessions</th>
                    <th className="px-4 py-3 text-center text-emerald-600 dark:text-emerald-400">
                      Present
                    </th>
                    <th className="px-4 py-3 text-center text-rose-600 dark:text-rose-400">
                      Absent
                    </th>
                    <th className="px-4 py-3 text-center text-sky-600 dark:text-sky-400">
                      Leave
                    </th>
                    <th className="px-4 py-3 text-center">Attendance %</th>
                    <th className="px-4 py-3 text-center">Regularity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {studentReportData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-400">
                        No students found matching {selectedClass} ({selectedSection}).
                      </td>
                    </tr>
                  ) : (
                    studentReportData.map((s) => (
                      <tr
                        key={s.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-bold text-slate-500">
                          #{s.rollNumber || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={s.name} src={s.avatar} size="xs" />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{s.name}</p>
                              <p className="text-[11px] text-slate-400">Adm: {s.admissionNo}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {s.class} - {s.section}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-slate-600 dark:text-slate-300">
                          {s.total}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                          {s.present}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-rose-600 dark:text-rose-400">
                          {s.absent}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-sky-600 dark:text-sky-400">
                          {s.leave}
                        </td>
                        <td className="px-4 py-3 text-center font-extrabold text-slate-900 dark:text-white">
                          {s.total > 0 ? `${s.percentage}%` : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {s.total === 0 ? (
                            <Badge variant="neutral">Not Marked</Badge>
                          ) : s.percentage >= 90 ? (
                            <Badge variant="success">Regular</Badge>
                          ) : s.percentage >= 75 ? (
                            <Badge variant="warning">Average</Badge>
                          ) : (
                            <Badge variant="danger">Low</Badge>
                          )}
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
    </div>
  );
};
