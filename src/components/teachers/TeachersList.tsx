import React, { useState, useMemo, useRef } from 'react';
import { useERPData } from '../../context/ERPDataContext';
import { Teacher } from '../../types/erp';
import { PageHeader } from '../common/PageHeader';
import { DataTable, Column } from '../common/DataTable';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { IdCardModal } from '../cards/IdCardModal';
import {
  Plus,
  Phone,
  Mail,
  BookOpen,
  Award,
  Trash2,
  Edit,
  GraduationCap,
  Calendar,
  Building,
  Eye,
  CheckCircle2,
  DollarSign,
  Briefcase,
  Users,
  Upload,
  CreditCard,
  MapPin,
  User,
  ShieldCheck,
  Heart,
  FileText,
  Printer,
} from 'lucide-react';

export const TeachersList: React.FC = () => {
  const { teachers, addTeacher, updateTeacher, deleteTeacher, classes, schoolSettings, showToast } = useERPData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'personal' | 'professional'>('personal');
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);
  const [selectedProfileTeacher, setSelectedProfileTeacher] = useState<Teacher | null>(null);
  const [cardTeacher, setCardTeacher] = useState<Teacher | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedGrade, setSelectedGrade] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  const [formData, setFormData] = useState<Partial<Teacher>>({
    employeeId: `EMP-${Math.floor(100 + Math.random() * 900)}`,
    name: '',
    cnic: '',
    email: '',
    phone: '',
    gender: 'Male',
    dateOfBirth: '1990-01-01',
    maritalStatus: 'Married',
    bloodGroup: 'O+',
    address: '',
    emergencyContact: '',
    emergencyContactPerson: '',
    subject: 'Mathematics',
    department: 'Science',
    qualification: 'M.Sc., B.Ed',
    experienceYears: 5,
    joiningDate: new Date().toISOString().split('T')[0],
    salary: undefined,
    status: 'Active',
    avatar: '',
    assignedClasses: ['Grade 10-A'],
  });

  const availableClassOptions = useMemo(() => {
    if (classes.length > 0) {
      return Array.from(new Set(classes.map((c) => `${c.name}-${c.section}`)));
    }
    return [
      'Grade 9-A',
      'Grade 9-B',
      'Grade 10-A',
      'Grade 10-B',
      'Grade 11-A',
      'Grade 11-B',
      'Grade 12-A',
      'Grade 12-B',
    ];
  }, [classes]);

  // Filtering
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      if (selectedDepartment !== 'All' && t.department !== selectedDepartment) return false;
      if (selectedStatus !== 'All' && t.status !== selectedStatus) return false;
      if (selectedGrade !== 'All') {
        const matchesGrade = t.assignedClasses?.some((c) =>
          c.toLowerCase().includes(selectedGrade.toLowerCase())
        );
        if (!matchesGrade) return false;
      }
      return true;
    });
  }, [teachers, selectedDepartment, selectedStatus, selectedGrade]);

  const activeFacultyCount = teachers.filter((t) => t.status === 'Active').length;
  const departmentsCount = new Set(teachers.map((t) => t.department || 'Science')).size;
  const avgSalary = Math.round(
    teachers.reduce((acc, t) => acc + (t.salary || 0), 0) / (teachers.length || 1)
  );

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) {
      showToast('File Too Large', 'Please select a photo smaller than 2.5MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData((prev) => ({ ...prev, avatar: base64 }));
      showToast('Photo Uploaded', 'Teacher picture updated successfully.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setModalTab('personal');
    setFormData({
      employeeId: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      cnic: '',
      email: '',
      phone: '',
      gender: 'Male',
      dateOfBirth: '1990-01-01',
      maritalStatus: 'Married',
      bloodGroup: 'O+',
      address: '',
      emergencyContact: '',
      emergencyContactPerson: '',
      subject: 'Mathematics',
      department: 'Science',
      qualification: 'M.Sc., B.Ed',
      experienceYears: 4,
      joiningDate: new Date().toISOString().split('T')[0],
      salary: undefined,
      status: 'Active',
      avatar: '',
      assignedClasses: ['Grade 10-A'],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setModalTab('personal');
    setFormData({ ...t });
    setIsModalOpen(true);
  };

  const toggleClassAssignment = (clsName: string) => {
    const current = formData.assignedClasses || [];
    if (current.includes(clsName)) {
      setFormData({
        ...formData,
        assignedClasses: current.filter((c) => c !== clsName),
      });
    } else {
      setFormData({
        ...formData,
        assignedClasses: [...current, clsName],
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.email?.trim()) {
      showToast('Validation Error', 'Full Name and Email Address are required.', 'error');
      return;
    }

    if (editingTeacher) {
      updateTeacher(editingTeacher.id, {
        ...formData,
        name: formData.name.trim(),
        cnic: (formData.cnic || '').trim(),
        email: formData.email.trim(),
        avatar: formData.avatar || '',
      });
    } else {
      const newTeacher: Teacher = {
        id: `tch-${Date.now()}`,
        employeeId: formData.employeeId || `EMP-${Date.now().toString().slice(-3)}`,
        name: formData.name.trim(),
        cnic: (formData.cnic || '').trim(),
        email: formData.email.trim(),
        phone: formData.phone || '',
        gender: formData.gender || 'Male',
        dateOfBirth: formData.dateOfBirth || '',
        maritalStatus: formData.maritalStatus || 'Single',
        bloodGroup: formData.bloodGroup || 'O+',
        address: formData.address || '',
        emergencyContact: formData.emergencyContact || '',
        emergencyContactPerson: formData.emergencyContactPerson || '',
        subject: formData.subject || 'Mathematics',
        department: formData.department || 'Science',
        qualification: formData.qualification || 'M.Sc., B.Ed',
        experienceYears: Number(formData.experienceYears) || 0,
        joiningDate: formData.joiningDate || new Date().toISOString().split('T')[0],
        salary: formData.salary !== undefined && formData.salary !== null ? Number(formData.salary) : 0,
        status: (formData.status as any) || 'Active',
        assignedClasses: formData.assignedClasses && formData.assignedClasses.length > 0
          ? formData.assignedClasses
          : ['Grade 10-A'],
        avatar: formData.avatar || '', // Clean: manual photo only, no automatic pictures
        attendanceRate: 100,
        leaveBalance: 18,
      };
      addTeacher(newTeacher);
    }
    setIsModalOpen(false);
  };

  const columns: Column<Teacher>[] = [
    {
      key: 'name',
      header: 'Faculty Member',
      accessor: (t) => (
        <div className="flex items-center gap-3">
          <Avatar name={t.name} src={t.avatar} size="sm" />
          <div>
            <p className="font-bold text-slate-900 dark:text-white">{t.name}</p>
            <p className="text-xs text-slate-400">
              ID: {t.employeeId} {t.cnic ? `• CNIC: ${t.cnic}` : ''}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Subject & Dept',
      accessor: (t) => (
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-200">{t.subject}</p>
          <p className="text-xs text-slate-400">{t.department} Dept</p>
        </div>
      ),
    },
    {
      key: 'assignedClasses',
      header: 'Class Allocation',
      accessor: (t) => (
        <div className="flex flex-wrap gap-1">
          {t.assignedClasses.map((cls, i) => (
            <Badge key={i} variant="primary" size="sm">
              {cls}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Contact Info',
      accessor: (t) => (
        <div className="text-xs">
          <p className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Mail className="w-3 h-3 text-slate-400" /> {t.email}
          </p>
          <p className="text-slate-400 flex items-center gap-1 mt-0.5">
            <Phone className="w-3 h-3 text-slate-400" /> {t.phone}
          </p>
        </div>
      ),
    },
    {
      key: 'salary',
      header: 'Monthly Base (PKR)',
      accessor: (t) => (
        <span className="font-bold text-slate-900 dark:text-white">
          Rs. {(t.salary || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (t) => (
        <Badge variant={t.status === 'Active' ? 'success' : 'neutral'} size="sm" dot>
          {t.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      accessor: (t) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSelectedProfileTeacher(t)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
            title="View Faculty Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCardTeacher(t)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
            title="Generate / Print Official ID Card"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(t)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
            title="Edit Teacher"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeletingTeacher(t)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Remove Teacher"
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
        title="Faculty & Teachers Directory"
        subtitle="Manage academic educators, department heads, allocations, and payroll profiles"
        badge={<Badge variant="primary">{teachers.length} Faculty Members</Badge>}
        actions={
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Faculty Member</span>
          </button>
        }
      />

      {/* Quick Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 shadow-2xs">
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Total Faculty</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{teachers.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 shadow-2xs">
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Active Status</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{activeFacultyCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 shadow-2xs">
          <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Departments</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{departmentsCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 shadow-2xs">
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Avg Monthly Base</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">Rs. {avgSalary.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Main DataTable */}
      <DataTable
        title="School Teaching Staff"
        subtitle="All certified faculty across Primary, Middle, and Senior wings"
        data={filteredTeachers}
        columns={columns}
        keyExtractor={(t) => t.id}
        onRowClick={(t) => setSelectedProfileTeacher(t)}
        searchPlaceholder="Search teacher name, subject, employee ID, department..."
        filters={
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="All">All Departments</option>
              <option value="Science">Science</option>
              <option value="Languages">Languages</option>
              <option value="Humanities">Humanities</option>
              <option value="Commerce">Commerce</option>
              <option value="Arts & Sports">Arts & Sports</option>
            </select>

            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="All">All Grades / Batches</option>
              {availableClassOptions.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        }
        bulkActions={(selectedTeachers) => (
          <button
            onClick={() => {
              if (selectedTeachers.length > 0) {
                const found = teachers.find((t) => t.id === selectedTeachers[0]);
                if (found) setCardTeacher(found);
              }
            }}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Generate Faculty Card ({selectedTeachers.length})</span>
          </button>
        )}
      />

      {/* Teacher Profile Preview Modal */}
      {selectedProfileTeacher && (
        <Modal
          isOpen={Boolean(selectedProfileTeacher)}
          onClose={() => setSelectedProfileTeacher(null)}
          title="Faculty Profile Overview"
          subtitle={`Institutional ID: ${selectedProfileTeacher.employeeId}`}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCardTeacher(selectedProfileTeacher)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Generate Official ID Card</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const t = selectedProfileTeacher;
                    setSelectedProfileTeacher(null);
                    handleOpenEdit(t);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Faculty & Salary</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProfileTeacher(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-5">
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              <Avatar name={selectedProfileTeacher.name} src={selectedProfileTeacher.avatar} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedProfileTeacher.name}
                  </h4>
                  {selectedProfileTeacher.cnic && (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] font-semibold">
                      CNIC: {selectedProfileTeacher.cnic}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedProfileTeacher.subject} Teacher • {selectedProfileTeacher.department} Department
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant={selectedProfileTeacher.status === 'Active' ? 'success' : 'neutral'} size="sm" dot>
                    {selectedProfileTeacher.status}
                  </Badge>
                  <span className="text-xs text-slate-400 font-medium">
                    Joined: {selectedProfileTeacher.joiningDate}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Email Address</p>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-1 truncate">{selectedProfileTeacher.email}</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Contact Phone</p>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">{selectedProfileTeacher.phone || 'N/A'}</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Academic Qualification</p>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">{selectedProfileTeacher.qualification}</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Base Compensation (PKR)</p>
                <p className="font-bold text-slate-900 dark:text-white mt-1">Rs. {(selectedProfileTeacher.salary || 0).toLocaleString()}/mo</p>
              </div>

              {selectedProfileTeacher.dateOfBirth && (
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">Date of Birth</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">{selectedProfileTeacher.dateOfBirth}</p>
                </div>
              )}
              {selectedProfileTeacher.bloodGroup && (
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">Blood Group</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">{selectedProfileTeacher.bloodGroup}</p>
                </div>
              )}
            </div>

            {(selectedProfileTeacher.emergencyContact || selectedProfileTeacher.address) && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                {selectedProfileTeacher.address && (
                  <p className="text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-700 dark:text-slate-200">Address:</span> {selectedProfileTeacher.address}
                  </p>
                )}
                {selectedProfileTeacher.emergencyContact && (
                  <p className="text-rose-600 dark:text-rose-400 font-medium">
                    <span className="font-bold">Emergency Contact:</span> {selectedProfileTeacher.emergencyContact} {selectedProfileTeacher.emergencyContactPerson ? `(${selectedProfileTeacher.emergencyContactPerson})` : ''}
                  </p>
                )}
              </div>
            )}

            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white mb-2">Assigned Class Batches</p>
              <div className="flex flex-wrap gap-2">
                {selectedProfileTeacher.assignedClasses.map((cls, i) => (
                  <span key={i} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-semibold">
                    {cls}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeacher ? 'Edit Faculty Details' : 'Register New Faculty Member'}
        subtitle="Credentials, CNIC, photograph, personal background, and classroom allocations"
        maxWidth="xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {modalTab === 'professional' && (
                <button
                  type="button"
                  onClick={() => setModalTab('personal')}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Back to Personal
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              {modalTab === 'personal' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!formData.name?.trim()) {
                      showToast('Validation Error', 'Full Name is required', 'error');
                      return;
                    }
                    setModalTab('professional');
                  }}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
                >
                  Next: Academic Details
                </button>
              ) : (
                <button
                  type="submit"
                  form="teacher-register-form"
                  className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
                >
                  {editingTeacher ? 'Save Changes' : 'Complete Faculty Registration'}
                </button>
              )}
            </div>
          </div>
        }
      >
        {/* Sub-tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-4 gap-4">
          <button
            type="button"
            onClick={() => setModalTab('personal')}
            className={`pb-2 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              modalTab === 'personal'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>1. Personal, CNIC & Photo</span>
          </button>
          <button
            type="button"
            onClick={() => setModalTab('professional')}
            className={`pb-2 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              modalTab === 'professional'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>2. Academic & Class Allocation</span>
          </button>
        </div>

        <form id="teacher-register-form" onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {modalTab === 'personal' && (
            <div className="space-y-4">
              {/* Photo Upload Section */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Faculty Picture / Photo (Optional)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative">
                    <Avatar
                      name={formData.name || 'Teacher'}
                      src={formData.avatar}
                      size="xl"
                      className="ring-2 ring-indigo-500/30"
                    />
                    {formData.avatar && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, avatar: '' }))}
                        className="absolute -top-1 -right-1 p-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
                        title="Remove Picture"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{formData.avatar ? 'Change Teacher Picture' : 'Upload Teacher Picture'}</span>
                      </button>
                      {formData.avatar && (
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, avatar: '' }))}
                          className="px-3 py-2 border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Clear Picture</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Upload teacher photo file (JPG, PNG). If blank, initials will be displayed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Prof. Marcus Brody / Dr. Aisha Khan"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    National ID / CNIC #
                  </label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={formData.cnic || ''}
                      onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                      placeholder="e.g. 35201-9876543-1"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="faculty@greenwood.edu"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+92 300 1234567"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Monthly Salary (PKR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rs.</span>
                    <input
                      type="number"
                      min={0}
                      value={formData.salary ?? ''}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value === '' ? undefined : Number(e.target.value) })}
                      placeholder="Enter salary in PKR (no default)"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">No default salary. Enter exact agreed amount.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender || 'Male'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Blood Group
                  </label>
                  <select
                    value={formData.bloodGroup || 'O+'}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Marital Status
                  </label>
                  <select
                    value={formData.maritalStatus || 'Single'}
                    onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value as 'Single' | 'Married' | 'Other' })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Residential Address
                  </label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street address, city, district"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Emergency Contact Number
                  </label>
                  <input
                    type="tel"
                    value={formData.emergencyContact || ''}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="Emergency phone number"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Emergency Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContactPerson || ''}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPerson: e.target.value })}
                    placeholder="e.g. Spouse / Brother / Parent"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2 p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Monthly Salary / Base Compensation (PKR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-600 dark:text-indigo-400">Rs.</span>
                    <input
                      type="number"
                      min={0}
                      value={formData.salary ?? ''}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value === '' ? undefined : Number(e.target.value) })}
                      placeholder="Enter teacher's agreed salary (e.g. 60000)"
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-xl text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Specify teacher's agreed monthly salary. No default is assigned.</p>
                </div>
              </div>
            </div>
          )}

          {modalTab === 'professional' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Employee ID / Institutional Code
                  </label>
                  <input
                    type="text"
                    value={formData.employeeId || ''}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder="e.g. EMP-201"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Subject Specialization *
                  </label>
                  <input
                    type="text"
                    value={formData.subject || ''}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. Mathematics, Physics, English"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department || 'Science'}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="Science">Science</option>
                    <option value="Languages">Languages</option>
                    <option value="Humanities">Humanities</option>
                    <option value="Commerce">Commerce</option>
                    <option value="Arts & Sports">Arts & Sports</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Qualification
                  </label>
                  <input
                    type="text"
                    value={formData.qualification || ''}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    placeholder="e.g. M.Sc., Ph.D, B.Ed, M.Phil"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.experienceYears ?? 4}
                    onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Monthly Salary (PKR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rs.</span>
                    <input
                      type="number"
                      min={0}
                      value={formData.salary ?? ''}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value === '' ? undefined : Number(e.target.value) })}
                      placeholder="Enter salary in PKR (e.g. 55000)"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">No default salary. Enter specific agreed amount.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Employment Status
                  </label>
                  <select
                    value={formData.status || 'Active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date of Joining
                  </label>
                  <input
                    type="date"
                    value={formData.joiningDate || ''}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Class Allocations (Select all applicable)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {availableClassOptions.map((cls) => {
                    const isSelected = formData.assignedClasses?.includes(cls);
                    return (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => toggleClassAssignment(cls)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <span>{cls}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingTeacher)}
        onClose={() => setDeletingTeacher(null)}
        onConfirm={() => {
          if (deletingTeacher) {
            deleteTeacher(deletingTeacher.id);
            showToast('Teacher Removed', `${deletingTeacher.name} was removed from staff records.`);
            setDeletingTeacher(null);
          }
        }}
        title="Remove Faculty Member"
        message={`Are you sure you want to remove ${deletingTeacher?.name} (${deletingTeacher?.employeeId})? This will unassign all linked classes.`}
        variant="danger"
      />

      {/* Official Faculty ID Card Modal */}
      {cardTeacher && (
        <IdCardModal
          isOpen={Boolean(cardTeacher)}
          onClose={() => setCardTeacher(null)}
          type="teacher"
          data={cardTeacher}
          schoolSettings={schoolSettings}
        />
      )}
    </div>
  );
};
