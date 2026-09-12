import React, { useState, useMemo } from 'react';
import { useERPData } from '../../context/ERPDataContext';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import {
  Calendar,
  Filter,
  Search,
  Printer,
  Download,
  Edit3,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';

interface AttendanceHistoryProps {
  onEditSession?: (date: string, className: string, sectionName: string) => void;
}

export const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({ onEditSession }) => {
  const { attendanceRecords, classes, showToast } = useERPData();

  const [dateFilter, setDateFilter] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [studentSearch, setStudentSearch] = useState('');

  // Available classes and sections
  const uniqueClasses = useMemo(() => {
    const list = Array.from(new Set(attendanceRecords.map((r) => r.class))).filter(Boolean);
    return ['All', ...list];
  }, [attendanceRecords]);

  const uniqueSections = useMemo(() => {
    const list = Array.from(new Set(attendanceRecords.map((r) => r.section))).filter(Boolean);
    return ['All', ...list];
  }, [attendanceRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return attendanceRecords
      .filter((r) => {
        const matchDate = !dateFilter || r.date === dateFilter;
        const matchClass = classFilter === 'All' || r.class === classFilter;
        const matchSection = sectionFilter === 'All' || r.section === sectionFilter;
        const matchStatus =
          statusFilter === 'All' ||
          r.status === statusFilter ||
          (statusFilter === 'Leave' && (r.status as any) === 'Excused');
        const matchSearch =
          !studentSearch.trim() ||
          r.studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
          (r.rollNumber && r.rollNumber.toString().includes(studentSearch)) ||
          (r.studentId && r.studentId.toLowerCase().includes(studentSearch.toLowerCase()));

        return matchDate && matchClass && matchSection && matchStatus && matchSearch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendanceRecords, dateFilter, classFilter, sectionFilter, statusFilter, studentSearch]);

  // Summary Metrics of filtered view
  const totalFiltered = filteredRecords.length;
  const presentCount = filteredRecords.filter((r) => r.status === 'Present').length;
  const absentCount = filteredRecords.filter((r) => r.status === 'Absent').length;
  const leaveCount = filteredRecords.filter(
    (r) => r.status === 'Leave' || (r.status as any) === 'Excused'
  ).length;
  const lateCount = filteredRecords.filter((r) => r.status === 'Late').length;
  const presentRate =
    totalFiltered > 0
      ? Math.round(((presentCount + lateCount) / totalFiltered) * 100)
      : 0;

  const handleResetFilters = () => {
    setDateFilter('');
    setClassFilter('All');
    setSectionFilter('All');
    setStatusFilter('All');
    setStudentSearch('');
  };

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      showToast('No Data', 'No records to export.', 'warning');
      return;
    }

    const headers = ['Date', 'Student Name', 'Roll Number', 'Class', 'Section', 'Status', 'Remarks'];
    const rows = filteredRecords.map((r) => [
      r.date,
      `"${r.studentName}"`,
      r.rollNumber || '',
      r.class,
      r.section,
      r.status,
      `"${r.remarks || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export Complete', 'Attendance records exported to CSV.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Historical Attendance Logs & Registry
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Browse, filter, and audit all saved attendance records stored in SQLite database.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs cursor-pointer"
              title="Print Sheet"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Inputs Grid: Date, Class, Section, Status, Student Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Date Filter
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Class Grade
            </label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {uniqueClasses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Section
            </label>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {uniqueSections.map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All Sections' : `Section ${s}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Leave">Leave</option>
              <option value="Late">Late</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Search Student
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Name or Roll #..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Summary Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-bold">Total Matches</span>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{totalFiltered}</p>
            <span className="text-[10px] text-slate-400">Records found</span>
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-900/50">
            <span className="text-emerald-700 dark:text-emerald-300 text-[10px] uppercase font-bold">
              Present
            </span>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {presentCount}
            </p>
            <span className="text-[10px] text-emerald-600/80">
              {totalFiltered > 0 ? `${Math.round((presentCount / totalFiltered) * 100)}%` : '—'}
            </span>
          </div>

          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200/60 dark:border-rose-900/50">
            <span className="text-rose-700 dark:text-rose-300 text-[10px] uppercase font-bold">
              Absent
            </span>
            <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">{absentCount}</p>
            <span className="text-[10px] text-rose-600/80">
              {totalFiltered > 0 ? `${Math.round((absentCount / totalFiltered) * 100)}%` : '—'}
            </span>
          </div>

          <div className="p-3 bg-sky-50 dark:bg-sky-950/30 rounded-xl border border-sky-200/60 dark:border-sky-900/50">
            <span className="text-sky-700 dark:text-sky-300 text-[10px] uppercase font-bold">
              Leave
            </span>
            <p className="text-xl font-bold text-sky-600 dark:text-sky-400 mt-1">{leaveCount}</p>
            <span className="text-[10px] text-sky-600/80">Authorized</span>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/50">
            <span className="text-amber-700 dark:text-amber-300 text-[10px] uppercase font-bold">
              Late / Rate
            </span>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {presentRate}% <span className="text-xs font-normal text-slate-500">({lateCount} late)</span>
            </p>
            <span className="text-[10px] text-amber-600/80">Overall rate</span>
          </div>
        </div>
      </div>

      {/* History Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              Database Records ({totalFiltered})
            </span>
          </div>
          <span className="text-xs text-slate-500">
            Filtered from {attendanceRecords.length} total database entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Roll #</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Class & Section</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3">Remarks</th>
                {onEditSession && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={onEditSession ? 7 : 6} className="py-12 text-center text-slate-400">
                    <CalendarCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold">No attendance records match your filter criteria.</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting the date or class filters.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {r.date}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-medium">
                      #{r.rollNumber || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.studentName} size="xs" />
                        <span className="font-bold text-slate-900 dark:text-white">
                          {r.studentName}
                        </span>
                      </div>
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
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                      {r.remarks || '—'}
                    </td>
                    {onEditSession && (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onEditSession(r.date, r.class, r.section)}
                          className="px-2.5 py-1 text-xs font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Session</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
