import React, { useState, useMemo } from 'react';
import { useERPData } from '../../context/ERPDataContext';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../common/PageHeader';
import { Badge } from '../common/Badge';
import { Student, Teacher, Staff } from '../../types/erp';
import {
  Printer,
  Search,
  School,
  QrCode,
  Sparkles,
  Download,
  RotateCw,
  Layers,
  GraduationCap,
  Users,
  Briefcase,
  Droplets,
  Phone,
  Calendar,
  IdCard,
  CreditCard,
  Building,
  CheckCircle2,
  FileSpreadsheet,
  Award,
} from 'lucide-react';
import { CertificateGenerator } from './CertificateGenerator';
import { OfficialIdCard } from './OfficialIdCard';

type CardCategory = 'all' | 'students' | 'teachers' | 'staff' | 'certificates';
type CardOrientation = 'vertical' | 'horizontal';
type CardSide = 'front' | 'back' | 'both';

export const CardsView: React.FC = () => {
  const { students, teachers, staff, classes, schoolSettings, settings, showToast } = useERPData();
  const { currentUser } = useAuth();

  const [category, setCategory] = useState<CardCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [orientation, setOrientation] = useState<CardOrientation>('vertical');
  const [cardSide, setCardSide] = useState<CardSide>('front');

  // Dynamic class options derived directly from classes & section page
  const configuredClasses = Array.from(new Set(classes.map((c) => c.name)));
  const studentClasses = Array.from(new Set(students.map((s) => s.class))).filter(Boolean);
  const availableClasses = configuredClasses.length > 0 ? configuredClasses : studentClasses;

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedClass !== 'All' && s.class !== selectedClass) return false;
      if (selectedSection !== 'All' && s.section !== selectedSection) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
        (s.admissionNo && s.admissionNo.toLowerCase().includes(q)) ||
        (s.fatherName && s.fatherName.toLowerCase().includes(q)) ||
        (s.parentName && s.parentName.toLowerCase().includes(q)) ||
        (s.cnicOrBForm && s.cnicOrBForm.toLowerCase().includes(q))
      );
    });
  }, [students, selectedClass, selectedSection, searchQuery]);

  // Filter teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      if (selectedDepartment !== 'All' && t.department !== selectedDepartment) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        (t.employeeId && t.employeeId.toLowerCase().includes(q)) ||
        (t.subject && t.subject.toLowerCase().includes(q)) ||
        (t.cnic && t.cnic.toLowerCase().includes(q)) ||
        (t.phone && t.phone.toLowerCase().includes(q))
      );
    });
  }, [teachers, selectedDepartment, searchQuery]);

  // Filter staff
  const filteredStaff = useMemo(() => {
    return staff.filter((st) => {
      if (selectedDepartment !== 'All' && st.department !== selectedDepartment) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        st.name.toLowerCase().includes(q) ||
        (st.employeeId && st.employeeId.toLowerCase().includes(q)) ||
        (st.role && st.role.toLowerCase().includes(q)) ||
        (st.cnic && st.cnic.toLowerCase().includes(q))
      );
    });
  }, [staff, selectedDepartment, searchQuery]);

  const activeTotal =
    (category === 'all' || category === 'students' ? filteredStudents.length : 0) +
    (category === 'all' || category === 'teachers' ? filteredTeachers.length : 0) +
    (category === 'all' || category === 'staff' ? filteredStaff.length : 0);

  const handlePrint = () => {
    window.print();
  };

  const schoolName = schoolSettings.schoolName || settings.schoolName || '';
  const schoolLogo = schoolSettings.logoUrl || settings.logoUrl || '';
  const affiliationNumber = schoolSettings.affiliationNumber || schoolSettings.schoolCode || '';
  const registrationNumber = schoolSettings.registrationNumber || '';
  const sessionYear = schoolSettings.currentSession || settings.currentSession || '';
  const schoolPhone = schoolSettings.phone || settings.phone || '';
  const schoolAddress = schoolSettings.address || settings.address || '';
  const schoolEmail = schoolSettings.email || settings.email || '';

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Screen Only: Header and Controls */}
      <div className="print:hidden space-y-4">
        <PageHeader
          title="Identity Cards Generator"
          subtitle="Official institutional ID cards for students, certified teachers, and administrative faculty"
          badge={<Badge variant="primary">{activeTotal} Cards Ready</Badge>}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print ID Cards Sheet</span>
              </button>
            </div>
          }
        />

        {/* Filter Bar & Controls */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  category === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                All Cards ({students.length + teachers.length + staff.length})
              </button>
              <button
                onClick={() => setCategory('students')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  category === 'students'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Students ({students.length})</span>
              </button>
              <button
                onClick={() => setCategory('teachers')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  category === 'teachers'
                    ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Faculty ({teachers.length})</span>
              </button>
              <button
                onClick={() => setCategory('staff')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  category === 'staff'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Staff ({staff.length})</span>
              </button>
              <button
                onClick={() => setCategory('certificates')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  category === 'certificates'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Official Certificates</span>
              </button>
            </div>

            {/* Layout Toggles */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                <button
                  onClick={() => setOrientation('vertical')}
                  className={`px-2.5 py-1 rounded-md font-medium ${
                    orientation === 'vertical'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  Vertical Badge
                </button>
                <button
                  onClick={() => setOrientation('horizontal')}
                  className={`px-2.5 py-1 rounded-md font-medium ${
                    orientation === 'horizontal'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  Horizontal Card
                </button>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                <button
                  onClick={() => setCardSide('front')}
                  className={`px-2.5 py-1 rounded-md font-medium ${
                    cardSide === 'front'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  Front
                </button>
                <button
                  onClick={() => setCardSide('back')}
                  className={`px-2.5 py-1 rounded-md font-medium ${
                    cardSide === 'back'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  Back
                </button>
                <button
                  onClick={() => setCardSide('both')}
                  className={`px-2.5 py-1 rounded-md font-medium ${
                    cardSide === 'both'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  Both Sides
                </button>
              </div>
            </div>
          </div>

          {/* Search and Dropdown Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, roll no, employee ID, CNIC..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {(category === 'all' || category === 'students') && (
              <div>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden"
                >
                  <option value="All">All Classes (From Classes Page)</option>
                  {availableClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(category === 'teachers' || category === 'staff') && (
              <div>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden"
                >
                  <option value="All">All Departments</option>
                  <option value="Science">Science</option>
                  <option value="Languages">Languages</option>
                  <option value="Humanities">Humanities</option>
                  <option value="Commerce">Commerce</option>
                  <option value="Administration">Administration</option>
                  <option value="Finance">Finance</option>
                  <option value="Arts & Sports">Arts & Sports</option>
                </select>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 sm:justify-end gap-2">
              <span>Showing <strong>{activeTotal}</strong> cards</span>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedClass('All');
                  setSelectedSection('All');
                  setSelectedDepartment('All');
                }}
                className="text-indigo-600 hover:underline cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Certificates or Cards Display */}
      {category === 'certificates' ? (
        <CertificateGenerator />
      ) : (
        <div className="id-cards-print-container">
          {activeTotal === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-800">
            <IdCard className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="font-bold text-base text-slate-800 dark:text-white">No Identity Cards Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              No students or faculty members match your selected filter criteria. Try adjusting the search query or class selector.
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-6 ${
              orientation === 'vertical'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
            } print:grid-cols-2 print:gap-4 print:p-0`}
          >
            {/* Student Cards */}
            {(category === 'all' || category === 'students') &&
              filteredStudents.map((s) => (
                <StudentCardItem
                  key={`std-${s.id}`}
                  student={s}
                  schoolName={schoolName}
                  schoolLogo={schoolLogo}
                  affiliationNumber={affiliationNumber}
                  registrationNumber={registrationNumber}
                  sessionYear={sessionYear}
                  schoolPhone={schoolPhone}
                  schoolAddress={schoolAddress}
                  orientation={orientation}
                  cardSide={cardSide}
                />
              ))}

            {/* Teacher Cards */}
            {(category === 'all' || category === 'teachers') &&
              filteredTeachers.map((t) => (
                <TeacherCardItem
                  key={`tch-${t.id}`}
                  teacher={t}
                  schoolName={schoolName}
                  schoolLogo={schoolLogo}
                  affiliationNumber={affiliationNumber}
                  registrationNumber={registrationNumber}
                  sessionYear={sessionYear}
                  schoolPhone={schoolPhone}
                  schoolAddress={schoolAddress}
                  orientation={orientation}
                  cardSide={cardSide}
                />
              ))}

            {/* Staff Cards */}
            {(category === 'all' || category === 'staff') &&
              filteredStaff.map((st) => (
                <StaffCardItem
                  key={`stf-${st.id}`}
                  staff={st}
                  schoolName={schoolName}
                  schoolLogo={schoolLogo}
                  affiliationNumber={affiliationNumber}
                  registrationNumber={registrationNumber}
                  sessionYear={sessionYear}
                  schoolPhone={schoolPhone}
                  schoolAddress={schoolAddress}
                  orientation={orientation}
                  cardSide={cardSide}
                />
              ))}
          </div>
        )}
      </div>
      )}

      {/* Print Instructions Footer */}
      {category !== 'certificates' && (
        <div className="print:hidden bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Cards are formatted to standard CR80 / PVC badge scale (300 DPI ready for high-resolution thermal badge printers and A4 card sheets).</span>
          </div>
          <button
            onClick={handlePrint}
            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-semibold cursor-pointer"
          >
            Open Print Dialog &rarr;
          </button>
        </div>
      )}
    </div>
  );
};

/* ========================================================================== */
/* STUDENT CARD ITEM                                                          */
/* ========================================================================== */
interface StudentCardProps {
  student: Student;
  schoolName: string;
  schoolLogo: string;
  affiliationNumber: string;
  registrationNumber: string;
  sessionYear: string;
  schoolPhone: string;
  schoolAddress: string;
  orientation: CardOrientation;
  cardSide: CardSide;
}

const StudentCardItem: React.FC<StudentCardProps> = ({
  student,
  schoolName,
  schoolLogo,
  affiliationNumber,
  registrationNumber,
  sessionYear,
  schoolPhone,
  schoolAddress,
  orientation,
  cardSide,
}) => {
  const [flipped, setFlipped] = useState(false);
  const showBack = cardSide === 'back' || (cardSide !== 'front' && flipped);

  const cardWidthClass =
    orientation === 'vertical' ? 'w-full max-w-[340px]' : 'w-full max-w-[460px]';

  return (
    <div className={`mx-auto ${cardWidthClass} print:w-[320px] print:max-w-none print:break-inside-avoid print:mb-4`}>
      <div className="relative group">
        {/* Flip button for screen view */}
        <button
          onClick={() => setFlipped(!flipped)}
          title="Flip Card"
          className="print:hidden absolute top-2 right-2 z-20 p-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-md text-slate-600 hover:text-indigo-600 dark:text-slate-300 transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        {cardSide === 'both' ? (
          <div className="space-y-4">
            <StudentFrontFace
              student={student}
              schoolName={schoolName}
              schoolLogo={schoolLogo}
              affiliationNumber={affiliationNumber}
              registrationNumber={registrationNumber}
              sessionYear={sessionYear}
              orientation={orientation}
            />
            <CardBackFace
              name={`${student.firstName} ${student.lastName}`}
              idNumber={student.admissionNumber || student.rollNumber}
              roleTitle="STUDENT"
              bloodGroup={student.bloodGroup}
              schoolName={schoolName}
              schoolPhone={schoolPhone}
              schoolAddress={schoolAddress}
              emergencyContact={student.emergencyContact || student.fatherPhone}
              orientation={orientation}
            />
          </div>
        ) : showBack ? (
          <CardBackFace
            name={`${student.firstName} ${student.lastName}`}
            idNumber={student.admissionNumber || student.rollNumber}
            roleTitle="STUDENT"
            bloodGroup={student.bloodGroup}
            schoolName={schoolName}
            schoolPhone={schoolPhone}
            schoolAddress={schoolAddress}
            emergencyContact={student.emergencyContact || student.fatherPhone}
            orientation={orientation}
          />
        ) : orientation === 'vertical' ? (
          <OfficialIdCard
            type="student"
            data={student}
            settings={{
              schoolName,
              logoUrl: schoolLogo,
              affiliationNumber,
              registrationNumber,
              currentSession: sessionYear,
              phone: schoolPhone,
              address: schoolAddress,
            }}
          />
        ) : (
          <StudentFrontFace
            student={student}
            schoolName={schoolName}
            schoolLogo={schoolLogo}
            affiliationNumber={affiliationNumber}
            registrationNumber={registrationNumber}
            sessionYear={sessionYear}
            orientation={orientation}
          />
        )}
      </div>
    </div>
  );
};

const StudentFrontFace: React.FC<{
  student: Student;
  schoolName: string;
  schoolLogo: string;
  affiliationNumber: string;
  registrationNumber: string;
  sessionYear: string;
  orientation: CardOrientation;
}> = ({ student, schoolName, schoolLogo, affiliationNumber, registrationNumber, sessionYear, orientation }) => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border-2 border-slate-200 shadow-md text-slate-800 flex flex-col justify-between relative print:shadow-none print:border-slate-400">
      {/* Top School Header Ribbon */}
      <div className="bg-[#0B1E36] text-white p-3.5 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -mr-8 -mt-8 pointer-events-none" />
        <div className="flex items-center justify-center gap-2.5">
          {schoolLogo ? (
            <div className="w-9 h-9 rounded-lg bg-white p-0.5 shadow-sm shrink-0 flex items-center justify-center">
              <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              <School className="w-4 h-4" />
            </div>
          )}
          <div className="text-left overflow-hidden">
            <h3 className="font-extrabold text-[12.5px] leading-tight tracking-tight uppercase text-white truncate">
              {schoolName}
            </h3>
            <p className="text-[9.5px] text-emerald-300 font-medium tracking-wide">
              {registrationNumber} • Affiliated {affiliationNumber}
            </p>
          </div>
        </div>

        {/* Card Designation Pill */}
        <div className="mt-2 inline-block px-3 py-0.5 rounded-full bg-emerald-600 text-[10px] font-black tracking-widest uppercase text-white shadow-xs">
          STUDENT IDENTITY CARD
        </div>
      </div>

      {/* Main Student Bio Body */}
      <div className="p-4 flex flex-col items-center">
        {/* Student Photo */}
        <div className="relative mb-3">
          <div className="w-24 h-28 rounded-xl overflow-hidden border-2 border-indigo-600/60 bg-slate-100 shadow-sm flex items-center justify-center">
            {student.avatar ? (
              <img
                src={student.avatar}
                alt={`${student.firstName} ${student.lastName}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-slate-100 flex flex-col items-center justify-center text-indigo-400">
                <GraduationCap className="w-8 h-8" />
                <span className="text-[10px] font-bold mt-1 text-slate-500 uppercase">
                  {student.firstName[0]}
                  {student.lastName[0]}
                </span>
              </div>
            )}
          </div>
          {student.bloodGroup && (
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-rose-600 text-white font-bold text-[9px] rounded-md shadow-xs flex items-center gap-0.5">
              <Droplets className="w-2.5 h-2.5" />
              {student.bloodGroup}
            </span>
          )}
        </div>

        {/* Student Name */}
        <h4 className="font-extrabold text-base text-slate-900 tracking-tight text-center">
          {student.firstName} {student.lastName}
        </h4>
        <div className="flex items-center gap-2 mt-0.5 mb-3">
          <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-md text-[11px] font-bold">
            {student.class} - Sec {student.section}
          </span>
          <span className="text-xs font-semibold text-slate-500">
            Roll #{student.rollNumber || '01'}
          </span>
        </div>

        {/* Structured Credentials Grid */}
        <div className="w-full bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 text-[11px] space-y-1.5">
          <div className="flex justify-between border-b border-slate-200/60 pb-1">
            <span className="text-slate-500 font-medium">Father / Guardian:</span>
            <span className="font-bold text-slate-800 truncate max-w-[150px]">{student.fatherName || 'Guardian'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 pb-1">
            <span className="text-slate-500 font-medium">B-Form / CNIC:</span>
            <span className="font-bold text-slate-800 font-mono text-[10.5px]">{student.bFormNumber || student.cnic || 'N/A'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 pb-1">
            <span className="text-slate-500 font-medium">Admission No:</span>
            <span className="font-bold text-slate-800">{student.admissionNumber || 'ADM-001'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 pb-1">
            <span className="text-slate-500 font-medium">Date of Birth:</span>
            <span className="font-bold text-slate-800">{student.dateOfBirth || '2010-04-14'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Emergency No:</span>
            <span className="font-bold text-slate-800 font-mono text-[10.5px]">{student.emergencyContact || student.fatherPhone || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Card Footer Bar */}
      <div className="px-4 py-2.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1 text-slate-600 font-semibold">
          <QrCode className="w-3.5 h-3.5 text-slate-700" />
          <span>Session {sessionYear}</span>
        </div>
        <div className="text-right">
          <p className="font-serif italic font-bold text-slate-700 text-[10px] leading-tight">Principal</p>
          <p className="text-[8px] text-slate-400 uppercase tracking-wider font-semibold">Authorized Stamp</p>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================== */
/* TEACHER CARD ITEM                                                          */
/* ========================================================================== */
interface TeacherCardProps {
  teacher: Teacher;
  schoolName: string;
  schoolLogo: string;
  affiliationNumber: string;
  registrationNumber: string;
  sessionYear: string;
  schoolPhone: string;
  schoolAddress: string;
  orientation: CardOrientation;
  cardSide: CardSide;
}

const TeacherCardItem: React.FC<TeacherCardProps> = ({
  teacher,
  schoolName,
  schoolLogo,
  affiliationNumber,
  registrationNumber,
  sessionYear,
  schoolPhone,
  schoolAddress,
  orientation,
  cardSide,
}) => {
  const [flipped, setFlipped] = useState(false);
  const showBack = cardSide === 'back' || (cardSide !== 'front' && flipped);
  const cardWidthClass =
    orientation === 'vertical' ? 'w-full max-w-[340px]' : 'w-full max-w-[460px]';

  return (
    <div className={`mx-auto ${cardWidthClass} print:w-[320px] print:max-w-none print:break-inside-avoid print:mb-4`}>
      <div className="relative group">
        <button
          onClick={() => setFlipped(!flipped)}
          title="Flip Card"
          className="print:hidden absolute top-2 right-2 z-20 p-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-md text-slate-600 hover:text-indigo-600 dark:text-slate-300 transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        {cardSide === 'both' ? (
          <div className="space-y-4">
            <TeacherFrontFace
              teacher={teacher}
              schoolName={schoolName}
              schoolLogo={schoolLogo}
              affiliationNumber={affiliationNumber}
              registrationNumber={registrationNumber}
              sessionYear={sessionYear}
            />
            <CardBackFace
              name={teacher.name}
              idNumber={teacher.employeeId}
              roleTitle="TEACHER / FACULTY"
              bloodGroup={teacher.bloodGroup}
              schoolName={schoolName}
              schoolPhone={schoolPhone}
              schoolAddress={schoolAddress}
              emergencyContact={teacher.emergencyContact || teacher.phone}
              orientation={orientation}
            />
          </div>
        ) : showBack ? (
          <CardBackFace
            name={teacher.name}
            idNumber={teacher.employeeId}
            roleTitle="TEACHER / FACULTY"
            bloodGroup={teacher.bloodGroup}
            schoolName={schoolName}
            schoolPhone={schoolPhone}
            schoolAddress={schoolAddress}
            emergencyContact={teacher.emergencyContact || teacher.phone}
            orientation={orientation}
          />
        ) : orientation === 'vertical' ? (
          <OfficialIdCard
            type="teacher"
            data={teacher}
            settings={{
              schoolName,
              logoUrl: schoolLogo,
              affiliationNumber,
              registrationNumber,
              currentSession: sessionYear,
              phone: schoolPhone,
              address: schoolAddress,
            }}
          />
        ) : (
          <TeacherFrontFace
            teacher={teacher}
            schoolName={schoolName}
            schoolLogo={schoolLogo}
            affiliationNumber={affiliationNumber}
            registrationNumber={registrationNumber}
            sessionYear={sessionYear}
          />
        )}
      </div>
    </div>
  );
};

const TeacherFrontFace: React.FC<{
  teacher: Teacher;
  schoolName: string;
  schoolLogo: string;
  affiliationNumber: string;
  registrationNumber: string;
  sessionYear: string;
}> = ({ teacher, schoolName, schoolLogo, affiliationNumber, registrationNumber, sessionYear }) => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border-2 border-indigo-200 shadow-md text-slate-800 flex flex-col justify-between relative print:shadow-none print:border-slate-400">
      {/* Top Header Ribbon */}
      <div className="bg-[#1E1B4B] text-white p-3.5 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full -mr-8 -mt-8 pointer-events-none" />
        <div className="flex items-center justify-center gap-2.5">
          {schoolLogo ? (
            <div className="w-9 h-9 rounded-lg bg-white p-0.5 shadow-sm shrink-0 flex items-center justify-center">
              <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              <School className="w-4 h-4" />
            </div>
          )}
          <div className="text-left overflow-hidden">
            <h3 className="font-extrabold text-[12.5px] leading-tight tracking-tight uppercase text-white truncate">
              {schoolName}
            </h3>
            <p className="text-[9.5px] text-indigo-300 font-medium tracking-wide">
              {registrationNumber} • Affiliated {affiliationNumber}
            </p>
          </div>
        </div>

        <div className="mt-2 inline-block px-3 py-0.5 rounded-full bg-indigo-600 text-[10px] font-black tracking-widest uppercase text-white shadow-xs">
          OFFICIAL FACULTY CARD
        </div>
      </div>

      {/* Main Teacher Bio */}
      <div className="p-4 flex flex-col items-center">
        <div className="relative mb-3">
          <div className="w-24 h-28 rounded-xl overflow-hidden border-2 border-indigo-600/60 bg-slate-100 shadow-sm flex items-center justify-center">
            {teacher.avatar ? (
              <img src={teacher.avatar} alt={teacher.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-50 to-indigo-100 flex flex-col items-center justify-center text-purple-600">
                <Users className="w-8 h-8" />
                <span className="text-[10px] font-bold mt-1 text-slate-500 uppercase">
                  {teacher.name.split(' ').map((n) => n[0]).join('')}
                </span>
              </div>
            )}
          </div>
          {teacher.bloodGroup && (
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-rose-600 text-white font-bold text-[9px] rounded-md shadow-xs flex items-center gap-0.5">
              <Droplets className="w-2.5 h-2.5" />
              {teacher.bloodGroup}
            </span>
          )}
        </div>

        <h4 className="font-extrabold text-base text-slate-900 tracking-tight text-center">
          {teacher.name}
        </h4>
        <div className="flex items-center gap-2 mt-0.5 mb-3">
          <span className="px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-800 rounded-md text-[11px] font-bold">
            {teacher.subject} Specialist
          </span>
          <span className="text-xs font-semibold text-slate-500">{teacher.employeeId}</span>
        </div>

        {/* Structured Credentials Grid */}
        <div className="w-full bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 text-[11px] space-y-1.5">
          <div className="flex justify-between border-b border-slate-200/60 pb-1">
            <span className="text-slate-500 font-medium">Department:</span>
            <span className="font-bold text-slate-800">{teacher.department}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 pb-1">
            <span className="text-slate-500 font-medium">Qualification:</span>
            <span className="font-bold text-slate-800">{teacher.qualification || 'M.Sc., B.Ed'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 pb-1">
            <span className="text-slate-500 font-medium">National CNIC:</span>
            <span className="font-bold text-slate-800 font-mono text-[10.5px]">{teacher.cnic || 'N/A'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 pb-1">
            <span className="text-slate-500 font-medium">Joining Date:</span>
            <span className="font-bold text-slate-800">{teacher.joiningDate || '2023-08-15'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Contact Phone:</span>
            <span className="font-bold text-slate-800 font-mono text-[10.5px]">{teacher.phone || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-4 py-2.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1 text-slate-600 font-semibold">
          <QrCode className="w-3.5 h-3.5 text-slate-700" />
          <span>Valid {sessionYear}</span>
        </div>
        <div className="text-right">
          <p className="font-serif italic font-bold text-slate-700 text-[10px] leading-tight">Principal</p>
          <p className="text-[8px] text-slate-400 uppercase tracking-wider font-semibold">Verified Sign</p>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================== */
/* STAFF CARD ITEM                                                            */
/* ========================================================================== */
interface StaffCardProps {
  staff: Staff;
  schoolName: string;
  schoolLogo: string;
  affiliationNumber: string;
  registrationNumber: string;
  sessionYear: string;
  schoolPhone: string;
  schoolAddress: string;
  orientation: CardOrientation;
  cardSide: CardSide;
}

const StaffCardItem: React.FC<StaffCardProps> = ({
  staff,
  schoolName,
  schoolLogo,
  affiliationNumber,
  registrationNumber,
  sessionYear,
  schoolPhone,
  schoolAddress,
  orientation,
  cardSide,
}) => {
  const [flipped, setFlipped] = useState(false);
  const showBack = cardSide === 'back' || (cardSide !== 'front' && flipped);
  const cardWidthClass =
    orientation === 'vertical' ? 'w-full max-w-[340px]' : 'w-full max-w-[460px]';

  return (
    <div className={`mx-auto ${cardWidthClass} print:w-[320px] print:max-w-none print:break-inside-avoid print:mb-4`}>
      <div className="relative group">
        <button
          onClick={() => setFlipped(!flipped)}
          title="Flip Card"
          className="print:hidden absolute top-2 right-2 z-20 p-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-md text-slate-600 hover:text-indigo-600 dark:text-slate-300 transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        {cardSide === 'both' ? (
          <div className="space-y-4">
            <StaffFrontFace
              staff={staff}
              schoolName={schoolName}
              schoolLogo={schoolLogo}
              affiliationNumber={affiliationNumber}
              registrationNumber={registrationNumber}
              sessionYear={sessionYear}
            />
            <CardBackFace
              name={staff.name}
              idNumber={staff.employeeId}
              roleTitle={staff.role.toUpperCase()}
              bloodGroup={staff.bloodGroup}
              schoolName={schoolName}
              schoolPhone={schoolPhone}
              schoolAddress={schoolAddress}
              emergencyContact={staff.emergencyContact || staff.phone}
              orientation={orientation}
            />
          </div>
        ) : showBack ? (
          <CardBackFace
            name={staff.name}
            idNumber={staff.employeeId}
            roleTitle={staff.role.toUpperCase()}
            bloodGroup={staff.bloodGroup}
            schoolName={schoolName}
            schoolPhone={schoolPhone}
            schoolAddress={schoolAddress}
            emergencyContact={staff.emergencyContact || staff.phone}
            orientation={orientation}
          />
        ) : orientation === 'vertical' ? (
          <OfficialIdCard
            type="staff"
            data={staff}
            settings={{
              schoolName,
              logoUrl: schoolLogo,
              affiliationNumber,
              registrationNumber,
              currentSession: sessionYear,
              phone: schoolPhone,
              address: schoolAddress,
            }}
          />
        ) : (
          <StaffFrontFace
            staff={staff}
            schoolName={schoolName}
            schoolLogo={schoolLogo}
            affiliationNumber={affiliationNumber}
            registrationNumber={registrationNumber}
            sessionYear={sessionYear}
          />
        )}
      </div>
    </div>
  );
};

const StaffFrontFace: React.FC<{
  staff: Staff;
  schoolName: string;
  schoolLogo: string;
  affiliationNumber: string;
  registrationNumber: string;
  sessionYear: string;
}> = ({ staff, schoolName, schoolLogo, affiliationNumber, registrationNumber, sessionYear }) => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border-2 border-amber-200 shadow-md text-slate-800 flex flex-col justify-between relative print:shadow-none print:border-slate-400">
      <div className="bg-[#18181B] text-white p-3.5 text-center relative overflow-hidden">
        <div className="flex items-center justify-center gap-2.5">
          {schoolLogo ? (
            <div className="w-9 h-9 rounded-lg bg-white p-0.5 shadow-sm shrink-0 flex items-center justify-center">
              <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              <School className="w-4 h-4" />
            </div>
          )}
          <div className="text-left overflow-hidden">
            <h3 className="font-extrabold text-[12.5px] leading-tight tracking-tight uppercase text-white truncate">
              {schoolName}
            </h3>
            <p className="text-[9.5px] text-amber-300 font-medium tracking-wide">
              {registrationNumber} • Affiliated {affiliationNumber}
            </p>
          </div>
        </div>

        <div className="mt-2 inline-block px-3 py-0.5 rounded-full bg-amber-600 text-[10px] font-black tracking-widest uppercase text-white shadow-xs">
          ADMINISTRATIVE STAFF CARD
        </div>
      </div>

      <div className="p-4 flex flex-col items-center">
        <div className="relative mb-3">
          <div className="w-24 h-28 rounded-xl overflow-hidden border-2 border-amber-600/60 bg-slate-100 shadow-sm flex items-center justify-center">
            {staff.avatar ? (
              <img src={staff.avatar} alt={staff.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-50 to-slate-100 flex flex-col items-center justify-center text-amber-600">
                <Briefcase className="w-8 h-8" />
                <span className="text-[10px] font-bold mt-1 text-slate-500 uppercase">
                  {staff.name.split(' ').map((n) => n[0]).join('')}
                </span>
              </div>
            )}
          </div>
          {staff.bloodGroup && (
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-rose-600 text-white font-bold text-[9px] rounded-md shadow-xs flex items-center gap-0.5">
              <Droplets className="w-2.5 h-2.5" />
              {staff.bloodGroup}
            </span>
          )}
        </div>

        <h4 className="font-extrabold text-base text-slate-900 tracking-tight text-center">
          {staff.name}
        </h4>
        <div className="flex items-center gap-2 mt-0.5 mb-3">
          <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-[11px] font-bold">
            {staff.role}
          </span>
          <span className="text-xs font-semibold text-slate-500">{staff.employeeId}</span>
        </div>

        <div className="w-full bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 text-[11px] space-y-1.5">
          <div className="flex justify-between border-b border-slate-200/60 pb-1">
            <span className="text-slate-500 font-medium">Department:</span>
            <span className="font-bold text-slate-800">{staff.department}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 pb-1">
            <span className="text-slate-500 font-medium">National CNIC:</span>
            <span className="font-bold text-slate-800 font-mono text-[10.5px]">{staff.cnic || 'N/A'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 pb-1">
            <span className="text-slate-500 font-medium">Date of Joining:</span>
            <span className="font-bold text-slate-800">{staff.joiningDate || '2024-01-10'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Phone:</span>
            <span className="font-bold text-slate-800 font-mono text-[10.5px]">{staff.phone || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-2.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1 text-slate-600 font-semibold">
          <QrCode className="w-3.5 h-3.5 text-slate-700" />
          <span>Valid {sessionYear}</span>
        </div>
        <div className="text-right">
          <p className="font-serif italic font-bold text-slate-700 text-[10px] leading-tight">Principal</p>
          <p className="text-[8px] text-slate-400 uppercase tracking-wider font-semibold">Authorized</p>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================== */
/* UNIVERSAL CARD BACK FACE                                                   */
/* ========================================================================== */
const CardBackFace: React.FC<{
  name: string;
  idNumber: string;
  roleTitle: string;
  bloodGroup?: string;
  schoolName: string;
  schoolPhone: string;
  schoolAddress: string;
  emergencyContact?: string;
  orientation: CardOrientation;
}> = ({
  name,
  idNumber,
  roleTitle,
  bloodGroup,
  schoolName,
  schoolPhone,
  schoolAddress,
  emergencyContact,
}) => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border-2 border-slate-200 shadow-md text-slate-800 flex flex-col justify-between p-4 min-h-[380px] print:shadow-none print:border-slate-400">
      <div>
        <div className="border-b-2 border-slate-900 pb-2 mb-3 text-center">
          <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
            Terms & Institutional Rules
          </h4>
          <p className="text-[9px] text-slate-500 uppercase">{schoolName}</p>
        </div>

        <ul className="text-[10px] text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
          <li>This card remains the official property of {schoolName} and is strictly non-transferable.</li>
          <li>Must be visibly worn at all times within school premises, laboratories, and examination halls.</li>
          <li>Loss or damage must be immediately reported to the Administration Office for replacement.</li>
          <li>Misuse or alteration of this credential constitutes a violation of institutional discipline.</li>
        </ul>

        {bloodGroup && (
          <div className="mt-3 p-2 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-[10.5px]">
            <span className="font-bold text-rose-800 flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-rose-600" />
              Medical Emergency:
            </span>
            <span className="font-black text-rose-900 font-mono">Blood Group: {bloodGroup}</span>
          </div>
        )}

        <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-200 text-[9.5px] text-slate-600 space-y-0.5">
          <p className="font-bold text-slate-800">If Found, Please Return To:</p>
          <p>{schoolAddress}</p>
          <p className="font-mono">Helpline: {schoolPhone}</p>
          {emergencyContact && <p className="font-mono">Cardholder Emergency: {emergencyContact}</p>}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-200 flex items-end justify-between text-[9px] text-slate-400">
        <div>
          <p className="font-mono text-slate-500 font-bold">{idNumber}</p>
          <p className="text-[8px] uppercase">{roleTitle}</p>
        </div>
        <div className="text-right">
          <div className="w-20 border-b border-slate-400 mb-0.5" />
          <p className="font-serif italic font-bold text-slate-700 text-[10px]">Head of Institution</p>
        </div>
      </div>
    </div>
  );
};
