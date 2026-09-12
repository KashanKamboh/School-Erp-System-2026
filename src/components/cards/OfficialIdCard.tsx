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
  Sparkles,
  BookText,
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

  // School metadata
  const schoolName = settings?.schoolName || (isFaculty ? 'NOVA RIDGE' : 'BRIGHT FUTURE');
  const schoolSubtitle = isFaculty ? 'GLOBAL SCHOOL' : 'INTERNATIONAL SCHOOL';
  const schoolTagline = isFaculty ? 'INSPIRE  |  EMPOWER  |  EXCEL' : 'LEARN  |  GROW  |  SUCCEED';
  const logoUrl = settings?.logoUrl;
  const phone = settings?.phone || (isFaculty ? '+91 98765 43210' : '+91 98765 43210');
  const email = settings?.email || (isFaculty ? 'info@novaridge.edu.in' : 'info@bfis.edu.in');
  const website = settings?.website || (isFaculty ? 'www.novaridge.edu.in' : 'www.brightfutureschool.edu.in');
  const establishedYear = settings?.academicYear?.split('-')[0] || (isFaculty ? '2021' : '2020');

  // Full Name
  const fullName = student
    ? `${student.firstName} ${student.lastName}`.trim() || 'ARYAN SHARMA'
    : teacher?.name || 'SNEHA VERMA';

  // Photo
  const photo = student?.photoUrl || student?.avatar || teacher?.avatar || teacher?.photoUrl;

  // ID Number
  const idNumber = student
    ? student.admissionNo || `BFIS${student.rollNumber ? `202500${student.rollNumber}` : '2025001'}`
    : teacher?.employeeId || `NRGS${teacher?.id ? `202500${teacher.id.slice(0, 2)}` : '20250078'}`;

  // Father / Guardian Name
  const fatherName = student
    ? student.fatherName || student.parentName || 'Rajesh Sharma'
    : (teacher as any)?.fatherName || teacher?.emergencyContactPerson || 'Rajesh Verma';

  // DOB
  const dob = student?.dateOfBirth || (isStudent ? '15 May 2010' : '22 September 1992');

  // Address
  const address = student?.address || teacher?.address || (isStudent ? '123, Green Park Road, New Delhi – 110016' : '45, Maple Street, Bangalore – 560001');

  // Specific fields
  const designation = (teacher as any)?.designation || (teacher?.subject ? `${teacher.subject.toUpperCase()} TEACHER` : 'ENGLISH TEACHER');
  const qualification = teacher?.qualification || 'M.A. (English)';
  const studentGrade = student?.class ? `${student.class}${student.section ? ` (${student.section})` : ''}` : 'VIII (8th)';
  const rollNumber = student?.rollNumber || '28';
  const employeeId = teacher?.employeeId || 'ENG1123';

  // Validity
  const validUntil = isFaculty ? '31 May 2026' : '31 March 2026';

  // Signature Name
  const signatureText = isFaculty ? (fullName.split(' ')[0] || 'Sneha') + ' ' + (fullName.split(' ')[1] || 'Verma') : (settings?.principalName || 'Sarang');

  return (
    <div
      id={cardId}
      className={`relative w-[340px] sm:w-[350px] bg-white text-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 select-none print:shadow-none print:border print:m-0 font-sans ${className}`}
      style={{
        boxShadow: '0 12px 30px -6px rgba(11, 37, 69, 0.2), 0 6px 12px -4px rgba(11, 37, 69, 0.1)',
      }}
    >
      {/* ==================================================================== */}
      {/* 1. TOP HEADER WITH GEOMETRIC ANGULAR ACCENTS                          */}
      {/* ==================================================================== */}
      <div className="relative bg-[#0D254C] text-white pt-4 pb-12 px-4 overflow-hidden">
        {/* Angular Accent Wings on bottom header */}
        <div
          className={`absolute -bottom-6 -right-6 w-36 h-20 transform -rotate-12 ${
            isFaculty ? 'bg-[#0284C7]' : 'bg-[#EAB308]'
          }`}
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 25% 100%)' }}
        />
        <div
          className={`absolute -bottom-6 -left-6 w-36 h-20 transform rotate-12 ${
            isFaculty ? 'bg-[#0284C7]' : 'bg-[#EAB308]'
          }`}
          style={{ clipPath: 'polygon(0 0, 100% 0, 75% 100%, 0% 100%)' }}
        />

        {/* Diagonal subtle line accent */}
        <div
          className={`absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] ${
            isFaculty ? 'from-cyan-300 via-transparent to-transparent' : 'from-yellow-300 via-transparent to-transparent'
          }`}
        />

        <div className="relative z-10 flex items-center justify-between gap-3">
          {/* School Emblem / Crest (SVG Badge matching reference) */}
          <div className="flex items-center shrink-0">
            {logoUrl ? (
              <div className="w-13 h-13 rounded-full bg-white/10 border-2 border-white/40 p-1 flex items-center justify-center">
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain rounded-full" />
              </div>
            ) : (
              <div
                className={`w-12 h-14 relative flex flex-col items-center justify-center p-1 rounded-sm border-2 ${
                  isFaculty ? 'border-sky-300 bg-[#0A1D3B]' : 'border-amber-400 bg-[#0A1D3B]'
                }`}
                style={{
                  clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 50% 100%, 0% 75%)',
                }}
              >
                <div className="flex flex-col items-center">
                  <Sparkles className={`w-3 h-3 ${isFaculty ? 'text-sky-300' : 'text-amber-400'} mb-0.5`} />
                  <BookOpen className="w-4 h-4 text-white" />
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <span className={`text-[6px] font-black ${isFaculty ? 'text-sky-300' : 'text-amber-400'}`}>★</span>
                    <span className="text-[6px] font-black text-white">★</span>
                    <span className={`text-[6px] font-black ${isFaculty ? 'text-sky-300' : 'text-amber-400'}`}>★</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* School Titles */}
          <div className="text-center flex-1 pr-2">
            <h2 className="text-base font-black tracking-wider uppercase leading-tight text-white font-sans drop-shadow-xs">
              {schoolName}
            </h2>
            <p className={`text-[10px] font-bold tracking-widest uppercase mt-0.5 ${
              isFaculty ? 'text-sky-300' : 'text-amber-400'
            }`}>
              {schoolSubtitle}
            </p>
            <p className="text-[7.5px] font-semibold tracking-widest text-slate-200 uppercase mt-0.5 opacity-90">
              {schoolTagline}
            </p>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. PHOTO & SIDE BADGES (ESTD & ID NO)                                */}
      {/* ==================================================================== */}
      <div className="relative px-4 -mt-10 z-20">
        <div className="flex items-center justify-between">
          {/* Left: ESTD with Laurel Emblem */}
          <div className="flex flex-col items-center justify-center text-center w-20 pt-4">
            <div className="relative flex items-center justify-center">
              <svg className="w-9 h-7 text-[#0D254C]" viewBox="0 0 36 28" fill="currentColor">
                <path d="M12 4C9 7 8 11 8 15C8 19 10 22 13 24C10 23 7 19 7 15C7 10 9 6 12 4Z" opacity="0.9" />
                <path d="M24 4C27 7 28 11 28 15C28 19 26 22 23 24C26 23 29 19 29 15C29 10 27 6 24 4Z" opacity="0.9" />
                <circle cx="18" cy="14" r="3" fill="#0D254C" />
              </svg>
              <GraduationCap className="w-4 h-4 text-[#0D254C] absolute -top-1" />
            </div>
            <span className="text-[9px] font-extrabold text-[#0D254C] tracking-tight uppercase mt-0.5">
              ESTD. {establishedYear}
            </span>
          </div>

          {/* Center: Circular Portrait Photo with Dual Accent Ring */}
          <div className="relative z-20">
            <div
              className={`w-26 h-26 rounded-full p-[3px] bg-white shadow-lg ${
                isFaculty ? 'ring-3 ring-[#0284C7]' : 'ring-3 ring-[#EAB308]'
              }`}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border-2 border-white">
                {photo ? (
                  <img
                    src={photo}
                    alt={fullName}
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        fullName
                      )}&background=0D254C&color=fff&size=200`;
                    }}
                  />
                ) : (
                  <img
                    src={`https://images.unsplash.com/${
                      isStudent
                        ? 'photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80'
                        : 'photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80'
                    }`}
                    alt={fullName}
                    className="w-full h-full object-cover object-top"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right: ID No. */}
          <div className="flex flex-col items-center justify-center text-center w-20 pt-4">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              ID No.
            </span>
            <span className="text-[10px] font-black text-[#0D254C] tracking-tight mt-0.5">
              {idNumber}
            </span>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 3. ROLE RIBBON BANNER (STUDENT / FACULTY)                            */}
        {/* ==================================================================== */}
        <div className="relative flex justify-center -mt-3 z-30">
          <div className="relative flex items-center shadow-md">
            {/* Left Ribbon Wing */}
            <div
              className={`w-4 h-6 transform -skew-x-12 ${
                isFaculty ? 'bg-[#0284C7]' : 'bg-[#EAB308]'
              }`}
            />
            {/* Center Navy Banner */}
            <div className="bg-[#0D254C] text-white px-7 py-1 flex items-center justify-center">
              <span className="text-xs font-black tracking-widest uppercase">
                {isFaculty ? (type === 'staff' ? 'STAFF' : 'FACULTY') : 'STUDENT'}
              </span>
            </div>
            {/* Right Ribbon Wing */}
            <div
              className={`w-4 h-6 transform skew-x-12 ${
                isFaculty ? 'bg-[#0284C7]' : 'bg-[#EAB308]'
              }`}
            />
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 4. FULL NAME & SUBTITLE / DESIGNATION                                */}
        {/* ==================================================================== */}
        <div className="text-center mt-2.5 mb-3">
          <h3 className="text-lg font-black text-[#0D254C] tracking-tight uppercase leading-tight font-sans">
            {fullName}
          </h3>
          {isFaculty && (
            <p className="text-[10px] font-extrabold text-[#0284C7] tracking-widest uppercase mt-0.5">
              {designation}
            </p>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. INFORMATION GRID WITH NAVY SQUARE ICONS & WATERMARK               */}
      {/* ==================================================================== */}
      <div className="relative px-5 py-1">
        {/* Subtle Background Watermark Crest */}
        <div className="absolute right-2 top-2 w-32 h-32 opacity-[0.05] pointer-events-none flex items-center justify-center">
          <BookText className="w-full h-full text-[#0D254C]" />
        </div>

        <div className="space-y-1.5 text-[11px] text-slate-800 relative z-10">
          {/* Row 1: Father's Name */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#0D254C] text-white flex items-center justify-center shrink-0 shadow-xs">
              <User className="w-3 h-3" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="font-bold text-slate-700 shrink-0 w-24 text-[11px]">
                Father's Name
              </span>
              <span className="font-bold text-slate-900 shrink-0">:</span>
              <span className="font-bold text-slate-900 truncate text-[11px]">
                {fatherName}
              </span>
            </div>
          </div>

          {/* Row 2: Date of Birth */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#0D254C] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Calendar className="w-3 h-3" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="font-bold text-slate-700 shrink-0 w-24 text-[11px]">
                Date of Birth
              </span>
              <span className="font-bold text-slate-900 shrink-0">:</span>
              <span className="font-bold text-slate-900 truncate text-[11px]">
                {dob}
              </span>
            </div>
          </div>

          {/* Row 3: Class/Grade (Student) or Qualification (Faculty) */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#0D254C] text-white flex items-center justify-center shrink-0 shadow-xs">
              {isFaculty ? (
                <Award className="w-3 h-3" />
              ) : (
                <GraduationCap className="w-3 h-3" />
              )}
            </div>
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="font-bold text-slate-700 shrink-0 w-24 text-[11px]">
                {isFaculty ? 'Qualification' : 'Class / Grade'}
              </span>
              <span className="font-bold text-slate-900 shrink-0">:</span>
              <span className="font-bold text-slate-900 truncate text-[11px]">
                {isFaculty ? qualification : studentGrade}
              </span>
            </div>
          </div>

          {/* Row 4: Roll No (Student) or Employee ID (Faculty) */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#0D254C] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Hash className="w-3 h-3" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="font-bold text-slate-700 shrink-0 w-24 text-[11px]">
                {isFaculty ? 'Employee ID' : 'Roll No.'}
              </span>
              <span className="font-bold text-slate-900 shrink-0">:</span>
              <span className="font-bold text-slate-900 truncate text-[11px]">
                {isFaculty ? employeeId : rollNumber}
              </span>
            </div>
          </div>

          {/* Row 5: Address */}
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded bg-[#0D254C] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <MapPin className="w-3 h-3" />
            </div>
            <div className="flex items-start gap-1.5 min-w-0 flex-1">
              <span className="font-bold text-slate-700 shrink-0 w-24 text-[11px]">
                Address
              </span>
              <span className="font-bold text-slate-900 shrink-0">:</span>
              <span className="font-bold text-slate-900 line-clamp-1 leading-tight text-[11px]">
                {address}
              </span>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 6. REALISTIC HIGH-DENSITY VECTOR BARCODE                             */}
        {/* ==================================================================== */}
        <div className="mt-3 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center gap-[2px] h-7 w-56 bg-white px-2">
            {[3, 1, 2, 4, 1, 3, 1, 2, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2].map(
              (w, i) => (
                <div
                  key={i}
                  className="h-full bg-slate-950"
                  style={{ width: `${w}px` }}
                />
              )
            )}
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 7. SIGNATURES & VALIDITY BADGE                                       */}
        {/* ==================================================================== */}
        <div className="flex items-end justify-between mt-2 pt-1 pb-2 px-1">
          {/* Principal Signature */}
          <div className="text-center">
            {settings?.principalSignatureUrl ? (
              <div className="h-6 flex items-center justify-center -mb-1">
                <img
                  src={settings.principalSignatureUrl}
                  alt="Principal Signature"
                  className="max-h-full object-contain mx-auto"
                />
              </div>
            ) : (
              <span
                className="block italic text-base text-slate-900 font-bold select-none leading-none -mb-1"
                style={{
                  fontFamily: '"Brush Script MT", "Dancing Script", "Caveat", "Segoe Script", cursive',
                  fontSize: '18px',
                }}
              >
                {signatureText}
              </span>
            )}
            <div className="w-20 h-[1px] bg-slate-400 mx-auto my-1" />
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider block">
              {isFaculty ? 'Signature' : 'Principal'}
            </span>
          </div>

          {/* Valid Upto Badge */}
          <div className="flex items-center gap-1.5 text-right">
            <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0D254C]">
              <ShieldCheck className="w-4 h-4 text-[#0D254C]" />
            </div>
            <div className="text-right">
              <span className="block text-[8px] font-bold text-slate-500 uppercase leading-none">
                Valid Upto
              </span>
              <span className="text-[10px] font-black text-[#0D254C] leading-tight">
                {validUntil}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 8. SOLID NAVY FOOTER WITH CONTACT INFORMATION                        */}
      {/* ==================================================================== */}
      <div className="bg-[#0D254C] text-white py-1.5 px-3 text-[8.5px] font-bold flex items-center justify-between gap-2 border-t border-slate-700/50">
        <div className="flex items-center gap-1 truncate">
          <Phone className="w-2.5 h-2.5 text-white shrink-0" />
          <span className="truncate">{phone}</span>
        </div>
        <div className="flex items-center gap-1 truncate">
          <Globe className="w-2.5 h-2.5 text-white shrink-0" />
          <span className="truncate">{website ? website.replace(/^https?:\/\//, '') : 'www.school.edu.in'}</span>
        </div>
        <div className="flex items-center gap-1 truncate">
          <Mail className="w-2.5 h-2.5 text-white shrink-0" />
          <span className="truncate">{email}</span>
        </div>
      </div>
    </div>
  );
};
