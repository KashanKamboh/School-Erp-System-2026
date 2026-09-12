import React, { useState, useEffect } from 'react';
import { useERPData } from '../../context/ERPDataContext';
import { useAuth } from '../../context/AuthContext';
import { Homework, Student } from '../../types/erp';
import { PageHeader } from '../common/PageHeader';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Avatar } from '../common/Avatar';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  BookOpen,
  Calendar,
  Clock,
  Plus,
  Paperclip,
  CheckCircle2,
  FileText,
  Users,
  Award,
  Trash2,
  Send,
  Check,
  AlertCircle,
  FileCheck,
  MessageSquare,
  Search,
} from 'lucide-react';

interface SubmissionItem {
  id: string;
  homeworkId: string;
  studentId: string;
  studentName: string;
  rollNumber?: string;
  submittedAt: string;
  fileAttachment?: string;
  status: 'Submitted' | 'Evaluated' | 'Pending';
  obtainedMarks?: number;
  maxMarks: number;
  teacherFeedback?: string;
}

export const HomeworkView: React.FC = () => {
  const {
    homeworks,
    students,
    classes,
    addHomework,
    deleteHomework,
    getHomeworkSubmissions,
    gradeHomeworkSubmission,
    submitHomework,
    showToast,
  } = useERPData();
  const { currentUser, hasModulePermission } = useAuth();

  const isTeacherOrAdmin =
    currentUser?.role === 'Super Admin' ||
    currentUser?.role === 'School Admin' ||
    currentUser?.role === 'Principal' ||
    currentUser?.role === 'Teacher';

  const isStudent = currentUser?.role === 'Student';

  const canCreateHomework = hasModulePermission('homework', 'create') || isTeacherOrAdmin;
  const canGradeHomework = hasModulePermission('homework', 'edit') || hasModulePermission('homework', 'approve') || isTeacherOrAdmin;

  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedClassFilter, setSelectedClassFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Submissions Modal State
  const [viewSubmissionsHw, setViewSubmissionsHw] = useState<Homework | null>(null);
  const [submissionsList, setSubmissionsList] = useState<SubmissionItem[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [gradingDrafts, setGradingDrafts] = useState<Record<string, { marks: number; feedback: string }>>({});
  const [savingGradeId, setSavingGradeId] = useState<string | null>(null);

  // Student Submission Modal
  const [submitHwTarget, setSubmitHwTarget] = useState<Homework | null>(null);
  const [studentSubmissionNotes, setStudentSubmissionNotes] = useState('');
  const [studentFileName, setStudentFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Homework Confirm
  const [deletingHwId, setDeletingHwId] = useState<string | null>(null);

  // Form State for Creating Homework
  const defaultClassName = classes[0]?.name || 'Grade 10';
  const [formData, setFormData] = useState<{
    title: string;
    subject: string;
    class: string;
    section: string;
    assignedDate: string;
    dueDate: string;
    description: string;
    maxPoints: number;
    attachmentName: string;
  }>({
    title: '',
    subject: 'Mathematics',
    class: defaultClassName,
    section: 'A',
    assignedDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    description: '',
    maxPoints: 50,
    attachmentName: 'Assignment_Guideline.pdf',
  });

  // Fetch submissions whenever review modal opens
  useEffect(() => {
    if (viewSubmissionsHw && getHomeworkSubmissions) {
      setIsLoadingSubmissions(true);
      getHomeworkSubmissions(viewSubmissionsHw.id)
        .then((subs) => {
          setSubmissionsList(subs || []);
          // Populate drafts with existing grades
          const drafts: Record<string, { marks: number; feedback: string }> = {};
          (subs || []).forEach((s) => {
            drafts[s.id] = {
              marks: s.obtainedMarks !== undefined ? s.obtainedMarks : viewSubmissionsHw.maxPoints || 50,
              feedback: s.teacherFeedback || '',
            };
          });
          setGradingDrafts(drafts);
        })
        .catch((err) => {
          console.error('Error fetching submissions:', err);
          setSubmissionsList([]);
        })
        .finally(() => {
          setIsLoadingSubmissions(false);
        });
    } else {
      setSubmissionsList([]);
      setGradingDrafts({});
    }
  }, [viewSubmissionsHw, getHomeworkSubmissions]);

  // Filtered Homework List
  const filtered = homeworks.filter((hw) => {
    if (selectedSubject !== 'All' && hw.subject !== selectedSubject) return false;
    if (selectedClassFilter !== 'All' && hw.class !== selectedClassFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = hw.title.toLowerCase().includes(q);
      const matchSub = hw.subject.toLowerCase().includes(q);
      const matchDesc = hw.description.toLowerCase().includes(q);
      if (!matchTitle && !matchSub && !matchDesc) return false;
    }
    return true;
  });

  // Unique Subjects for filter pills
  const availableSubjects = Array.from(
    new Set(['Mathematics', 'Physics', 'Chemistry', 'English Literature', 'Urdu Literature', 'Computer Science', 'Pakistan Studies', ...homeworks.map((h) => h.subject)])
  );

  // Unique Classes for dropdown filter
  const classOptions = Array.from(new Set([...classes.map((c) => c.name), 'Grade 10', 'Grade 9', 'Grade 8']));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      showToast('Validation Error', 'Title and instructions are required.', 'error');
      return;
    }

    const currentClassStudents = students.filter(
      (s) => s.class === formData.class && (!formData.section || s.section === formData.section)
    ).length;

    await addHomework({
      title: formData.title.trim(),
      subject: formData.subject,
      class: formData.class,
      section: formData.section || 'A',
      teacherName: currentUser?.name || 'Dr. Arthur Pendelton',
      assignedDate: formData.assignedDate,
      dueDate: formData.dueDate,
      description: formData.description.trim(),
      maxPoints: Number(formData.maxPoints) || 50,
      totalStudents: currentClassStudents > 0 ? currentClassStudents : 32,
      status: 'Active',
      attachments: formData.attachmentName ? [formData.attachmentName] : [],
    });

    setIsCreateModalOpen(false);
    setFormData({
      title: '',
      subject: 'Mathematics',
      class: defaultClassName,
      section: 'A',
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      description: '',
      maxPoints: 50,
      attachmentName: 'Assignment_Guideline.pdf',
    });
  };

  const handleSaveGrade = async (submissionId: string) => {
    const draft = gradingDrafts[submissionId];
    if (!draft) return;

    setSavingGradeId(submissionId);
    const success = await gradeHomeworkSubmission(submissionId, draft.marks, draft.feedback);
    setSavingGradeId(null);

    if (success) {
      setSubmissionsList((prev) =>
        prev.map((s) =>
          s.id === submissionId
            ? { ...s, obtainedMarks: draft.marks, teacherFeedback: draft.feedback, status: 'Evaluated' }
            : s
        )
      );
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitHwTarget) return;

    setIsSubmitting(true);
    const studentName = currentUser?.name || 'Student';
    const studentId = currentUser?.studentId || 'std-1';

    const success = await submitHomework({
      homeworkId: submitHwTarget.id,
      studentId,
      studentName,
      rollNumber: '101',
      fileAttachment: studentFileName.trim() || `${studentName.replace(/\s+/g, '_')}_solution.pdf`,
      teacherFeedback: studentSubmissionNotes,
      status: 'Submitted',
      maxMarks: submitHwTarget.maxPoints || 50,
    });

    setIsSubmitting(false);
    if (success) {
      setSubmitHwTarget(null);
      setStudentSubmissionNotes('');
      setStudentFileName('');
    }
  };

  const handleDeleteHwConfirm = async () => {
    if (!deletingHwId) return;
    await deleteHomework(deletingHwId);
    setDeletingHwId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homework & Assignment Portal"
        subtitle="Publish coursework assignments, track submissions, evaluate student work, and award marks"
        badge={<Badge variant="primary">{homeworks.length} Total Assignments</Badge>}
        actions={
          canCreateHomework ? (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Assignment</span>
            </button>
          ) : undefined
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assignments or topics..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Class Filter Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-slate-500 whitespace-nowrap">Class Filter:</span>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium"
            >
              <option value="All">All Classes</option>
              {classOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setSelectedSubject('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedSubject === 'All'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            All Subjects ({homeworks.length})
          </button>
          {availableSubjects.map((sub) => {
            const count = homeworks.filter((h) => h.subject === sub).length;
            return (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedSubject === sub
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {sub} {count > 0 && <span className="opacity-75">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Homework Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Homework Assignments Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {selectedSubject !== 'All' || selectedClassFilter !== 'All' || searchQuery
              ? 'Try adjusting your filters or search keywords.'
              : 'Click "Create New Assignment" to post the first homework task.'}
          </p>
          {canCreateHomework && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Assignment</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((hw) => {
            const isOverdue = new Date(hw.dueDate) < new Date();
            const progressPercent = Math.min(
              100,
              Math.round(((hw.submissionsCount || 0) / (hw.totalStudents || 32)) * 100)
            );

            return (
              <div
                key={hw.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="primary" size="sm">
                      {hw.subject}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                        {hw.class} {hw.section ? `• Sec ${hw.section}` : ''}
                      </span>
                      {canCreateHomework && (
                        <button
                          onClick={() => setDeletingHwId(hw.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          title="Delete Assignment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h4 className="font-bold text-base text-slate-900 dark:text-white mt-3 leading-snug">
                    {hw.title}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {hw.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> Assigned By:
                      </span>
                      <strong className="text-slate-700 dark:text-slate-300 font-medium">
                        {hw.teacherName || 'Faculty Member'}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> Due Date:
                      </span>
                      <strong
                        className={`font-semibold ${
                          isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {hw.dueDate} {isOverdue && '(Expired)'}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Award className="w-3.5 h-3.5 text-slate-400" /> Total Score:
                      </span>
                      <strong className="text-slate-900 dark:text-white font-semibold">
                        {hw.maxPoints || 50} Marks
                      </strong>
                    </div>

                    {/* Submission Progress */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-400 font-medium">Submissions:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {hw.submissionsCount || 0} / {hw.totalStudents || 32} Turned In
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setViewSubmissionsHw(hw)}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1.5 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    <span>Review Submissions ({hw.submissionsCount || 0})</span>
                  </button>

                  {isStudent && (
                    <button
                      onClick={() => setSubmitHwTarget(hw)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Turn In</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review & Grade Submissions Modal */}
      {viewSubmissionsHw && (
        <Modal
          isOpen={Boolean(viewSubmissionsHw)}
          onClose={() => setViewSubmissionsHw(null)}
          title={`Submissions: ${viewSubmissionsHw.title}`}
          subtitle={`${viewSubmissionsHw.subject} • ${viewSubmissionsHw.class} • Due: ${viewSubmissionsHw.dueDate} • Max Marks: ${viewSubmissionsHw.maxPoints || 50}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {isLoadingSubmissions ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                Loading submissions from database...
              </div>
            ) : submissionsList.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                <FileCheck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  No submissions recorded yet for this task.
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Students can turn in their assignments through their student portal.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {submissionsList.map((sub) => {
                  const draft = gradingDrafts[sub.id] || {
                    marks: sub.obtainedMarks !== undefined ? sub.obtainedMarks : viewSubmissionsHw.maxPoints || 50,
                    feedback: sub.teacherFeedback || '',
                  };
                  const isSaved = sub.status === 'Evaluated' && sub.obtainedMarks !== undefined;

                  return (
                    <div
                      key={sub.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 shadow-xs space-y-3 text-xs"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                        <div className="flex items-center gap-3">
                          <Avatar name={sub.studentName} size="sm" />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 dark:text-white">{sub.studentName}</p>
                              {sub.rollNumber && (
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 font-mono">
                                  Roll: {sub.rollNumber}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-400 text-[11px] flex items-center gap-2 mt-0.5">
                              <span>Submitted: {new Date(sub.submittedAt).toLocaleDateString()}</span>
                              {sub.fileAttachment && (
                                <span className="text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                                  <Paperclip className="w-3 h-3" /> {sub.fileAttachment}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div>
                          {isSaved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                              <Check className="w-3 h-3" /> Evaluated ({sub.obtainedMarks} / {sub.maxMarks})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                              <Clock className="w-3 h-3" /> Pending Evaluation
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Grading Controls (Teachers & Admins) */}
                      {canGradeHomework ? (
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-1">
                          <div className="sm:col-span-3">
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Marks (Max: {sub.maxMarks}):
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={sub.maxMarks}
                              value={draft.marks}
                              onChange={(e) =>
                                setGradingDrafts((prev) => ({
                                  ...prev,
                                  [sub.id]: { ...draft, marks: Number(e.target.value) },
                                }))
                              }
                              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold"
                            />
                          </div>

                          <div className="sm:col-span-7">
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Teacher Feedback & Remarks:
                            </label>
                            <input
                              type="text"
                              value={draft.feedback}
                              onChange={(e) =>
                                setGradingDrafts((prev) => ({
                                  ...prev,
                                  [sub.id]: { ...draft, feedback: e.target.value },
                                }))
                              }
                              placeholder="e.g. Excellent presentation and clear working..."
                              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                            />
                          </div>

                          <div className="sm:col-span-2 sm:pt-4">
                            <button
                              disabled={savingGradeId === sub.id}
                              onClick={() => handleSaveGrade(sub.id)}
                              className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
                            >
                              {savingGradeId === sub.id ? 'Saving...' : 'Save Grade'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg">
                          <p className="text-[11px] text-slate-500">
                            <strong>Feedback:</strong> {sub.teacherFeedback || 'No remarks entered yet.'}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Student Turn-In Modal */}
      {submitHwTarget && (
        <Modal
          isOpen={Boolean(submitHwTarget)}
          onClose={() => setSubmitHwTarget(null)}
          title={`Turn In Assignment: ${submitHwTarget.title}`}
          subtitle={`${submitHwTarget.subject} • Max Score: ${submitHwTarget.maxPoints || 50} Marks`}
          maxWidth="lg"
          footer={
            <>
              <button
                type="button"
                onClick={() => setSubmitHwTarget(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleStudentSubmit}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Uploading...' : 'Confirm Submission'}</span>
              </button>
            </>
          }
        >
          <form onSubmit={handleStudentSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/50">
              <h5 className="font-bold text-blue-900 dark:text-blue-300 text-xs mb-1">Instructions from Teacher</h5>
              <p className="text-blue-800 dark:text-blue-400 leading-relaxed text-[11px]">
                {submitHwTarget.description}
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Solution File / Document Name
              </label>
              <input
                type="text"
                value={studentFileName}
                onChange={(e) => setStudentFileName(e.target.value)}
                placeholder="e.g. My_Calculus_Exercise_Solution.pdf"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Standard PDF, DOCX, or scanned sheet file format accepted.
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Student Notes / Working Summary
              </label>
              <textarea
                rows={3}
                value={studentSubmissionNotes}
                onChange={(e) => setStudentSubmissionNotes(e.target.value)}
                placeholder="Add any commentary, solved steps, or questions for your instructor..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Create Homework Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Homework Assignment"
        subtitle="Publish coursework problems, attach syllabus guidelines, and set deadlines"
        maxWidth="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
            >
              Publish Assignment
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Assignment Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Chapter 4: Quadratic Equations & Factorization"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Subject *
              </label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
              >
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Class *
              </label>
              <select
                value={formData.class}
                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
              >
                {classOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Section
              </label>
              <select
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="All">All Sections</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Submission Due Date *
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Max Marks *
              </label>
              <input
                type="number"
                min={5}
                max={200}
                required
                value={formData.maxPoints}
                onChange={(e) => setFormData({ ...formData, maxPoints: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Attached Worksheet / Guideline Document
            </label>
            <input
              type="text"
              value={formData.attachmentName}
              onChange={(e) => setFormData({ ...formData, attachmentName: e.target.value })}
              placeholder="e.g. Exercise_4.2_Questions.pdf"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Instructions & Questions *
            </label>
            <textarea
              rows={4}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detail the questions, problems, or essay guidelines students must complete..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingHwId)}
        onClose={() => setDeletingHwId(null)}
        onConfirm={handleDeleteHwConfirm}
        title="Delete Homework Assignment"
        message="Are you sure you want to delete this homework assignment? All student submissions and grades linked to it will be permanently removed."
        confirmText="Delete Assignment"
        variant="danger"
      />
    </div>
  );
};
