import React from 'react';
import { SchoolSettings, Student, Teacher, Staff } from '../../types/erp';
import {
  User,
  Calendar,
  GraduationCap,
  Hash,
  MapPin,
  Phone,
  Globe,
  Mail,
  ShieldCheck,
  BookOpen,
  Award,
  IdCard,
} from 'lucide-react';

export interface OfficialIdCardProps {
  type: 'student' | 'teacher' | 'faculty' | 'staff';
  data: Student | Teacher | Staff;
  settings?: SchoolSettings;
  className?: string;
  cardId?: string;
}

export const OfficialIdCard: React.FC<OfficialIdCardProps> = ({
  type,
  data,
  settings,
  className = '',
  cardId = 'official-id-badge',
}) => {
  const isFaculty = type === 'teacher' || type === 'faculty' || type === 'staff';
  const isStudent = type === 'student';

  const student = isStudent ? (data as Student) : null;
  const teacher = isFaculty ? (data as Teacher) : null;

  const schoolName = settings?.schoolName || 'Academic Institution';
  const logoUrl = settings?.logoUrl;
  const phone = settings?.phone || '';
  const email = settings?.email || '';
  const website = settings?.website || '';
  const establishedYear = settings?.academicYear?.split('-')[0] || '2024';

  // Card details resolution
  const fullName = student
    ? `${student.firstName} ${student.lastName}`
    : teacher?.name || 'Faculty Member';

  const photo = student?.photoUrl || student?.avatar || teacher?.avatar || teacher?.photoUrl;
  const idNumber = student
    ? student.admissionNo || `STU-${student.rollNumber || '001'}`
    : teacher?.employeeId || `FAC-${teacher?.id?.slice(0, 5) || '101'}`;

  const fatherName = student
    ? student.fatherName || student.parentName || '—'
    : (teacher as any)?.fatherName || teacher?.emergencyContactPerson || '—';

  const dob = student?.dateOfBirth || teacher?.dateOfBirth || '—';
  const address = student?.address || teacher?.address || settings?.address || '—';

  // Faculty specific fields
  const designation = (teacher as any)?.designation || `${teacher?.subject || 'Faculty'} Mentor`.toUpperCase();
  const qualification = teacher?.qualification || 'M.A., B.Ed';

  // Student specific fields
  const studentGrade = student ? `${student.class} (${student.section || 'A'})` : 'Grade 10';
  const rollNumber = student?.rollNumber || '28';

  const validUntil = isFaculty ? '31 May 2026' : '31 March 2026';

  return (
    <div
      id={cardId}
      className={`relative w-[340px] sm:w-[360px] bg-white text-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 select-none print:shadow-none print:border print:m-0 ${className}`}
      style={{
        boxShadow: '0 10px 25px -5px rgba(11, 30, 72, 0.15), 0 8px 10px -6px rgba(11, 30, 72, 0.1)',
      }}
    >
      {/* 1. Card Top Header with Geometric Slant */}
      <div className="relative bg-[#0B1E48] text-white pt-4 pb-3 px-4 overflow-hidden">
        {/* Angular Accent Wedge (Gold for Student, Sky for Faculty) */}
        <div
          className={`absolute top-0 right-0 w-32 h-full opacity-90 transform skew-x-12 translate-x-8 ${
            isFaculty
              ? 'bg-gradient-to-l from-sky-400/80 to-blue-500/20'
              : 'bg-gradient-to-l from-amber-400/80 to-amber-500/20'
          }`}
        />

        {/* Decorative Golden / Cyan Slant Line */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-1.5 ${
            isFaculty
              ? 'bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-500'
              : 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500'
          }`}
        />

        <div className="relative z-10 flex items-center justify-between gap-3">
          {/* School Emblem / Logo */}
          <div className="w-11 h-11 rounded-full bg-white/10 border border-white/30 flex items-center justify-center p-1 shrink-0 backdrop-blur-xs">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain rounded-full" />
            ) : (
              <div className="w-full h-full rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-amber-300" />
              </div>
            )}
          </div>

          {/* School Titles */}
          <div className="text-right flex-1 min-w-0">
            <h3 className="text-xs sm:text-sm font-extrabold tracking-wide uppercase leading-tight line-clamp-1 text-white">
              {schoolName}
            </h3>
            <p className="text-[9px] sm:text-[10px] tracking-widest uppercase font-semibold text-amber-300 mt-0.5">
              {isFaculty ? 'INSPIRE | EMPOWER | EXCEL' : 'LEARN | GROW | SUCCEED'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Photo & Side Badges Section */}
      <div className="relative px-5 pt-4 pb-1">
        <div className="flex items-center justify-between">
          {/* Left Badge: ESTD Year */}
          <div className="flex flex-col items-center justify-center text-center w-20">
            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0B1E48]">
              <Award className="w-4 h-4 text-[#0B1E48]" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 mt-1 uppercase tracking-tight">
              ESTD. {establishedYear}
            </span>
          </div>

          {/* Center Portrait with White and Accent Ring */}
          <div className="relative -mt-1 z-10">
            <div
              className={`w-24 h-24 sm:w-26 sm:h-26 rounded-full p-1 bg-white shadow-md border-2 ${
                isFaculty ? 'border-sky-500' : 'border-amber-400'
              }`}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                {photo ? (
                  <img
                    src={photo}
                    alt={fullName}
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        fullName
                      )}&background=0B1E48&color=fff&size=150`;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#0B1E48] text-white font-bold text-xl">
                    {fullName.charAt(0)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Badge: ID No */}
          <div className="flex flex-col items-center justify-center text-center w-20">
            <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
              ID No.
            </span>
            <span className="text-[11px] font-extrabold text-[#0B1E48] mt-0.5 tracking-tight px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
              {idNumber}
            </span>
          </div>
        </div>

        {/* 3. Center Ribbon Banner */}
        <div className="relative flex justify-center -mt-2.5 z-20">
          <div className="relative flex items-center">
            {/* Left Ribbon Notch */}
            <div
              className={`w-3 h-6 ${
                isFaculty ? 'bg-sky-600' : 'bg-amber-500'
              } transform -skew-x-12 translate-x-1.5`}
            />

            {/* Main Center Banner */}
            <div className="bg-[#0B1E48] text-white px-7 py-1 shadow-md z-10 flex items-center justify-center">
              <span className="text-xs font-black tracking-widest uppercase">
                {isFaculty ? (type === 'staff' ? 'STAFF' : 'FACULTY') : 'STUDENT'}
              </span>
            </div>

            {/* Right Ribbon Notch */}
            <div
              className={`w-3 h-6 ${
                isFaculty ? 'bg-sky-600' : 'bg-amber-500'
              } transform skew-x-12 -translate-x-1.5`}
            />
          </div>
        </div>

        {/* 4. Full Name & Subtitle */}
        <div className="text-center mt-2.5 mb-3">
          <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase leading-tight">
            {fullName}
          </h4>
          {isFaculty && (
            <p className="text-[11px] font-bold text-sky-600 tracking-wider uppercase mt-0.5">
              {designation}
            </p>
          )}
        </div>

        {/* 5. Detail Rows with Blue Square Icon Badges */}
        <div className="space-y-1.5 text-[11px] px-1 sm:px-2">
          {/* Row 1: Father Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-md bg-[#0B1E48] text-white flex items-center justify-center shrink-0">
              <User className="w-3 h-3" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="font-semibold text-slate-600 shrink-0 w-24">
                Father's Name
              </span>
              <span className="font-bold text-slate-800 shrink-0">:</span>
              <span className="font-bold text-slate-900 truncate">
                {fatherName}
              </span>
            </div>
          </div>

          {/* Row 2: Date of Birth */}
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-md bg-[#0B1E48] text-white flex items-center justify-center shrink-0">
              <Calendar className="w-3 h-3" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="font-semibold text-slate-600 shrink-0 w-24">
                Date of Birth
              </span>
              <span className="font-bold text-slate-800 shrink-0">:</span>
              <span className="font-bold text-slate-900 truncate">{dob}</span>
            </div>
          </div>

          {/* Row 3: Class / Qualification */}
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-md bg-[#0B1E48] text-white flex items-center justify-center shrink-0">
              {isFaculty ? (
                <BookOpen className="w-3 h-3" />
              ) : (
                <GraduationCap className="w-3 h-3" />
              )}
            </div>
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="font-semibold text-slate-600 shrink-0 w-24">
                {isFaculty ? 'Qualification' : 'Class / Grade'}
              </span>
              <span className="font-bold text-slate-800 shrink-0">:</span>
              <span className="font-bold text-slate-900 truncate">
                {isFaculty ? qualification : studentGrade}
              </span>
            </div>
          </div>

          {/* Row 4: Roll No / Employee ID */}
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-md bg-[#0B1E48] text-white flex items-center justify-center shrink-0">
              <Hash className="w-3 h-3" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="font-semibold text-slate-600 shrink-0 w-24">
                {isFaculty ? 'Employee ID' : 'Roll No.'}
              </span>
              <span className="font-bold text-slate-800 shrink-0">:</span>
              <span className="font-bold text-slate-900 truncate">
                {isFaculty ? idNumber : rollNumber}
              </span>
            </div>
          </div>

          {/* Row 5: Address */}
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-md bg-[#0B1E48] text-white flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-3 h-3" />
            </div>
            <div className="flex items-start gap-1.5 min-w-0 flex-1">
              <span className="font-semibold text-slate-600 shrink-0 w-24">
                Address
              </span>
              <span className="font-bold text-slate-800 shrink-0">:</span>
              <span className="font-semibold text-slate-800 line-clamp-1 leading-snug">
                {address}
              </span>
            </div>
          </div>
        </div>

        {/* 6. Vector Barcode Graphic */}
        <div className="mt-3 pt-2 border-t border-slate-100 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center gap-[2px] h-7 w-48 bg-white px-2">
            {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 2, 1, 4, 2, 1, 3].map(
              (w, i) => (
                <div
                  key={i}
                  className="h-full bg-slate-900"
                  style={{ width: `${w}px` }}
                />
              )
            )}
          </div>
          <span className="text-[9px] tracking-widest text-slate-500 font-mono mt-0.5">
            *{idNumber.toUpperCase()}*
          </span>
        </div>

        {/* 7. Signatures & Validity Footer */}
        <div className="flex items-end justify-between mt-2 pt-2 pb-2 px-2 border-t border-slate-100">
          {/* Signature */}
          <div className="text-center">
            <span
              className="block font-serif italic text-sm text-slate-800 font-bold select-none"
              style={{ fontFamily: 'Georgia, cursive' }}
            >
              {isFaculty ? fullName.split(' ')[0] : (settings?.principalName || 'Principal')}
            </span>
            <div className="w-20 h-px bg-slate-300 mx-auto my-0.5" />
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              {isFaculty ? 'Faculty Sign' : 'Principal'}
            </span>
          </div>

          {/* Validity Badge */}
          <div className="flex items-center gap-1.5 text-right">
            <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0B1E48]">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
            </div>
            <div className="text-right">
              <span className="block text-[8px] font-semibold text-slate-400 uppercase leading-none">
                Valid Upto
              </span>
              <span className="text-[10px] font-bold text-slate-800 leading-tight">
                {validUntil}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 8. Bottom Footer Contact Banner */}
      <div className="bg-[#0B1E48] text-white py-2 px-3 text-[9px] font-medium flex items-center justify-between gap-2 border-t border-amber-400/30">
        <div className="flex items-center gap-1 truncate">
          <Phone className="w-2.5 h-2.5 text-amber-300 shrink-0" />
          <span className="truncate">{phone || 'Campus Reception'}</span>
        </div>
        <div className="flex items-center gap-1 truncate">
          <Globe className="w-2.5 h-2.5 text-amber-300 shrink-0" />
          <span className="truncate">{website ? website.replace(/^https?:\/\//, '') : 'Official ID'}</span>
        </div>
        <div className="flex items-center gap-1 truncate">
          <Mail className="w-2.5 h-2.5 text-amber-300 shrink-0" />
          <span className="truncate">{email || 'Verified Badge'}</span>
        </div>
      </div>
    </div>
  );
};
