import React, { useState, useMemo } from 'react';
import { useERPData } from '../../context/ERPDataContext';
import { Student } from '../../types/erp';
import { PageHeader } from '../common/PageHeader';
import { DataTable, Column } from '../common/DataTable';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { StudentFormModal } from './StudentFormModal';
import { IdCardModal } from '../cards/IdCardModal';
import {
  Plus,
  Filter,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  GraduationCap,
  Users,
  Download,
  Printer,
  CreditCard,
} from 'lucide-react';

interface StudentsListProps {
  onSelectStudent: (student: Student) => void;
}

export const StudentsList: React.FC<StudentsListProps> = ({ onSelectStudent }) => {
  const { students, deleteStudent, classes, teachers, schoolSettings, showToast } = useERPData();

  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [cardStudent, setCardStudent] = useState<Student | null>(null);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedClass !== 'All' && s.class !== selectedClass) return false;
      if (selectedSection !== 'All' && s.section !== selectedSection) return false;
      if (selectedStatus !== 'All' && s.status !== selectedStatus) return false;
      if (selectedTeacher !== 'All') {
        const teacherObj = teachers.find((t) => t.name === selectedTeacher);
        if (teacherObj) {
          const teachesThisClass = teacherObj.assignedClasses.some((c) =>
            c.toLowerCase().includes(s.class.toLowerCase())
          );
          if (!teachesThisClass) return false;
        }
      }
      return true;
    });
  }, [students, selectedClass, selectedSection, selectedStatus, selectedTeacher, teachers]);

  const activeCount = students.filter((s) => s.status === 'Active').length;
  const femaleCount = students.filter((s) => s.gender === 'Female').length;
  const maleCount = students.filter((s) => s.gender === 'Male').length;

  const columns: Column<Student>[] = [
    {
      key: 'name',
      header: 'Student Name',
      accessor: (s) => (
        <div className="flex items-center gap-3">
          <Avatar
            name={`${s.firstName} ${s.lastName}`}
            src={s.photoUrl}
            size="sm"
          />
          <div>
            <p className="font-bold text-slate-900 dark:text-white">
              {s.firstName} {s.lastName}
            </p>
            <p className="text-xs text-slate-400">
              Adm: {s.admissionNo} • Roll: #{s.rollNumber}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'class',
      header: 'Class & Section',
      accessor: (s) => (
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {s.class} - {s.section}
        </span>
      ),
    },
    {
      key: 'parentName',
      header: 'Guardian & Contact',
      accessor: (s) => (
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            {s.parentName} ({s.parentRelation})
          </p>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Phone className="w-3 h-3" /> {s.parentPhone}
          </p>
        </div>
      ),
    },
    {
      key: 'bloodGroup',
      header: 'Blood Grp',
      accessor: (s) => (
        <Badge variant="neutral" size="sm">
          {s.bloodGroup}
        </Badge>
      ),
    },
    {
      key: 'transportRoute',
      header: 'Transport',
      accessor: (s) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {s.transportRoute || 'None'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (s) => (
        <Badge
          variant={
            s.status === 'Active'
              ? 'success'
              : s.status === 'Suspended'
              ? 'danger'
              : 'warning'
          }
          size="sm"
          dot
        >
          {s.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      accessor: (s) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setCardStudent(s)}
            title="Generate & Print Official ID Card"
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
          >
            <Printer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </button>
          <button
            onClick={() => onSelectStudent(s)}
            title="View 360° Student Profile"
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setStudentToEdit(s);
              setIsFormModalOpen(true);
            }}
            title="Edit Student Info"
            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setStudentToDelete(s)}
            title="Delete Student Record"
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Information Management"
        subtitle="Manage student admissions, profiles, academic records, and guardians"
        badge={<Badge variant="primary">{students.length} Total Enrolled</Badge>}
        actions={
          <button
            onClick={() => {
              setStudentToEdit(null);
              setIsFormModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Admit New Student</span>
          </button>
        }
      />

      {/* Quick Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Total Students</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{students.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Active Status</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Male Students</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{maleCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Female Students</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{femaleCount}</p>
          </div>
        </div>
      </div>

      {/* Main Students DataTable */}
      <DataTable
        title="Enrolled Students Directory"
        subtitle="Click any row to open full 360° academic profile"
        data={filteredStudents}
        columns={columns}
        keyExtractor={(s) => s.id}
        searchPlaceholder="Search by student name, roll number, admission ID..."
        onRowClick={(student) => onSelectStudent(student)}
        filters={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Class filter */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="All">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Section filter */}
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="All">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>

            {/* Teacher filter */}
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="All">All Teachers</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.name}>
                  Teacher: {t.name}
                </option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        }
        bulkActions={(selectedIds, clearSelection) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const target = students.find((s) => selectedIds.includes(s.id));
                if (target) {
                  setCardStudent(target);
                }
              }}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print ID Card</span>
            </button>
            <button
              onClick={() => {
                selectedIds.forEach((id) => deleteStudent(id));
                clearSelection();
                showToast('Batch Deleted', `Deleted ${selectedIds.length} student records.`);
              }}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold"
            >
              Delete Selected
            </button>
          </div>
        )}
      />

      {/* Printable ID Card Modal */}
      <IdCardModal
        isOpen={Boolean(cardStudent)}
        onClose={() => setCardStudent(null)}
        type="student"
        data={cardStudent}
        settings={schoolSettings}
      />

      {/* Add / Edit Form Modal */}
      <StudentFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        studentToEdit={studentToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(studentToDelete)}
        onClose={() => setStudentToDelete(null)}
        onConfirm={() => {
          if (studentToDelete) {
            deleteStudent(studentToDelete.id);
            showToast('Student Removed', `${studentToDelete.firstName} ${studentToDelete.lastName} was removed.`);
            setStudentToDelete(null);
          }
        }}
        title="Delete Student Record"
        message={`Are you sure you want to permanently delete the profile of ${studentToDelete?.firstName} ${studentToDelete?.lastName} (Admission #${studentToDelete?.admissionNo})? This action cannot be undone.`}
        variant="danger"
        confirmText="Yes, Delete Record"
      />
    </div>
  );
};
