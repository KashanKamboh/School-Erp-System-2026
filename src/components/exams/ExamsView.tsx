import React, { useState } from 'react';
import { useERPData } from '../../context/ERPDataContext';
import { useAuth } from '../../context/AuthContext';
import { Exam, ExamResult, Student, ExamScheduleItem } from '../../types/erp';
import { PageHeader } from '../common/PageHeader';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Tabs } from '../common/Tabs';
import { Avatar } from '../common/Avatar';
import { ResultCardView, ExamTerm } from './ResultCardView';
import {
  FileCheck,
  Award,
  Calendar,
  Plus,
  Printer,
  Edit,
  Save,
  CheckCircle2,
  School,
  Download,
  Filter,
  Trash2,
  Clock,
  MapPin,
  UserCheck,
  Sparkles,
  RotateCcw,
  BarChart2,
  Layers,
} from 'lucide-react';

export const ExamsView: React.FC = () => {
  const {
    exams,
    examSchedules = [],
    examResults,
    students,
    classes,
    attendanceRecords = [],
    saveExamResults,
    addExam,
    deleteExam,
    addExamSchedule,
    deleteExamSchedule,
    settings,
    showToast,
  } = useERPData();
  const { currentUser, hasModulePermission } = useAuth();

  const canEditMarks = hasModulePermission('exams', 'create') || hasModulePermission('exams', 'edit');
  const canPrintReports = hasModulePermission('exams', 'print');

  // Dynamically extract classes configured in Classes & Section page
  const configuredClasses = Array.from(new Set(classes.map((c) => c.name)));
  const studentClasses = Array.from(new Set(students.map((s) => s.class))).filter(Boolean);
  const availableClassNames = configuredClasses.length > 0 ? configuredClasses : (studentClasses.length > 0 ? studentClasses : ['Grade 10', 'Grade 9', 'Grade 8']);

  const [activeTab, setActiveTab] = useState<'schedules' | 'marks' | 'reportcard'>('schedules');
  const [filterTerm, setFilterTerm] = useState<'All' | ExamTerm>('All');
  const [selectedTermForMarks, setSelectedTermForMarks] = useState<ExamTerm>('Mid Term');
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || 'exam-mid-term');
  const [selectedClass, setSelectedClass] = useState<string>(availableClassNames[0] || 'Grade 10');
  const [selectedSection, setSelectedSection] = useState<string>('All');

  // Date Sheet State
  const [activeDateSheetExam, setActiveDateSheetExam] = useState<Exam | null>(null);
  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);
  const [newSlotSubject, setNewSlotSubject] = useState('');
  const [newSlotClass, setNewSlotClass] = useState(availableClassNames[0] || 'Grade 10');
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotStartTime, setNewSlotStartTime] = useState('09:00 AM');
  const [newSlotEndTime, setNewSlotEndTime] = useState('12:00 PM');
  const [newSlotRoom, setNewSlotRoom] = useState('Hall A');
  const [newSlotMaxMarks, setNewSlotMaxMarks] = useState(100);
  const [newSlotInvigilator, setNewSlotInvigilator] = useState('');

  // Dynamic sections for selected class
  const classSections = classes.filter((c) => c.name === selectedClass).map((c) => c.section);
  const availableSections = classSections.length > 0 ? Array.from(new Set(classSections)) : ['A', 'B'];

  // Dynamic subjects for selected class
  const classObj = classes.find((c) => c.name.toLowerCase() === selectedClass.toLowerCase());
  const availableSubjects = classObj?.subjects && classObj.subjects.length > 0
    ? classObj.subjects
    : [
        'Mathematics',
        'English Language & Literature',
        'Urdu Language & Literature',
        'General Science / Physics',
        'Chemistry / Biology',
        'Islamiat / Ethics',
        'Pakistan Studies (Social Studies)',
        'Computer Science',
        'Holy Quran (Nazra & Translation)',
      ];

  const [selectedSubject, setSelectedSubject] = useState<string>(availableSubjects[0] || 'Mathematics');

  // Modal State for adding an exam
  const [isAddExamOpen, setIsAddExamOpen] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [newExamTerm, setNewExamTerm] = useState<ExamTerm>('Mid Term');
  const [newExamSession, setNewExamSession] = useState(settings?.currentSession || '2025-2026');
  const [newExamStartDate, setNewExamStartDate] = useState('');
  const [newExamEndDate, setNewExamEndDate] = useState('');
  const [newExamTotalMarks, setNewExamTotalMarks] = useState(100);
  const [newExamPassingMarks, setNewExamPassingMarks] = useState(40);
  const [newExamSelectedClasses, setNewExamSelectedClasses] = useState<string[]>(availableClassNames.slice(0, 5));

  // Filter students for Student or Parent view
  const availableStudentsForReport = students.filter((s) => {
    if (currentUser.role === 'Student') return s.id === 'std-1';
    if (currentUser.role === 'Parent') return s.id === 'std-1' || s.id === 'std-2';
    return true;
  });

  // Filter exams by term
  const filteredExams = exams.filter((ex) => {
    if (filterTerm === 'All') return true;
    if (ex.term) return ex.term === filterTerm;
    if (filterTerm === 'First Term' && ex.name.toLowerCase().includes('first')) return true;
    if (filterTerm === 'Mid Term' && ex.name.toLowerCase().includes('mid')) return true;
    if (filterTerm === 'Final Term' && ex.name.toLowerCase().includes('final')) return true;
    return false;
  });

  // Filter exams for marks entry by selected term
  const examsForMarksTerm = exams.filter((ex) => {
    if (ex.term) return ex.term === selectedTermForMarks;
    if (selectedTermForMarks === 'First Term' && ex.name.toLowerCase().includes('first')) return true;
    if (selectedTermForMarks === 'Mid Term' && ex.name.toLowerCase().includes('mid')) return true;
    if (selectedTermForMarks === 'Final Term' && ex.name.toLowerCase().includes('final')) return true;
    return false;
  });

  // Filter class students based on selected class and section
  const classStudents = students.filter((s) => {
    if (s.class !== selectedClass) return false;
    if (selectedSection !== 'All' && s.section && s.section !== selectedSection) return false;
    return true;
  });

  // Real marks state
  const [marksState, setMarksState] = useState<Record<string, { marks?: number | string; remarks?: string }>>({});

  const getStudentMarkValue = (stdId: string) => {
    if (marksState[stdId] !== undefined && marksState[stdId].marks !== undefined) {
      return marksState[stdId].marks;
    }
    const existing = examResults.find(
      (r) =>
        r.studentId === stdId &&
        r.subject.toLowerCase() === selectedSubject.toLowerCase() &&
        (!r.term || r.term === selectedTermForMarks)
    );
    if (existing && existing.obtainedMarks !== undefined && existing.obtainedMarks !== null) {
      return existing.obtainedMarks;
    }
    return '';
  };

  const getStudentRemarksValue = (stdId: string) => {
    if (marksState[stdId] !== undefined && marksState[stdId].remarks !== undefined) {
      return marksState[stdId].remarks || '';
    }
    const existing = examResults.find(
      (r) =>
        r.studentId === stdId &&
        r.subject.toLowerCase() === selectedSubject.toLowerCase() &&
        (!r.term || r.term === selectedTermForMarks)
    );
    if (existing && existing.remarks) {
      return existing.remarks;
    }
    return '';
  };

  const handleMarksChange = (stdId: string, val: string) => {
    setMarksState((prev) => ({
      ...prev,
      [stdId]: { ...(prev[stdId] || {}), marks: val === '' ? '' : Number(val) },
    }));
  };

  const handleRemarksChange = (stdId: string, remarks: string) => {
    setMarksState((prev) => ({
      ...prev,
      [stdId]: { ...(prev[stdId] || {}), remarks },
    }));
  };

  const calculateGrade = (obtained: number | string, max: number = 100) => {
    if (obtained === '' || obtained === undefined || obtained === null) return '-';
    const num = Number(obtained);
    if (isNaN(num)) return '-';
    const percent = (num / max) * 100;
    if (percent >= 90) return 'A+';
    if (percent >= 80) return 'A';
    if (percent >= 70) return 'B';
    if (percent >= 60) return 'C';
    if (percent >= 50) return 'D';
    if (percent >= 40) return 'E';
    return 'F';
  };

  // Quick fill passing marks (40) for unentered students
  const handleQuickFillPassing = () => {
    const updated: Record<string, { marks?: number | string; remarks?: string }> = { ...marksState };
    classStudents.forEach((s) => {
      const currentVal = getStudentMarkValue(s.id);
      if (currentVal === '' || currentVal === null || currentVal === undefined) {
        updated[s.id] = {
          marks: 40,
          remarks: 'Satisfactory Pass',
        };
      }
    });
    setMarksState(updated);
    showToast('Quick-Fill Applied', 'Filled passing marks (40) for unrecorded students.', 'info');
  };

  // Auto-generate constructive remarks based on current marks
  const handleAutoGenerateRemarks = () => {
    const updated: Record<string, { marks?: number | string; remarks?: string }> = { ...marksState };
    classStudents.forEach((s) => {
      const currentVal = getStudentMarkValue(s.id);
      if (currentVal !== '' && currentVal !== null && currentVal !== undefined) {
        const num = Number(currentVal);
        let rem = 'Needs extra revision';
        if (num >= 85) rem = 'Outstanding comprehension & effort';
        else if (num >= 70) rem = 'Good progress; keep it up';
        else if (num >= 50) rem = 'Satisfactory; room for improvement';
        else if (num >= 40) rem = 'Barely passed; requires focused study';

        updated[s.id] = {
          ...(updated[s.id] || {}),
          marks: num,
          remarks: rem,
        };
      }
    });
    setMarksState(updated);
    showToast('Remarks Generated', 'Generated remarks based on student scores.');
  };

  // Reset current subject marks in form
  const handleResetCurrentMarks = () => {
    const updated: Record<string, { marks?: number | string; remarks?: string }> = { ...marksState };
    classStudents.forEach((s) => {
      delete updated[s.id];
    });
    setMarksState(updated);
    showToast('Reset Complete', 'Cleared unsaved inputs for this subject.', 'info');
  };

  const handleSaveMarks = () => {
    const activeExam = exams.find((e) => e.id === selectedExamId) || examsForMarksTerm[0];
    const max = activeExam?.totalMarks || 100;

    const resultsToSave: any[] = [];

    classStudents.forEach((s) => {
      const val = getStudentMarkValue(s.id);
      if (val !== '' && val !== undefined && val !== null) {
        const num = Number(val);
        const percent = (num / max) * 100;
        let grade = 'F';
        if (percent >= 90) grade = 'A+';
        else if (percent >= 80) grade = 'A';
        else if (percent >= 70) grade = 'B';
        else if (percent >= 60) grade = 'C';
        else if (percent >= 50) grade = 'D';
        else if (percent >= 40) grade = 'E';

        const rem = getStudentRemarksValue(s.id);

        resultsToSave.push({
          examId: activeExam?.id || selectedExamId,
          examName: activeExam?.name || `${selectedTermForMarks} Examination`,
          term: selectedTermForMarks,
          studentId: s.id,
          studentName: `${s.firstName} ${s.lastName}`,
          rollNumber: s.rollNumber,
          class: s.class,
          section: s.section,
          subject: selectedSubject,
          totalMarks: max,
          obtainedMarks: num,
          grade,
          remarks: rem || (percent >= 40 ? 'Satisfactory' : 'Needs Improvement'),
        });
      }
    });

    if (resultsToSave.length === 0) {
      showToast('No Marks Entered', 'Please enter marks for at least one student before saving.', 'warning');
      return;
    }

    saveExamResults(resultsToSave);
  };

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamName.trim()) {
      showToast('Validation Error', 'Please enter the examination title.', 'error');
      return;
    }

    addExam({
      name: newExamName.trim(),
      term: newExamTerm,
      academicSession: newExamSession,
      startDate: newExamStartDate || new Date().toISOString().split('T')[0],
      endDate: newExamEndDate || new Date().toISOString().split('T')[0],
      classes: newExamSelectedClasses,
      status: 'Upcoming',
      totalMarks: newExamTotalMarks,
      passingMarks: newExamPassingMarks,
    });

    setIsAddExamOpen(false);
    setNewExamName('');
  };

  // Add paper slot to date sheet
  const handleAddScheduleSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDateSheetExam) return;
    if (!newSlotSubject.trim() || !newSlotDate) {
      showToast('Required Fields', 'Please select a subject and date for the exam paper.', 'warning');
      return;
    }

    addExamSchedule({
      examId: activeDateSheetExam.id,
      examName: activeDateSheetExam.name,
      term: activeDateSheetExam.term,
      class: newSlotClass,
      subject: newSlotSubject.trim(),
      date: newSlotDate,
      startTime: newSlotStartTime,
      endTime: newSlotEndTime,
      roomNumber: newSlotRoom,
      maxMarks: newSlotMaxMarks,
      invigilator: newSlotInvigilator || 'Staff Member',
    });

    setIsAddSlotOpen(false);
    setNewSlotSubject('');
  };

  // Marks stats for the active class & subject
  const currentSubjectStats = (() => {
    const entered = classStudents
      .map((s) => getStudentMarkValue(s.id))
      .filter((v) => v !== '' && v !== null && v !== undefined)
      .map((v) => Number(v));

    const count = entered.length;
    if (count === 0) {
      return { count: 0, avg: 0, passRate: 0, highest: 0, total: classStudents.length };
    }
    const sum = entered.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / count);
    const passCount = entered.filter((m) => m >= 40).length;
    const passRate = Math.round((passCount / count) * 100);
    const highest = Math.max(...entered);

    return { count, avg, passRate, highest, total: classStudents.length };
  })();

  const tabs = [
    { id: 'schedules', label: 'Exam Schedules & Date Sheets', icon: Calendar },
    ...(canEditMarks ? [{ id: 'marks', label: 'Marks & Grades Entry', icon: Edit }] : []),
    { id: 'reportcard', label: 'Official Result / Report Card', icon: Award },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Examinations & Grading Management"
        subtitle="Manage First Term, Mid Term, and Final Term examinations, enter subject marks, and issue official progress reports"
        badge={<Badge variant="primary">{exams.length} Active Exam Sessions</Badge>}
        actions={
          <div className="flex items-center gap-2">
            {canEditMarks && (
              <button
                onClick={() => {
                  setNewExamName(`${selectedTermForMarks} Examination ${settings?.currentSession || '2025-2026'}`);
                  setIsAddExamOpen(true);
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule New Exam</span>
              </button>
            )}
            {canPrintReports && (
              <button
                onClick={() => setActiveTab('reportcard')}
                className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                <Printer className="w-4 h-4" />
                <span>Print Report Cards</span>
              </button>
            )}
          </div>
        }
      />

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as any)}
      />

      {/* Schedules & Timetables Tab */}
      {activeTab === 'schedules' && (
        <div className="space-y-5">
          {/* Term Filter Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-2">
                <Filter className="w-3.5 h-3.5" />
                Exam Term:
              </span>
              {(['All', 'First Term', 'Mid Term', 'Final Term'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterTerm(t)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterTerm === t
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {t === 'All' ? 'All Terms' : t}
                </button>
              ))}
            </div>

            <span className="text-xs font-medium text-slate-400">
              Showing {filteredExams.length} of {exams.length} examinations
            </span>
          </div>

          {filteredExams.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200/80 dark:border-slate-800">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                No examinations scheduled for this term
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Click &quot;Schedule New Exam&quot; above to create a First Term, Mid Term, or Final Term exam.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredExams.map((exam) => {
                const examSlots = examSchedules.filter((s) => s.examId === exam.id);

                return (
                  <div
                    key={exam.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={exam.status === 'Completed' ? 'success' : exam.status === 'Ongoing' ? 'warning' : 'info'}
                            size="sm"
                          >
                            {exam.status}
                          </Badge>
                          {exam.term && (
                            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              {exam.term}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 font-medium">{exam.academicSession}</span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 dark:text-white mt-3">
                        {exam.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Classes: <span className="font-semibold text-slate-700 dark:text-slate-300">{exam.classes.join(', ')}</span>
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center justify-between">
                          <span>Duration:</span>
                          <strong className="text-slate-900 dark:text-white">
                            {exam.startDate} to {exam.endDate}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Max Marks per Subject:</span>
                          <strong className="text-slate-900 dark:text-white">{exam.totalMarks} Marks</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Passing Criteria:</span>
                          <strong className="text-slate-900 dark:text-white">{exam.passingMarks} Marks (40%)</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Date Sheet Papers:</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {examSlots.length} Subject Papers Scheduled
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setActiveDateSheetExam(exam);
                          setNewSlotClass(exam.classes[0] || availableClassNames[0]);
                        }}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>Date Sheet ({examSlots.length})</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {canEditMarks && (
                          <button
                            onClick={() => {
                              setSelectedExamId(exam.id);
                              if (exam.term) setSelectedTermForMarks(exam.term as ExamTerm);
                              setActiveTab('marks');
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-colors cursor-pointer"
                          >
                            Enter Marks →
                          </button>
                        )}
                        {currentUser.role === 'Admin' && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete "${exam.name}" and its date sheets?`)) {
                                deleteExam(exam.id);
                              }
                            }}
                            title="Delete Exam"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Marks Entry Tab */}
      {activeTab === 'marks' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          {/* Term Selection & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Term buttons */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Examination Term
                </label>
                <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  {(['First Term', 'Mid Term', 'Final Term'] as ExamTerm[]).map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => {
                        setSelectedTermForMarks(term);
                        const matched = exams.find((e) => e.term === term || e.name.toLowerCase().includes(term.toLowerCase()));
                        if (matched) setSelectedExamId(matched.id);
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        selectedTermForMarks === term
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exam dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Exam Title
                </label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold focus:outline-hidden"
                >
                  {(examsForMarksTerm.length > 0 ? examsForMarksTerm : exams).map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('reportcard')}
                className="px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                <span>View Result Cards</span>
              </button>
            </div>
          </div>

          {/* Class, Section, and Subject Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Class / Grade
              </label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedSection('All');
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-hidden"
              >
                {availableClassNames.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Section
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-hidden"
              >
                <option value="All">All Sections ({availableSections.length})</option>
                {availableSections.map((sec) => (
                  <option key={sec} value={sec}>
                    Section {sec}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Subject (Curriculum)
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-hidden"
              >
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Metrics & Assist Tools Banner */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Class Enrolled:</span>
                <strong className="font-bold text-slate-900 dark:text-white">{currentSubjectStats.total} Students</strong>
              </div>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Marks Entered:</span>
                <strong className="font-bold text-blue-600 dark:text-blue-400">
                  {currentSubjectStats.count} / {currentSubjectStats.total}
                </strong>
              </div>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Subject Average:</span>
                <strong className="font-bold text-slate-900 dark:text-white">{currentSubjectStats.avg}%</strong>
              </div>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Pass Rate:</span>
                <strong className="font-bold text-emerald-600 dark:text-emerald-400">{currentSubjectStats.passRate}%</strong>
              </div>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Highest Mark:</span>
                <strong className="font-bold text-purple-600 dark:text-purple-400">{currentSubjectStats.highest} / 100</strong>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
              <button
                type="button"
                onClick={handleQuickFillPassing}
                className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Fill Passing (40)</span>
              </button>
              <button
                type="button"
                onClick={handleAutoGenerateRemarks}
                className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Auto Remarks</span>
              </button>
              <button
                type="button"
                onClick={handleResetCurrentMarks}
                title="Reset uncommitted changes"
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleSaveMarks}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Subject Marks</span>
              </button>
            </div>
          </div>

          {/* Student Marks Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 w-16">Roll #</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Term</th>
                  <th className="px-4 py-3">Marks (Max: 100)</th>
                  <th className="px-4 py-3">Percentage</th>
                  <th className="px-4 py-3">Auto Grade</th>
                  <th className="px-4 py-3">Teacher Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {classStudents.length > 0 ? (
                  classStudents.map((s) => {
                    const markVal = getStudentMarkValue(s.id);
                    const remarksVal = getStudentRemarksValue(s.id);
                    const num = markVal !== '' ? Number(markVal) : null;
                    const percent = num !== null ? Math.round((num / 100) * 100) : null;
                    const grade = num !== null ? calculateGrade(num, 100) : '-';

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-bold text-slate-400">#{s.rollNumber}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={`${s.firstName} ${s.lastName}`} src={s.photoUrl || s.avatar} size="xs" />
                            <span className="font-bold text-slate-900 dark:text-white">
                              {s.firstName} {s.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            {selectedTermForMarks}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            placeholder="0 - 100"
                            value={markVal}
                            onChange={(e) => handleMarksChange(s.id, e.target.value)}
                            className="w-24 px-2.5 py-1 text-center font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {percent !== null ? `${percent}%` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {grade !== '-' ? (
                            <Badge
                              variant={grade === 'A+' || grade === 'A' ? 'success' : grade === 'F' ? 'danger' : 'info'}
                              size="sm"
                            >
                              {grade}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 font-normal">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={remarksVal}
                            onChange={(e) => handleRemarksChange(s.id, e.target.value)}
                            placeholder="e.g. Outstanding performance"
                            className="w-full max-w-xs px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden"
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      No students enrolled in {selectedClass} {selectedSection !== 'All' ? `Section ${selectedSection}` : ''}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Official Report Card Generator Tab */}
      {activeTab === 'reportcard' && (
        <ResultCardView
          students={availableStudentsForReport}
          examResults={examResults}
          schoolSettings={settings}
          classes={classes}
          attendanceRecords={attendanceRecords}
          canPrint={canPrintReports}
        />
      )}

      {/* Schedule New Exam Modal */}
      <Modal
        isOpen={isAddExamOpen}
        onClose={() => setIsAddExamOpen(false)}
        title="Schedule New Examination"
        size="md"
      >
        <form onSubmit={handleCreateExam} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Examination Term *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['First Term', 'Mid Term', 'Final Term'] as ExamTerm[]).map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    setNewExamTerm(term);
                    if (!newExamName || newExamName.includes('Term Examination')) {
                      setNewExamName(`${term} Examination ${newExamSession}`);
                    }
                  }}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    newExamTerm === term
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Examination Name / Title *
            </label>
            <input
              type="text"
              required
              value={newExamName}
              onChange={(e) => setNewExamName(e.target.value)}
              placeholder="e.g. Mid Term Examination 2025-2026"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Academic Session
              </label>
              <input
                type="text"
                value={newExamSession}
                onChange={(e) => setNewExamSession(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Max Marks per Subject
              </label>
              <input
                type="number"
                value={newExamTotalMarks}
                onChange={(e) => setNewExamTotalMarks(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={newExamStartDate}
                onChange={(e) => setNewExamStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                End Date *
              </label>
              <input
                type="date"
                required
                value={newExamEndDate}
                onChange={(e) => setNewExamEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddExamOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
            >
              Schedule Exam
            </button>
          </div>
        </form>
      </Modal>

      {/* Date Sheet Timetable Modal */}
      {activeDateSheetExam && (
        <Modal
          isOpen={Boolean(activeDateSheetExam)}
          onClose={() => setActiveDateSheetExam(null)}
          title={`Date Sheet: ${activeDateSheetExam.name}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-xs text-slate-500 font-medium">Examination Session:</span>
                <strong className="block text-sm font-bold text-slate-900 dark:text-white">
                  {activeDateSheetExam.name} ({activeDateSheetExam.academicSession})
                </strong>
                <span className="text-xs text-slate-400">
                  {activeDateSheetExam.startDate} to {activeDateSheetExam.endDate}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSlotOpen(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subject Paper</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Date Sheet</span>
                </button>
              </div>
            </div>

            {/* Timetable slots table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-800 font-bold uppercase text-[11px] text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="px-3.5 py-2.5">Date & Day</th>
                    <th className="px-3.5 py-2.5">Time</th>
                    <th className="px-3.5 py-2.5">Class</th>
                    <th className="px-3.5 py-2.5">Subject</th>
                    <th className="px-3.5 py-2.5">Room</th>
                    <th className="px-3.5 py-2.5">Invigilator</th>
                    <th className="px-3.5 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {examSchedules.filter((s) => s.examId === activeDateSheetExam.id).length > 0 ? (
                    examSchedules
                      .filter((s) => s.examId === activeDateSheetExam.id)
                      .map((slot) => {
                        const dayName = slot.date
                          ? new Date(slot.date).toLocaleDateString('en-US', { weekday: 'short' })
                          : '';

                        return (
                          <tr key={slot.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <td className="px-3.5 py-2.5 font-bold text-slate-900 dark:text-white">
                              {slot.date} {dayName ? `(${dayName})` : ''}
                            </td>
                            <td className="px-3.5 py-2.5 text-slate-600 dark:text-slate-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{slot.startTime} - {slot.endTime}</span>
                            </td>
                            <td className="px-3.5 py-2.5 font-semibold text-slate-800 dark:text-slate-200">
                              {slot.class}
                            </td>
                            <td className="px-3.5 py-2.5 font-bold text-blue-600 dark:text-blue-400">
                              {slot.subject}
                            </td>
                            <td className="px-3.5 py-2.5 text-slate-600 dark:text-slate-400">
                              {slot.roomNumber}
                            </td>
                            <td className="px-3.5 py-2.5 text-slate-600 dark:text-slate-400">
                              {slot.invigilator || 'Staff Member'}
                            </td>
                            <td className="px-3.5 py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => deleteExamSchedule(slot.id)}
                                title="Remove slot"
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        No subject papers scheduled yet for this examination. Click &quot;Add Subject Paper&quot; above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Quick Add Slot Drawer inside modal */}
            {isAddSlotOpen && (
              <form onSubmit={handleAddScheduleSlot} className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-blue-200 dark:border-blue-900 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  Add Exam Subject Paper
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Class
                    </label>
                    <select
                      value={newSlotClass}
                      onChange={(e) => setNewSlotClass(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    >
                      {availableClassNames.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      required
                      value={newSlotSubject}
                      onChange={(e) => setNewSlotSubject(e.target.value)}
                      placeholder="e.g. Mathematics"
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={newSlotDate}
                      onChange={(e) => setNewSlotDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Start Time
                    </label>
                    <input
                      type="text"
                      value={newSlotStartTime}
                      onChange={(e) => setNewSlotStartTime(e.target.value)}
                      placeholder="09:00 AM"
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      End Time
                    </label>
                    <input
                      type="text"
                      value={newSlotEndTime}
                      onChange={(e) => setNewSlotEndTime(e.target.value)}
                      placeholder="12:00 PM"
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Room / Hall
                    </label>
                    <input
                      type="text"
                      value={newSlotRoom}
                      onChange={(e) => setNewSlotRoom(e.target.value)}
                      placeholder="Exam Hall A"
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Invigilator
                    </label>
                    <input
                      type="text"
                      value={newSlotInvigilator}
                      onChange={(e) => setNewSlotInvigilator(e.target.value)}
                      placeholder="Faculty Member"
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddSlotOpen(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs"
                  >
                    Save Slot
                  </button>
                </div>
              </form>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
