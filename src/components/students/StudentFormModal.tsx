import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Student } from '../../types/erp';
import { useERPData } from '../../context/ERPDataContext';
import { Avatar } from '../common/Avatar';
import {
  User,
  GraduationCap,
  Users,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Heart,
  Bus,
  Shield,
  ArrowRight,
  ArrowLeft,
  Check,
  Upload,
  Camera,
  Trash2,
  CreditCard,
  Briefcase,
} from 'lucide-react';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentToEdit?: Student | null;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  studentToEdit,
}) => {
  const { addStudent, updateStudent, classes, transportRoutes, showToast } = useERPData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available class list (from classes list or standard fallback defaults)
  const availableClasses = classes.length > 0
    ? classes.map((c) => c.name)
    : [
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
      ];

  const [formData, setFormData] = useState<Partial<Student>>({
    admissionNo: `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
    rollNumber: String(Math.floor(10 + Math.random() * 40)),
    firstName: '',
    lastName: '',
    cnicOrBForm: '',
    gender: 'Male',
    dateOfBirth: '2012-05-15',
    class: availableClasses[0] || 'Grade 10',
    section: 'A',
    photoUrl: '',
    monthlyFee: undefined,
    // Parent details
    parentName: '',
    parentRelation: 'Father',
    parentPhone: '',
    parentEmail: '',
    parentOccupation: '',
    fatherName: '',
    fatherCnic: '',
    fatherPhone: '',
    fatherOccupation: '',
    // General
    address: '',
    bloodGroup: 'O+',
    status: 'Active',
    transportRoute: 'None',
    emergencyContact: '',
    emergencyContactPerson: '',
  });

  const [activeTab, setActiveTab] = useState<'personal' | 'academic' | 'parent'>('personal');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [customClassMode, setCustomClassMode] = useState(false);

  // Reset or load data when modal opens or studentToEdit changes
  useEffect(() => {
    if (isOpen) {
      setFormErrors({});
      if (studentToEdit) {
        setFormData({ ...studentToEdit });
      } else {
        setFormData({
          admissionNo: `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
          rollNumber: String(Math.floor(10 + Math.random() * 40)),
          firstName: '',
          lastName: '',
          cnicOrBForm: '',
          gender: 'Male',
          dateOfBirth: '2012-05-15',
          class: availableClasses[0] || 'Grade 10',
          section: 'A',
          photoUrl: '',
          monthlyFee: undefined,
          parentName: '',
          parentRelation: 'Father',
          parentPhone: '',
          parentEmail: '',
          parentOccupation: '',
          fatherName: '',
          fatherCnic: '',
          fatherPhone: '',
          fatherOccupation: '',
          address: '',
          bloodGroup: 'O+',
          status: 'Active',
          transportRoute: 'None',
          emergencyContact: '',
          emergencyContactPerson: '',
        });
      }
      setActiveTab('personal');
    }
  }, [isOpen, studentToEdit, classes]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('File Too Large', 'Please upload a photo smaller than 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFormData((prev) => ({ ...prev, photoUrl: result }));
      showToast('Photo Uploaded', 'Student picture updated.');
    };
    reader.readAsDataURL(file);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.firstName?.trim()) {
      errors.firstName = 'First name is required.';
    }
    if (!formData.lastName?.trim()) {
      errors.lastName = 'Last name is required.';
    }
    if (!formData.class) {
      errors.class = 'Class selection is required.';
    }

    setFormErrors(errors);

    if (errors.firstName || errors.lastName) {
      setActiveTab('personal');
      showToast('Validation Error', 'Please provide student first and last name.', 'error');
      return false;
    }

    if (errors.class) {
      setActiveTab('academic');
      showToast('Validation Error', 'Please select a valid academic class.', 'error');
      return false;
    }

    return true;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!validateForm()) {
      return;
    }

    const trimmedFirstName = (formData.firstName || '').trim();
    const trimmedLastName = (formData.lastName || '').trim();

    // Derive parent name if not explicitly set
    const parentName = (formData.parentName || '').trim() || `${trimmedLastName} Guardian`;
    const parentPhone = (formData.parentPhone || '').trim();
    const parentRelation = formData.parentRelation || 'Father';
    const parentCnic = (formData.fatherCnic || '').trim();
    const parentOccupation = (formData.parentOccupation || formData.fatherOccupation || '').trim();

    const resolvedParentEmail =
      (formData.parentEmail || '').trim() ||
      (trimmedFirstName ? `${trimmedFirstName.toLowerCase()}.${trimmedLastName.toLowerCase()}@guardian.edu` : '');

    const resolvedAddress = (formData.address || '').trim() || 'Residential Campus Area';
    const resolvedEmergency =
      (formData.emergencyContact || '').trim() || parentPhone;

    const monthlyFee = formData.monthlyFee !== undefined && formData.monthlyFee !== null && !isNaN(Number(formData.monthlyFee))
      ? Number(formData.monthlyFee)
      : undefined;

    if (studentToEdit) {
      // Update existing student in ERP context
      updateStudent(studentToEdit.id, {
        ...formData,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        cnicOrBForm: (formData.cnicOrBForm || '').trim(),
        parentName: parentName,
        parentRelation: parentRelation,
        parentPhone: parentPhone,
        parentEmail: resolvedParentEmail,
        parentOccupation: parentOccupation,
        fatherName: parentRelation === 'Father' ? parentName : (formData.fatherName || parentName),
        fatherCnic: parentCnic,
        fatherPhone: parentPhone,
        fatherOccupation: parentOccupation,
        address: resolvedAddress,
        emergencyContact: resolvedEmergency,
        emergencyContactPerson: (formData.emergencyContactPerson || '').trim(),
        photoUrl: formData.photoUrl || '', // Clean: only uploaded photo
        monthlyFee: monthlyFee,
      });
    } else {
      // Create new student without automatic unsplash photo
      addStudent({
        admissionNo:
          (formData.admissionNo || '').trim() ||
          `ADM-${Date.now().toString().slice(-4)}`,
        rollNumber: (formData.rollNumber || '').trim() || '01',
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        cnicOrBForm: (formData.cnicOrBForm || '').trim(),
        gender: (formData.gender as any) || 'Male',
        dateOfBirth: formData.dateOfBirth || '2012-01-01',
        class: formData.class || availableClasses[0] || 'Grade 10',
        section: formData.section || 'A',
        parentName: parentName,
        parentRelation: parentRelation,
        parentPhone: parentPhone,
        parentEmail: resolvedParentEmail,
        parentOccupation: parentOccupation,
        fatherName: parentRelation === 'Father' ? parentName : (formData.fatherName || parentName),
        fatherCnic: parentCnic,
        fatherPhone: parentPhone,
        fatherOccupation: parentOccupation,
        address: resolvedAddress,
        bloodGroup: formData.bloodGroup || 'O+',
        status: (formData.status as any) || 'Active',
        photoUrl: formData.photoUrl || '', // Clean: only use photo if user uploaded one
        admissionDate: new Date().toISOString().split('T')[0],
        enrollmentDate: new Date().toISOString().split('T')[0],
        transportRoute: formData.transportRoute || 'None',
        emergencyContact: resolvedEmergency,
        emergencyContactPerson: (formData.emergencyContactPerson || '').trim(),
        attendanceRate: 100,
        feeStatus: 'Pending',
        monthlyFee: monthlyFee,
      });
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={studentToEdit ? 'Edit Student Profile' : 'Admit New Student'}
      subtitle="Complete student registration, CNIC/B-Form, parental data, and picture"
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {activeTab === 'academic' && (
              <button
                type="button"
                onClick={() => setActiveTab('personal')}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Personal</span>
              </button>
            )}
            {activeTab === 'parent' && (
              <button
                type="button"
                onClick={() => setActiveTab('academic')}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Academic</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>

            {activeTab !== 'parent' ? (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'personal') {
                    if (!formData.firstName?.trim() || !formData.lastName?.trim()) {
                      showToast('Required Fields', 'First and Last name must be entered before proceeding.', 'error');
                      return;
                    }
                    setActiveTab('academic');
                  } else if (activeTab === 'academic') {
                    setActiveTab('parent');
                  }
                }}
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : null}

            <button
              type="submit"
              form="student-admission-form"
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{studentToEdit ? 'Save Changes' : 'Complete Admission'}</span>
            </button>
          </div>
        </div>
      }
    >
      {/* Sub-tabs inside modal */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-5 gap-4 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('personal')}
          className={`pb-2.5 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'personal'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>1. Student Profile & CNIC</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('academic')}
          className={`pb-2.5 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'academic'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>2. Academic, Class & Fee</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('parent')}
          className={`pb-2.5 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'parent'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>3. Parent / Guardian Details</span>
        </button>
      </div>

      <form id="student-admission-form" onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        {activeTab === 'personal' && (
          <div className="space-y-4">
            {/* Student Photo Section */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Student Profile Picture (Upload)
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative">
                  <Avatar
                    name={`${formData.firstName || 'Student'} ${formData.lastName || ''}`}
                    src={formData.photoUrl}
                    size="xl"
                    className="ring-2 ring-blue-500/30"
                  />
                  {formData.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, photoUrl: '' }))}
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
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{formData.photoUrl ? 'Change Profile Picture' : 'Upload Profile Picture'}</span>
                    </button>
                    {formData.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, photoUrl: '' }))}
                        className="px-3 py-2 border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear Picture</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Upload photograph file from device (JPG, PNG). If not uploaded, student initials will be shown.
                  </p>
                </div>
              </div>
            </div>

            {/* Names and CNIC / B-Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="e.g. Muhammad / Alexander"
                  className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden ${
                    formErrors.firstName ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {formErrors.firstName && (
                  <p className="text-[11px] text-rose-500 mt-1">{formErrors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="e.g. Ali / Hayes"
                  className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden ${
                    formErrors.lastName ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {formErrors.lastName && (
                  <p className="text-[11px] text-rose-500 mt-1">{formErrors.lastName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Student CNIC / B-Form #
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={formData.cnicOrBForm || ''}
                    onChange={(e) => setFormData({ ...formData, cnicOrBForm: e.target.value })}
                    placeholder="e.g. 35202-1234567-1 / B-Form ID"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Gender
                </label>
                <select
                  value={formData.gender || 'Male'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
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
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Blood Group
                </label>
                <select
                  value={formData.bloodGroup || 'O+'}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Enrollment Status
                </label>
                <select
                  value={formData.status || 'Active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Graduated">Graduated</option>
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
                  placeholder="House # / Street, Sector or City"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'academic' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Admission / Student ID Number
              </label>
              <input
                type="text"
                value={formData.admissionNo || ''}
                onChange={(e) => setFormData({ ...formData, admissionNo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Roll Number
              </label>
              <input
                type="text"
                value={formData.rollNumber || ''}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                placeholder="e.g. 12"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Enrolled Class *
                </label>
                <button
                  type="button"
                  onClick={() => setCustomClassMode(!customClassMode)}
                  className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                >
                  {customClassMode ? 'Select from list' : 'Type custom class'}
                </button>
              </div>

              {customClassMode ? (
                <input
                  type="text"
                  value={formData.class || ''}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  placeholder="e.g. Nursery, Grade 1, Matric"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              ) : (
                <select
                  value={formData.class || availableClasses[0]}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {availableClasses.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Section
              </label>
              <select
                value={formData.section || 'A'}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Monthly Tuition Fee (PKR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rs.</span>
                <input
                  type="number"
                  min={0}
                  value={formData.monthlyFee ?? ''}
                  onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value === '' ? undefined : Number(e.target.value) })}
                  placeholder="Enter fee amount in PKR (e.g. 4500)"
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">No default fee. Admin enters custom agreed tuition fee.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Transport Bus Route (Optional)
              </label>
              <select
                value={formData.transportRoute || 'None'}
                onChange={(e) => setFormData({ ...formData, transportRoute: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="None">No School Transport (Self/Walking)</option>
                {transportRoutes.map((route) => (
                  <option key={route.id} value={route.routeName || route.name}>
                    {route.routeName || route.name} ({route.startPoint} - {route.endPoint})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeTab === 'parent' && (
          <div className="space-y-4">
            {/* Consolidated Parent / Guardian Details */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-4">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200 pb-2 border-b border-slate-200 dark:border-slate-700">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Parent / Guardian Information (Father or Mother)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Relationship *
                  </label>
                  <select
                    value={formData.parentRelation || 'Father'}
                    onChange={(e) => setFormData({ ...formData, parentRelation: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Legal Guardian</option>
                    <option value="Uncle">Uncle</option>
                    <option value="Grandparent">Grandparent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Parent Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.parentName || ''}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    placeholder="e.g. Aslam Ali / Fatima Bibi"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Parent CNIC / National ID
                  </label>
                  <input
                    type="text"
                    value={formData.fatherCnic || ''}
                    onChange={(e) => setFormData({ ...formData, fatherCnic: e.target.value })}
                    placeholder="e.g. 35202-1234567-1"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Parent Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.parentPhone || ''}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    placeholder="e.g. +92 300 1234567"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Parent Occupation / Profession
                  </label>
                  <input
                    type="text"
                    value={formData.parentOccupation || formData.fatherOccupation || ''}
                    onChange={(e) => setFormData({ ...formData, parentOccupation: e.target.value, fatherOccupation: e.target.value })}
                    placeholder="e.g. Businessman, Engineer, Teacher"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Parent Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.parentEmail || ''}
                    onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                    placeholder="parent@example.com"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Residential Address *
                  </label>
                  <textarea
                    rows={2}
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Complete residential address"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white resize-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Emergency Contact (Name & Phone)
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContact || ''}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="e.g. Aslam Ali: +92 321 9876543"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

