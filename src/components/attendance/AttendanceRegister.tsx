import React, { useState, useEffect, useMemo } from 'react';
import { useERPData } from '../../context/ERPDataContext';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Save,
  Check,
  RotateCcw,
  Printer,
  Calendar,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface AttendanceRegisterProps {
  initialDate?: string;
  initialClass?: string;
  initialSection?: string;
}

export const AttendanceRegister: React.FC<AttendanceRegisterProps> = ({
  initialDate,
  initialClass,
  initialSection,
}) => {
  const { students, attendanceRecords, saveAttendance, classes, showToast } = useERPData();
  const { hasModulePermission } = useAuth();

  const canEditAttendance =
    hasModulePermission('attendance', 'create') || hasModulePermission('attendance', 'edit');
  const canPrintAttendance = hasModulePermission('attendance', 'print');

  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [selectedClass, setSelectedClass] = useState<string>(initialClass || 'Grade 10');
  const [selectedSection, setSelectedSection] = useState<string>(initialSection || 'A');
  const [isSaving, setIsSaving] = useState(false);

  // Sync if initial props change
  useEffect(() => {
    if (initialDate) setSelectedDate(initialDate);
    if (initialClass) setSelectedClass(initialClass);
    if (initialSection) setSelectedSection(initialSection);
  }, [initialDate, initialClass, initialSection]);

  // Filter students enrolled in the selected class & section
  const classStudents = useMemo(() => {
    return students
      .filter((s) => s.class === selectedClass && s.section === selectedSection)
      .sort((a, b) => Number(a.rollNumber || 0) - Number(b.rollNumber || 0));
  }, [students, selectedClass, selectedSection]);

  // Find saved records in database for this date, class & section
  const existingSavedRecords = useMemo(() => {
    return attendanceRecords.filter(
      (r) =>
        r.date === selectedDate &&
        (r.class === selectedClass || r.class === selectedClass.toLowerCase()) &&
        (r.section === selectedSection || r.section === selectedSection.toLowerCase())
    );
  }, [attendanceRecords, selectedDate, selectedClass, selectedSection]);

  const isAlreadySaved = existingSavedRecords.length > 0;

  // Local state for daily roll call
  const [dailyStatus, setDailyStatus] = useState<
    Record<string, { status: 'Present' | 'Absent' | 'Late' | 'Leave'; remarks: string }>
  >({});

  // Populate or re-populate roll-call sheet whenever Date, Class, Section, or Students change
  useEffect(() => {
    const newStatusMap: Record<
      string,
      { status: 'Present' | 'Absent' | 'Late' | 'Leave'; remarks: string }
    > = {};

    classStudents.forEach((s) => {
      // Check if student already has a record in database for this date
      const saved = existingSavedRecords.find((r) => r.studentId === s.id);
      if (saved) {
        let normalizedStatus: 'Present' | 'Absent' | 'Late' | 'Leave' = 'Present';
        if (saved.status === 'Absent') normalizedStatus = 'Absent';
        else if (saved.status === 'Late') normalizedStatus = 'Late';
        else if (saved.status === 'Leave' || (saved.status as any) === 'Excused')
          normalizedStatus = 'Leave';

        newStatusMap[s.id] = {
          status: normalizedStatus,
          remarks: saved.remarks || '',
        };
      } else {
        // Default new status
        newStatusMap[s.id] = {
          status: 'Present',
          remarks: '',
        };
      }
    });

    setDailyStatus(newStatusMap);
  }, [classStudents, existingSavedRecords]);

  const handleStatusChange = (
    studentId: string,
    status: 'Present' | 'Absent' | 'Late' | 'Leave'
  ) => {
    setDailyStatus((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { remarks: '' }),
        status,
      },
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setDailyStatus((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'Present' }),
        remarks,
      },
    }));
  };

  const handleMarkAll = (status: 'Present' | 'Absent' | 'Leave') => {
    const updated: Record<
      string,
      { status: 'Present' | 'Absent' | 'Late' | 'Leave'; remarks: string }
    > = {};
    classStudents.forEach((s) => {
      updated[s.id] = { status, remarks: dailyStatus[s.id]?.remarks || '' };
    });
    setDailyStatus(updated);
    showToast('Batch Updated', `Marked all ${classStudents.length} students as ${status}.`, 'info');
  };

  const handleSaveAttendance = async () => {
    if (classStudents.length === 0) {
      showToast('No Students', 'Cannot save attendance because this class has no enrolled students.', 'warning');
      return;
    }

    setIsSaving(true);
    const recordsToSave = classStudents.map((s) => {
      const entry = dailyStatus[s.id] || { status: 'Present', remarks: '' };
      return {
        studentId: s.id,
        studentName: `${s.firstName} ${s.lastName}`,
        rollNumber: s.rollNumber,
        class: selectedClass,
        section: selectedSection,
        date: selectedDate,
        status: entry.status,
        remarks: entry.remarks,
      };
    });

    try {
      await saveAttendance(recordsToSave);
    } catch (err: any) {
      showToast('Error Saving Attendance', err?.message || 'Failed to save attendance', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Compute live roll call counts
  const total = classStudents.length;
  const statusValues = Object.values(dailyStatus);
  const presentCount = statusValues.filter((v) => v.status === 'Present').length;
  const lateCount = statusValues.filter((v) => v.status === 'Late').length;
  const absentCount = statusValues.filter((v) => v.status === 'Absent').length;
  const leaveCount = statusValues.filter((v) => v.status === 'Leave').length;
  const percentage = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 0;

  // Available classes and sections
  const classOptions = useMemo(() => {
    if (classes && classes.length > 0) {
      const uniqueNames = Array.from(new Set(classes.map((c) => c.name)));
      return uniqueNames;
    }
    return ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'];
  }, [classes]);

  const currentClassSections = useMemo(() => {
    const matched = classes.filter((c) => c.name === selectedClass);
    if (matched.length > 0) {
      return Array.from(new Set(matched.map((c) => c.section)));
    }
    return ['A', 'B', 'C'];
  }, [classes, selectedClass]);

  return (
    <div className="space-y-5">
      {/* Control Card: Date -> Class -> Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Selectors: Date -> Class -> Section */}
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                1. Select Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                2. Select Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {classOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                3. Select Section
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {currentClassSections.map((sec) => (
                  <option key={sec} value={sec}>
                    Section {sec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Actions & Save Button */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-end">
            {canEditAttendance && (
              <>
                <button
                  type="button"
                  onClick={() => handleMarkAll('Present')}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-800 transition-colors"
                >
                  All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll('Absent')}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-800 transition-colors"
                >
                  All Absent
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll('Leave')}
                  className="px-3 py-2 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-xs font-bold rounded-xl border border-sky-200 dark:border-sky-800 transition-colors"
                >
                  All Leave
                </button>
              </>
            )}

            {canPrintAttendance && (
              <button
                type="button"
                onClick={() => window.print()}
                className="p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs"
                title="Print Roll Sheet"
              >
                <Printer className="w-4 h-4" />
              </button>
            )}

            {canEditAttendance && (
              <button
                type="button"
                disabled={isSaving || classStudents.length === 0}
                onClick={handleSaveAttendance}
                className={`px-4 py-2 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer ${
                  isAlreadySaved
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Save className="w-4 h-4" />
                <span>
                  {isSaving
                    ? 'Saving to Database...'
                    : isAlreadySaved
                    ? 'Update Saved Attendance'
                    : 'Save Attendance to Database'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Database Status Alert Banner */}
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm ${
            isAlreadySaved
              ? 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
              : 'bg-blue-50/80 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {isAlreadySaved ? (
              <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            )}
            <div>
              <span className="font-bold">
                {isAlreadySaved
                  ? `Saved Records Loaded for ${selectedClass} - Section ${selectedSection} (${selectedDate})`
                  : `New Roll-Call Session for ${selectedClass} - Section ${selectedSection}`}
              </span>
              <p className="text-xs opacity-90 mt-0.5">
                {isAlreadySaved
                  ? 'Attendance was previously saved to SQLite database. Modifying statuses will update the existing records without creating duplicates.'
                  : 'No existing records found for this date. All students default to Present. Click "Save Attendance to Database" to permanently commit records.'}
              </p>
            </div>
          </div>
          <Badge variant={isAlreadySaved ? 'warning' : 'primary'} size="sm">
            {isAlreadySaved ? 'Edit Mode (DB Record Exists)' : 'New Session'}
          </Badge>
        </div>

        {/* Real-time Summary Cards */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-bold">Total Enrolled</span>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{total}</p>
          </div>

          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-900/50">
            <span className="text-emerald-700 dark:text-emerald-300 text-[10px] uppercase font-bold">
              Present
            </span>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {presentCount}
            </p>
          </div>

          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200/60 dark:border-rose-900/50">
            <span className="text-rose-700 dark:text-rose-300 text-[10px] uppercase font-bold">
              Absent
            </span>
            <p className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5">
              {absentCount}
            </p>
          </div>

          <div className="p-2.5 bg-sky-50 dark:bg-sky-950/30 rounded-xl border border-sky-200/60 dark:border-sky-900/50">
            <span className="text-sky-700 dark:text-sky-300 text-[10px] uppercase font-bold">
              Leave
            </span>
            <p className="text-lg font-bold text-sky-600 dark:text-sky-400 mt-0.5">
              {leaveCount}
            </p>
          </div>

          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/50">
            <span className="text-amber-700 dark:text-amber-300 text-[10px] uppercase font-bold">
              Late / Attendance %
            </span>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              {percentage}% <span className="text-xs font-normal text-slate-500">({lateCount} late)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Roll Call Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Roll-Call Sheet • {selectedClass} ({selectedSection})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Mark each student: Present, Absent, or Leave. Changes are permanently committed upon saving.
            </p>
          </div>
          <Badge variant="primary" size="sm">
            {classStudents.length} Students Listed
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 w-16">Roll #</th>
                <th className="px-4 py-3">Student Name & Details</th>
                <th className="px-4 py-3 text-center">Mark Attendance Status</th>
                <th className="px-4 py-3">Remarks / Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {classStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-semibold">No students found in {selectedClass} Section {selectedSection}.</p>
                    <p className="text-xs text-slate-400 mt-1">Select a different class or enroll students to mark attendance.</p>
                  </td>
                </tr>
              ) : (
                classStudents.map((s) => {
                  const cur = dailyStatus[s.id] || { status: 'Present', remarks: '' };

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-bold text-slate-600 dark:text-slate-400">
                        #{s.rollNumber || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={`${s.firstName} ${s.lastName}`}
                            src={s.avatar}
                            size="sm"
                          />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {s.firstName} {s.lastName}
                            </p>
                            <p className="text-xs text-slate-400">
                              Adm: {s.admissionNo} • Father: {s.fatherName || 'Guardian'} {s.parentPhone ? `(${s.parentPhone})` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {canEditAttendance ? (
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.id, 'Present')}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                cur.status === 'Present'
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              Present
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.id, 'Absent')}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                cur.status === 'Absent'
                                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              Absent
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.id, 'Leave')}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                cur.status === 'Leave'
                                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              Leave
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.id, 'Late')}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                cur.status === 'Late'
                                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              Late
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <Badge
                              variant={
                                cur.status === 'Present'
                                  ? 'success'
                                  : cur.status === 'Absent'
                                  ? 'danger'
                                  : cur.status === 'Leave'
                                  ? 'info'
                                  : 'warning'
                              }
                            >
                              {cur.status}
                            </Badge>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {canEditAttendance ? (
                          <input
                            type="text"
                            value={cur.remarks || ''}
                            onChange={(e) => handleRemarksChange(s.id, e.target.value)}
                            placeholder="Optional reason (e.g. sick leave, travel)..."
                            className="w-full max-w-xs px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {cur.remarks || '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {classStudents.length > 0 && canEditAttendance && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
            <span className="text-xs text-slate-500">
              {presentCount} Present • {absentCount} Absent • {leaveCount} Leave ({percentage}% Rate)
            </span>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveAttendance}
              className={`px-5 py-2.5 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer ${
                isAlreadySaved ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
              } disabled:opacity-50`}
            >
              <Save className="w-4 h-4" />
              <span>
                {isSaving
                  ? 'Saving to Database...'
                  : isAlreadySaved
                  ? 'Update Attendance Records'
                  : 'Save Attendance to Database'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
