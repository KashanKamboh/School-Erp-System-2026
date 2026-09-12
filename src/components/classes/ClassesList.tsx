import React, { useState } from 'react';
import { useERPData } from '../../context/ERPDataContext';
import { useAuth } from '../../context/AuthContext';
import { ClassInfo } from '../../types/erp';
import { PageHeader } from '../common/PageHeader';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Building2,
  Users,
  Plus,
  BookOpen,
  MapPin,
  CheckCircle2,
  Sparkles,
  Edit,
  Trash2,
  Award,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';

const COMMON_GRADE_PRESETS = [
  'Playgroup',
  'Nursery',
  'Prep / KG',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11 (O-Level / F.Sc)',
  'Grade 12 (A-Level / ICS)',
];

const DEFAULT_SUBJECTS = [
  'English Language',
  'Urdu Language',
  'Mathematics',
  'General Science',
  'Islamiat / Ethics',
  'Pakistan Studies',
  'Computer Science',
];

export const ClassesList: React.FC = () => {
  const { classes, addClass, updateClass, deleteClass, teachers, showToast } = useERPData();
  const { hasModulePermission } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassInfo | null>(null);
  const [deletingClass, setDeletingClass] = useState<ClassInfo | null>(null);
  const [newSubjectInput, setNewSubjectInput] = useState('');

  const [formData, setFormData] = useState<Partial<ClassInfo>>({
    name: 'Grade 10',
    section: 'A',
    classTeacher: teachers[0]?.name || 'Dr. Alan Grant',
    capacity: 40,
    enrolledCount: 0,
    roomNumber: 'Room 101',
    subjects: [...DEFAULT_SUBJECTS],
  });

  const handleOpenAdd = () => {
    setEditingClass(null);
    setFormData({
      name: '',
      section: 'A',
      classTeacher: teachers[0]?.name || 'Dr. Alan Grant',
      capacity: 40,
      enrolledCount: 0,
      roomNumber: 'Room 101',
      subjects: [...DEFAULT_SUBJECTS],
    });
    setNewSubjectInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls: ClassInfo) => {
    setEditingClass(cls);
    setFormData({ ...cls, subjects: cls.subjects || [...DEFAULT_SUBJECTS] });
    setNewSubjectInput('');
    setIsModalOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      showToast('Validation Error', 'Class Grade name is required', 'error');
      return;
    }

    if (editingClass) {
      updateClass(editingClass.id, {
        name: formData.name.trim(),
        section: formData.section?.trim() || 'A',
        classTeacher: formData.classTeacher,
        classTeacherName: formData.classTeacher,
        capacity: formData.capacity || 40,
        roomNumber: formData.roomNumber || 'Room 101',
        subjects: formData.subjects || DEFAULT_SUBJECTS,
      });
      showToast('Class Updated', `${formData.name} Section ${formData.section} updated successfully.`);
    } else {
      const newClass: ClassInfo = {
        id: `cls-${Date.now()}`,
        name: formData.name.trim(),
        section: formData.section?.trim() || 'A',
        classTeacherId: teachers.find((t) => t.name === formData.classTeacher)?.id || 'tch-1',
        classTeacherName: formData.classTeacher || 'Dr. Alan Grant',
        classTeacher: formData.classTeacher || 'Dr. Alan Grant',
        capacity: formData.capacity || 40,
        currentEnrolled: formData.enrolledCount || 0,
        enrolledCount: formData.enrolledCount || 0,
        academicSession: '2025-2026',
        roomNumber: formData.roomNumber || 'Room 101',
        subjects: formData.subjects && formData.subjects.length > 0 ? formData.subjects : DEFAULT_SUBJECTS,
      };
      addClass(newClass);
      showToast('Class Created', `${newClass.name} - Section ${newClass.section} was added. This grade is now immediately available across Results, Report Cards, and Exams.`);
    }
    setIsModalOpen(false);
  };

  const handleAddSubject = () => {
    if (!newSubjectInput.trim()) return;
    const current = formData.subjects || [];
    if (!current.includes(newSubjectInput.trim())) {
      setFormData({ ...formData, subjects: [...current, newSubjectInput.trim()] });
    }
    setNewSubjectInput('');
  };

  const handleRemoveSubject = (subToRemove: string) => {
    const current = formData.subjects || [];
    setFormData({ ...formData, subjects: current.filter((s) => s !== subToRemove) });
  };

  const totalCapacity = classes.reduce((sum, c) => sum + (c.capacity || 0), 0);
  const totalEnrolled = classes.reduce((sum, c) => sum + (c.enrolledCount || c.currentEnrolled || 0), 0);
  const utilization = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classes & Section Management"
        subtitle="Organize academic batches, classroom allocations, curriculum subjects, and grading integration"
        badge={<Badge variant="primary">{classes.length} Active Batches</Badge>}
        actions={
          hasModulePermission('classes', 'create') ? (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Class Grade</span>
            </button>
          ) : undefined
        }
      />

      {/* Capacity Overview Metric */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <span>Overall Campus Student Capacity</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold">
              Live Synchronization
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {totalEnrolled} students enrolled across {totalCapacity} total seat capacity ({utilization}% utilization). All grades added here sync automatically to examinations and result cards.
          </p>
        </div>

        <div className="w-full sm:w-64">
          <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(utilization, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Official Grading Criteria Informational Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <Award className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Grading Scheme Configured for Classes & Results
            </h4>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Standard Pakistan Federal & Provincial Board Grading Rules
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
            <span className="block font-bold text-slate-900 dark:text-white">A+</span>
            <span className="text-[11px] text-emerald-600 font-bold">80% & Above</span>
            <span className="block text-[10px] text-slate-400">Outstanding</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
            <span className="block font-bold text-slate-900 dark:text-white">A</span>
            <span className="text-[11px] text-blue-600 font-bold">70% - 79%</span>
            <span className="block text-[10px] text-slate-400">Excellent</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
            <span className="block font-bold text-slate-900 dark:text-white">B</span>
            <span className="text-[11px] text-indigo-600 font-bold">60% - 69%</span>
            <span className="block text-[10px] text-slate-400">Very Good</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
            <span className="block font-bold text-slate-900 dark:text-white">C</span>
            <span className="text-[11px] text-amber-600 font-bold">50% - 59%</span>
            <span className="block text-[10px] text-slate-400">Good</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
            <span className="block font-bold text-slate-900 dark:text-white">D</span>
            <span className="text-[11px] text-orange-600 font-bold">40% - 49%</span>
            <span className="block text-[10px] text-slate-400">Satisfactory</span>
          </div>
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
            <span className="block font-bold text-rose-700 dark:text-rose-300">F</span>
            <span className="text-[11px] text-rose-600 font-bold">Below 40%</span>
            <span className="block text-[10px] text-rose-500">Fail / Repeat</span>
          </div>
        </div>
      </div>

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {classes.map((cls) => {
          const count = cls.enrolledCount || cls.currentEnrolled || 0;
          const cap = cls.capacity || 40;
          const percent = cap > 0 ? Math.round((count / cap) * 100) : 0;

          return (
            <div
              key={cls.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-slate-900 dark:text-white">
                        {cls.name} - Section {cls.section}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" /> {cls.roomNumber || 'Room 101'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(cls)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                      title="Edit Class / Subjects"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingClass(cls)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Remove Class"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400 font-medium">Class Mentor:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{cls.classTeacher || cls.classTeacherName || 'Not Assigned'}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400 font-medium">Enrolled Students:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {count} / {cap} Seats
                      </span>
                      <Badge variant={percent >= 90 ? 'warning' : 'success'} size="sm">
                        {percent}% Full
                      </Badge>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Subjects */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] uppercase font-bold text-slate-400">
                      Curriculum Subjects ({cls.subjects?.length || 0})
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(cls.subjects || DEFAULT_SUBJECTS).map((sub, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-[11px] rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Synced to Results
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(cls)}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Configure Grade</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Class Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass ? `Edit ${editingClass.name}` : 'Create New Class Grade'}
        subtitle="Define class grade, section, capacity, curriculum subjects, and mentor. Automatically available in Examination Results."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="class-form"
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
            >
              {editingClass ? 'Save Changes' : 'Create Class Grade'}
            </button>
          </div>
        }
      >
        <form id="class-form" onSubmit={handleSaveClass} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Class Grade Name *
            </label>
            <div className="space-y-2">
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Grade 1, Grade 5, Grade 11, Pre-Nursery..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400 font-medium">Quick suggestions:</span>
                {COMMON_GRADE_PRESETS.slice(3, 11).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setFormData({ ...formData, name: preset })}
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-600 dark:text-slate-300 text-[11px] cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Section Name *
              </label>
              <input
                type="text"
                required
                value={formData.section || ''}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                placeholder="e.g. A, B, C, Pink, Green..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Class Mentor / Assigned Teacher
              </label>
              <select
                value={formData.classTeacher || ''}
                onChange={(e) => setFormData({ ...formData, classTeacher: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name} ({t.subject})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Classroom Seat Capacity
              </label>
              <input
                type="number"
                min={1}
                value={formData.capacity || 40}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Room Number / Location
              </label>
              <input
                type="text"
                value={formData.roomNumber || 'Room 101'}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                placeholder="e.g. Room 204 (Wing B)"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Curriculum Subjects */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Curriculum Subjects (Assessed in Report Cards)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSubjectInput}
                onChange={(e) => setNewSubjectInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubject();
                  }
                }}
                placeholder="Add subject (e.g. Physics, Holy Quran, History...)"
                className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddSubject}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Add Subject
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 min-h-[44px]">
              {(formData.subjects || []).map((sub) => (
                <span
                  key={sub}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium"
                >
                  <span>{sub}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubject(sub)}
                    className="text-slate-400 hover:text-rose-600 cursor-pointer font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingClass)}
        onClose={() => setDeletingClass(null)}
        onConfirm={() => {
          if (deletingClass) {
            deleteClass(deletingClass.id);
            setDeletingClass(null);
          }
        }}
        title="Remove Class Section"
        message={`Are you sure you want to remove ${deletingClass?.name} - Section ${deletingClass?.section}? This will unassign the classroom record.`}
        variant="danger"
      />
    </div>
  );
};
