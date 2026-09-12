import React, { useState } from 'react';
import { useERPData } from '../../context/ERPDataContext';
import { TimetableSlot, ExamScheduleItem } from '../../types/erp';
import { PageHeader } from '../common/PageHeader';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  Trash2,
  Printer,
  BookOpen,
  GraduationCap,
  Award,
  FileText,
  Search,
  CheckCircle2,
  Users,
} from 'lucide-react';

type TimetableTab = 'class_period' | 'teacher_period' | 'first_term' | 'mid_term' | 'final_term';

export const TimetableView: React.FC = () => {
  const {
    timetables,
    examSchedules,
    classes,
    teachers,
    addTimetableSlot,
    deleteTimetableSlot,
    addExamSchedule,
    deleteExamSchedule,
    showToast,
  } = useERPData();

  const [activeTab, setActiveTab] = useState<TimetableTab>('class_period');

  // Class period filters
  const [selectedClass, setSelectedClass] = useState<string>(classes[0]?.name || 'Grade 10');
  const [selectedSection, setSelectedSection] = useState<string>('A');

  // Teacher period filter
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');

  // Exam schedule filter
  const [examClassFilter, setExamClassFilter] = useState<string>('All');
  const [examSearch, setExamSearch] = useState<string>('');

  // Class Period Modal State
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [classFormData, setClassFormData] = useState<Partial<TimetableSlot>>({
    class: selectedClass,
    section: selectedSection,
    dayOfWeek: 'Monday',
    period: 1,
    subject: 'Mathematics',
    teacher: teachers[0]?.name || '',
    startTime: '08:30',
    endTime: '09:15',
    room: 'Room 201',
  });

  // Exam Schedule Modal State
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [examFormData, setExamFormData] = useState<{
    term: 'First Term' | 'Mid Term' | 'Final Term';
    class: string;
    subject: string;
    date: string;
    startTime: string;
    endTime: string;
    roomNumber: string;
    maxMarks: number;
    invigilator: string;
  }>({
    term: 'First Term',
    class: classes[0]?.name || 'Grade 10',
    subject: 'Mathematics',
    date: new Date().toISOString().substring(0, 10),
    startTime: '09:00 AM',
    endTime: '12:00 PM',
    roomNumber: 'Examination Hall 1',
    maxMarks: 100,
    invigilator: teachers[0]?.name || '',
  });

  // Deletion confirm
  const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null);
  const [deletingExamId, setDeletingExamId] = useState<string | null>(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [1, 2, 3, 4, 5, 6, 7];

  const periodTimeMap: Record<number, string> = {
    1: '08:30 - 09:15',
    2: '09:20 - 10:05',
    3: '10:10 - 10:55',
    4: '11:15 - 12:00',
    5: '12:05 - 12:50',
    6: '01:30 - 02:15',
    7: '02:20 - 03:05',
  };

  const subjectColors: Record<string, string> = {
    Mathematics: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
    Physics: 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300',
    'English Literature': 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
    English: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
    History: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
    Chemistry: 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300',
    Biology: 'bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300',
    'Computer Science': 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300',
    Urdu: 'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
    Islamiat: 'bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300',
    'Pak Studies': 'bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300',
  };

  const handleSaveClassSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const newSlot: TimetableSlot = {
      id: `tt-${Date.now()}`,
      day: (classFormData.dayOfWeek as any) || 'Monday',
      dayOfWeek: classFormData.dayOfWeek || 'Monday',
      class: classFormData.class || selectedClass,
      section: classFormData.section || selectedSection,
      period: Number(classFormData.period) || 1,
      subject: classFormData.subject || 'General Studies',
      teacher: classFormData.teacher || teachers[0]?.name || 'Faculty',
      teacherName: classFormData.teacher || teachers[0]?.name || 'Faculty',
      startTime: classFormData.startTime || '08:30',
      endTime: classFormData.endTime || '09:15',
      room: classFormData.room || 'Room 201',
      roomNumber: classFormData.room || 'Room 201',
    };
    addTimetableSlot(newSlot);
    setIsClassModalOpen(false);
  };

  const handleOpenExamModal = (term: 'First Term' | 'Mid Term' | 'Final Term') => {
    setExamFormData({
      term,
      class: selectedClass,
      subject: 'Mathematics',
      date: new Date().toISOString().substring(0, 10),
      startTime: '09:00 AM',
      endTime: '12:00 PM',
      roomNumber: 'Main Hall',
      maxMarks: 100,
      invigilator: teachers[0]?.name || '',
    });
    setIsExamModalOpen(true);
  };

  const handleSaveExamSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const item: Omit<ExamScheduleItem, 'id'> = {
      examId: `exam-${examFormData.term.toLowerCase().replace(/\s+/g, '-')}`,
      examName: `${examFormData.term} Examination 2026`,
      term: examFormData.term,
      class: examFormData.class,
      subject: examFormData.subject,
      date: examFormData.date,
      startTime: examFormData.startTime,
      endTime: examFormData.endTime,
      roomNumber: examFormData.roomNumber,
      maxMarks: Number(examFormData.maxMarks) || 100,
      invigilator: examFormData.invigilator,
    };
    addExamSchedule(item);
    setIsExamModalOpen(false);
  };

  // Selected teacher object and teaching periods
  const activeTeacher = teachers.find((t) => t.id === selectedTeacherId) || teachers[0];
  const teacherSlots = timetables.filter((t) => {
    const tName = t.teacher || t.teacherName || '';
    return tName.toLowerCase() === (activeTeacher?.name || '').toLowerCase();
  });

  // Filtered Exam Schedules by term
  const getExamSchedulesByTerm = (termName: 'First Term' | 'Mid Term' | 'Final Term') => {
    return examSchedules.filter((ex) => {
      const matchTerm =
        ex.term === termName ||
        (ex.examName && ex.examName.toLowerCase().includes(termName.toLowerCase()));
      const matchClass = examClassFilter === 'All' || ex.class === examClassFilter;
      const matchSearch =
        !examSearch.trim() ||
        ex.subject.toLowerCase().includes(examSearch.toLowerCase()) ||
        ex.roomNumber.toLowerCase().includes(examSearch.toLowerCase()) ||
        (ex.invigilator || '').toLowerCase().includes(examSearch.toLowerCase());
      return matchTerm && matchClass && matchSearch;
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institutional Academic Timetable"
        subtitle="Manage class period routines, teacher workload timetables, and term examination datesheets"
        badge={
          <Badge variant="primary">
            Session 2025–2026
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs cursor-pointer"
              title="Print Current Timetable"
            >
              <Printer className="w-4 h-4" />
            </button>

            {activeTab === 'class_period' && (
              <button
                type="button"
                onClick={() => {
                  setClassFormData({
                    class: selectedClass,
                    section: selectedSection,
                    dayOfWeek: 'Monday',
                    period: 1,
                    subject: 'Mathematics',
                    teacher: teachers[0]?.name || '',
                    startTime: '08:30',
                    endTime: '09:15',
                    room: 'Room 201',
                  });
                  setIsClassModalOpen(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Class Period</span>
              </button>
            )}

            {activeTab === 'teacher_period' && (
              <button
                type="button"
                onClick={() => {
                  setClassFormData({
                    class: classes[0]?.name || 'Grade 10',
                    section: 'A',
                    dayOfWeek: 'Monday',
                    period: 1,
                    subject: activeTeacher?.subject || 'General Studies',
                    teacher: activeTeacher?.name || teachers[0]?.name || '',
                    startTime: '08:30',
                    endTime: '09:15',
                    room: 'Room 101',
                  });
                  setIsClassModalOpen(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Assign Period to Teacher</span>
              </button>
            )}

            {activeTab === 'first_term' && (
              <button
                type="button"
                onClick={() => handleOpenExamModal('First Term')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule 1st Term Exam</span>
              </button>
            )}

            {activeTab === 'mid_term' && (
              <button
                type="button"
                onClick={() => handleOpenExamModal('Mid Term')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule Mid Term Exam</span>
              </button>
            )}

            {activeTab === 'final_term' && (
              <button
                type="button"
                onClick={() => handleOpenExamModal('Final Term')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule Final Term Exam</span>
              </button>
            )}
          </div>
        }
      />

      {/* Timetable Type Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl overflow-x-auto border border-slate-200/60 dark:border-slate-700/60">
        <button
          type="button"
          onClick={() => setActiveTab('class_period')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'class_period'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Class Timetable</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('teacher_period')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'teacher_period'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Teacher Period Timetable</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('first_term')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'first_term'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>First Term Exam</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mid_term')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'mid_term'
              ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Mid Term Exam</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('final_term')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'final_term'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Final Term Exam</span>
        </button>
      </div>

      {/* VIEW 1: CLASS PERIOD TIMETABLE */}
      {activeTab === 'class_period' && (
        <div className="space-y-4">
          {/* Class & Section Filter Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Select Class:
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white cursor-pointer"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>

            <div className="text-xs text-slate-400">
              7 Periods Daily • 45 mins each • 15 min Recess between Period 3 & 4
            </div>
          </div>

          {/* Interactive Weekly Matrix Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                    <th className="p-3.5 font-bold uppercase w-28 border-r border-slate-200 dark:border-slate-700">
                      Day / Period
                    </th>
                    {periods.map((p) => (
                      <th
                        key={p}
                        className="p-3.5 font-bold text-center border-r border-slate-200 dark:border-slate-700 min-w-[145px]"
                      >
                        <div>Period {p}</div>
                        <span className="text-[10px] font-normal text-slate-400">
                          {periodTimeMap[p]}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {days.map((day) => (
                    <tr key={day} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-700">
                        {day}
                      </td>
                      {periods.map((p) => {
                        const slot = timetables.find(
                          (t) =>
                            t.class === selectedClass &&
                            t.section === selectedSection &&
                            (t.dayOfWeek === day || t.day === day) &&
                            t.period === p
                        );

                        if (!slot) {
                          return (
                            <td
                              key={p}
                              className="p-2 border-r border-slate-200 dark:border-slate-700 text-center text-slate-300 dark:text-slate-600 cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 group"
                              onClick={() => {
                                setClassFormData({
                                  class: selectedClass,
                                  section: selectedSection,
                                  dayOfWeek: day as any,
                                  period: p,
                                  subject: 'Mathematics',
                                  teacher: teachers[0]?.name || '',
                                  startTime: periodTimeMap[p].split(' - ')[0],
                                  endTime: periodTimeMap[p].split(' - ')[1],
                                  room: 'Room 201',
                                });
                                setIsClassModalOpen(true);
                              }}
                            >
                              <span className="text-[10px] opacity-40 group-hover:opacity-100 text-indigo-600 dark:text-indigo-400 font-semibold">
                                + Assign Slot
                              </span>
                            </td>
                          );
                        }

                        const scheme =
                          subjectColors[slot.subject] ||
                          'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200';

                        return (
                          <td key={p} className="p-2 border-r border-slate-200 dark:border-slate-700">
                            <div className={`p-2.5 rounded-xl border ${scheme} relative group`}>
                              <div className="flex items-start justify-between">
                                <p className="font-bold text-xs leading-tight">{slot.subject}</p>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingSlotId(slot.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-0.5 rounded cursor-pointer transition-opacity"
                                  title="Delete Period"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-[10px] opacity-80 mt-1 flex items-center gap-1">
                                <User className="w-2.5 h-2.5" /> {slot.teacher || slot.teacherName}
                              </p>
                              <p className="text-[10px] opacity-80 flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5" /> {slot.room || slot.roomNumber}
                              </p>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: TEACHERS PERIOD TIMETABLE */}
      {activeTab === 'teacher_period' && (
        <div className="space-y-4">
          {/* Teacher Selection Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Select Instructor:
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white cursor-pointer"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.subject} - {t.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-400">
                Weekly Teaching Load: <strong className="text-slate-700 dark:text-slate-300">{teacherSlots.length} Periods</strong>
              </span>
              <span className="text-slate-400">
                Department: <strong className="text-slate-700 dark:text-slate-300">{activeTeacher?.department || 'Academics'}</strong>
              </span>
            </div>
          </div>

          {/* Teacher Period Matrix */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                    <th className="p-3.5 font-bold uppercase w-28 border-r border-slate-200 dark:border-slate-700">
                      Day / Period
                    </th>
                    {periods.map((p) => (
                      <th
                        key={p}
                        className="p-3.5 font-bold text-center border-r border-slate-200 dark:border-slate-700 min-w-[145px]"
                      >
                        <div>Period {p}</div>
                        <span className="text-[10px] font-normal text-slate-400">
                          {periodTimeMap[p]}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {days.map((day) => (
                    <tr key={day} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-700">
                        {day}
                      </td>
                      {periods.map((p) => {
                        const slot = teacherSlots.find(
                          (t) => (t.dayOfWeek === day || t.day === day) && t.period === p
                        );

                        if (!slot) {
                          return (
                            <td
                              key={p}
                              className="p-2 border-r border-slate-200 dark:border-slate-700 text-center text-slate-400 dark:text-slate-600 bg-slate-50/20"
                            >
                              <span className="text-[10px] font-medium text-slate-300 dark:text-slate-600">
                                Free Period
                              </span>
                            </td>
                          );
                        }

                        const scheme =
                          subjectColors[slot.subject] ||
                          'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300';

                        return (
                          <td key={p} className="p-2 border-r border-slate-200 dark:border-slate-700">
                            <div className={`p-2.5 rounded-xl border ${scheme}`}>
                              <p className="font-bold text-xs leading-tight">{slot.subject}</p>
                              <p className="text-[10px] opacity-90 mt-1 font-semibold">
                                Class: {slot.class} - Sec {slot.section}
                              </p>
                              <p className="text-[10px] opacity-80 flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5" /> {slot.room || slot.roomNumber}
                              </p>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3, 4, 5: FIRST TERM, MID TERM, AND FINAL TERM EXAMINATION TIMETABLES */}
      {(activeTab === 'first_term' || activeTab === 'mid_term' || activeTab === 'final_term') && (
        <div className="space-y-4">
          {(() => {
            const currentTermName: 'First Term' | 'Mid Term' | 'Final Term' =
              activeTab === 'first_term'
                ? 'First Term'
                : activeTab === 'mid_term'
                ? 'Mid Term'
                : 'Final Term';

            const termSchedules = getExamSchedulesByTerm(currentTermName);

            return (
              <>
                {/* Exam Filter Bar */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={examSearch}
                        onChange={(e) => setExamSearch(e.target.value)}
                        placeholder="Search paper, room, or invigilator..."
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-hidden"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-medium">Class:</span>
                      <select
                        value={examClassFilter}
                        onChange={(e) => setExamClassFilter(e.target.value)}
                        className="px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        <option value="All">All Classes</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400">
                    Showing <strong className="text-slate-700 dark:text-slate-300">{termSchedules.length}</strong> scheduled examination papers
                  </div>
                </div>

                {/* Exam Schedule Table */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                          <th className="p-3.5 font-bold uppercase">Date & Day</th>
                          <th className="p-3.5 font-bold uppercase">Exam Paper / Subject</th>
                          <th className="p-3.5 font-bold uppercase">Class</th>
                          <th className="p-3.5 font-bold uppercase">Time Duration</th>
                          <th className="p-3.5 font-bold uppercase">Room / Hall</th>
                          <th className="p-3.5 font-bold uppercase">Max Marks</th>
                          <th className="p-3.5 font-bold uppercase">Assigned Invigilator</th>
                          <th className="p-3.5 font-bold uppercase text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {termSchedules.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-slate-400">
                              <BookOpen className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                              <p className="font-semibold text-slate-600 dark:text-slate-300">
                                No examination papers scheduled for {currentTermName} yet.
                              </p>
                              <p className="text-[11px] text-slate-400 mt-1">
                                Click the "+ Schedule {currentTermName} Exam" button above to add papers.
                              </p>
                            </td>
                          </tr>
                        ) : (
                          termSchedules.map((item) => (
                            <tr
                              key={item.id}
                              className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              <td className="p-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>{item.date}</span>
                                </div>
                              </td>

                              <td className="p-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                {item.subject}
                              </td>

                              <td className="p-3.5 whitespace-nowrap">
                                <Badge variant="primary" size="sm">
                                  {item.class}
                                </Badge>
                              </td>

                              <td className="p-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <span>
                                    {item.startTime} - {item.endTime}
                                  </span>
                                </div>
                              </td>

                              <td className="p-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{item.roomNumber}</span>
                                </div>
                              </td>

                              <td className="p-3.5 whitespace-nowrap font-mono font-bold text-slate-700 dark:text-slate-300">
                                {item.maxMarks} Marks
                              </td>

                              <td className="p-3.5 whitespace-nowrap text-slate-700 dark:text-slate-300">
                                <div className="flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{item.invigilator || 'Staff Invigilator'}</span>
                                </div>
                              </td>

                              <td className="p-3.5 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setDeletingExamId(item.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors"
                                  title="Delete Exam Slot"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Add Class Period Slot Modal */}
      <Modal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        title="Schedule Class Period Slot"
        subtitle="Assign subject, instructor, time interval, and classroom"
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsClassModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="class-slot-form"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
            >
              Save Period Slot
            </button>
          </>
        }
      >
        <form id="class-slot-form" onSubmit={handleSaveClassSlot} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Class *
              </label>
              <select
                value={classFormData.class || selectedClass}
                onChange={(e) => setClassFormData({ ...classFormData, class: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Section *
              </label>
              <select
                value={classFormData.section || selectedSection}
                onChange={(e) => setClassFormData({ ...classFormData, section: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Day of Week *
              </label>
              <select
                value={classFormData.dayOfWeek || 'Monday'}
                onChange={(e) => setClassFormData({ ...classFormData, dayOfWeek: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                {days.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Period Number *
              </label>
              <select
                value={classFormData.period || 1}
                onChange={(e) => setClassFormData({ ...classFormData, period: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                {periods.map((p) => (
                  <option key={p} value={p}>
                    Period {p} ({periodTimeMap[p]})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Subject Name *
            </label>
            <input
              type="text"
              required
              value={classFormData.subject || ''}
              onChange={(e) => setClassFormData({ ...classFormData, subject: e.target.value })}
              placeholder="e.g. Mathematics, Physics, English"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Teacher / Instructor *
            </label>
            <select
              value={classFormData.teacher || ''}
              onChange={(e) => setClassFormData({ ...classFormData, teacher: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white cursor-pointer"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name} ({t.subject})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Classroom / Room No.
              </label>
              <input
                type="text"
                value={classFormData.room || 'Room 201'}
                onChange={(e) => setClassFormData({ ...classFormData, room: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Time Interval
              </label>
              <input
                type="text"
                value={`${classFormData.startTime || '08:30'} - ${classFormData.endTime || '09:15'}`}
                readOnly
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Schedule Exam Paper Modal */}
      <Modal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        title={`Schedule ${examFormData.term} Examination Paper`}
        subtitle="Add datesheet slot with subject, examination hall, and invigilator details"
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsExamModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="exam-sched-form"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
            >
              Add to Datesheet
            </button>
          </>
        }
      >
        <form id="exam-sched-form" onSubmit={handleSaveExamSchedule} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Examination Term
              </label>
              <select
                value={examFormData.term}
                onChange={(e) => setExamFormData({ ...examFormData, term: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="First Term">First Term</option>
                <option value="Mid Term">Mid Term</option>
                <option value="Final Term">Final Term</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Class *
              </label>
              <select
                value={examFormData.class}
                onChange={(e) => setExamFormData({ ...examFormData, class: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Subject / Exam Paper Title *
            </label>
            <input
              type="text"
              required
              value={examFormData.subject}
              onChange={(e) => setExamFormData({ ...examFormData, subject: e.target.value })}
              placeholder="e.g. Mathematics Paper 1"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Exam Date *
              </label>
              <input
                type="date"
                required
                value={examFormData.date}
                onChange={(e) => setExamFormData({ ...examFormData, date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Start Time *
              </label>
              <input
                type="text"
                required
                value={examFormData.startTime}
                onChange={(e) => setExamFormData({ ...examFormData, startTime: e.target.value })}
                placeholder="09:00 AM"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                End Time *
              </label>
              <input
                type="text"
                required
                value={examFormData.endTime}
                onChange={(e) => setExamFormData({ ...examFormData, endTime: e.target.value })}
                placeholder="12:00 PM"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Examination Hall / Room *
              </label>
              <input
                type="text"
                required
                value={examFormData.roomNumber}
                onChange={(e) => setExamFormData({ ...examFormData, roomNumber: e.target.value })}
                placeholder="e.g. Examination Hall A"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Total Max Marks *
              </label>
              <input
                type="number"
                min={1}
                required
                value={examFormData.maxMarks}
                onChange={(e) => setExamFormData({ ...examFormData, maxMarks: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Invigilator Teacher
            </label>
            <select
              value={examFormData.invigilator}
              onChange={(e) => setExamFormData({ ...examFormData, invigilator: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="">-- Assign Invigilator --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name} ({t.subject})
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      {/* Delete Period Slot Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingSlotId)}
        onClose={() => setDeletingSlotId(null)}
        onConfirm={() => {
          if (deletingSlotId) {
            deleteTimetableSlot(deletingSlotId);
            setDeletingSlotId(null);
          }
        }}
        title="Remove Timetable Period"
        message="Are you sure you want to remove this period slot from the timetable?"
        variant="danger"
      />

      {/* Delete Exam Item Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingExamId)}
        onClose={() => setDeletingExamId(null)}
        onConfirm={() => {
          if (deletingExamId) {
            deleteExamSchedule(deletingExamId);
            setDeletingExamId(null);
          }
        }}
        title="Remove Exam from Datesheet"
        message="Are you sure you want to remove this paper from the examination datesheet?"
        variant="danger"
      />
    </div>
  );
};
