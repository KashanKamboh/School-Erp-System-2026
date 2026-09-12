import React, { useState, useMemo } from 'react';
import { useERPData } from '../../context/ERPDataContext';
import { Student } from '../../types/erp';
import {
  Printer,
  Award,
  FileCheck2,
  FileText,
  GraduationCap,
  ShieldCheck,
  School,
  Search,
  CheckCircle,
  Calendar,
  Building,
} from 'lucide-react';

export type CertificateType =
  | 'character'
  | 'bonafide'
  | 'transfer'
  | 'excellence';

interface CertificateConfig {
  id: CertificateType;
  title: string;
  badgeTitle: string;
  description: string;
  icon: React.ElementType;
}

const CERTIFICATE_TYPES: CertificateConfig[] = [
  {
    id: 'character',
    title: 'Character & Conduct Certificate',
    badgeTitle: 'CHARACTER CERTIFICATE',
    description: 'Certifies good moral conduct, discipline, and exemplary character.',
    icon: Award,
  },
  {
    id: 'bonafide',
    title: 'Bonafide Student Certificate',
    badgeTitle: 'BONAFIDE CERTIFICATE',
    description: 'Official proof of regular enrollment and valid admission in current session.',
    icon: FileCheck2,
  },
  {
    id: 'transfer',
    title: 'School Leaving & Transfer Certificate',
    badgeTitle: 'SCHOOL LEAVING CERTIFICATE',
    description: 'Migration certificate confirming dues clearance and academic standing.',
    icon: FileText,
  },
  {
    id: 'excellence',
    title: 'Certificate of Academic Merit',
    badgeTitle: 'CERTIFICATE OF EXCELLENCE',
    description: 'Honoring outstanding scholastic achievement and high examination performance.',
    icon: GraduationCap,
  },
];

export const CertificateGenerator: React.FC = () => {
  const { students, classes, settings, schoolSettings } = useERPData();

  const [selectedType, setSelectedType] = useState<CertificateType>('character');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [issueDate, setIssueDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [customRemark, setCustomRemark] = useState('');

  // Resolve active school settings
  const resolvedSchool = { ...settings, ...schoolSettings };
  const schoolName = resolvedSchool.schoolName || 'Academic Institution';
  const schoolLogo = resolvedSchool.logoUrl || '';
  const affiliationNumber = resolvedSchool.affiliationNumber || '';
  const registrationNumber = resolvedSchool.registrationNumber || '';
  const address = resolvedSchool.address || (resolvedSchool.city ? `${resolvedSchool.city}, ${resolvedSchool.country || 'Pakistan'}` : '');
  const phone = resolvedSchool.phone || '';
  const email = resolvedSchool.email || '';
  const sessionYear = resolvedSchool.currentSession || resolvedSchool.academicYear || '2025–2026';
  const principalName = resolvedSchool.principalName || 'Principal';

  // Filter students
  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        (s.admissionNo && s.admissionNo.toLowerCase().includes(q)) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
        (s.class && s.class.toLowerCase().includes(q))
    );
  }, [students, searchQuery]);

  const activeStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || students[0] || null;
  }, [students, selectedStudentId]);

  const currentConfig = CERTIFICATE_TYPES.find((c) => c.id === selectedType)!;

  const handlePrint = () => {
    window.print();
  };

  const certificateRefNumber = activeStudent
    ? `REF/${(resolvedSchool.schoolCode || 'SCH').toUpperCase()}/${new Date().getFullYear()}/${activeStudent.admissionNo || activeStudent.rollNumber || '001'}`
    : 'REF/CERT/2026/001';

  return (
    <div className="space-y-6">
      {/* Configuration Controls (Screen Only) */}
      <div className="print:hidden bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Institutional Certificate Generator</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Issue verified official certificates formatted with dynamic school branding and security seal.
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Certificate</span>
          </button>
        </div>

        {/* Certificate Type Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CERTIFICATE_TYPES.map((cert) => {
            const Icon = cert.icon;
            const isSelected = selectedType === cert.id;
            return (
              <button
                key={cert.id}
                onClick={() => setSelectedType(cert.id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs">{cert.title}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {cert.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Student Selector and Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Select Student
            </label>
            <div className="relative">
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden"
              >
                {students.map((stu) => (
                  <option key={stu.id} value={stu.id}>
                    {stu.firstName} {stu.lastName} ({stu.class} - Roll: {stu.rollNumber || 'N/A'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Issue Date
            </label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Additional Remarks / Honors (Optional)
            </label>
            <input
              type="text"
              value={customRemark}
              onChange={(e) => setCustomRemark(e.target.value)}
              placeholder="e.g. Secured 1st Position in Board Debate"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Official Certificate Preview & Print Canvas */}
      {activeStudent && (
        <div className="flex justify-center p-2 sm:p-4 bg-slate-100 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div
            id="official-certificate-canvas"
            className="w-full max-w-[840px] bg-[#FFFDF7] text-slate-900 p-8 sm:p-12 rounded-xl shadow-2xl print:shadow-none print:m-0 print:p-8 border-[10px] border-amber-900/90 relative overflow-hidden font-serif"
            style={{
              boxShadow: '0 20px 40px -15px rgba(120, 53, 15, 0.25)',
            }}
          >
            {/* Inner Gold Ribbon Border */}
            <div className="border-2 border-amber-500/80 p-6 sm:p-8 relative">
              {/* Ornate Corner Accents */}
              <div className="absolute -top-3 -left-3 text-amber-700 font-bold select-none text-base">❖</div>
              <div className="absolute -top-3 -right-3 text-amber-700 font-bold select-none text-base">❖</div>
              <div className="absolute -bottom-3 -left-3 text-amber-700 font-bold select-none text-base">❖</div>
              <div className="absolute -bottom-3 -right-3 text-amber-700 font-bold select-none text-base">❖</div>

              {/* Faint Background Watermark */}
              {schoolLogo && (
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none">
                  <img src={schoolLogo} alt="Watermark" className="w-96 h-96 object-contain filter grayscale" />
                </div>
              )}

              {/* Header with School Branding */}
              <div className="relative text-center pb-5 border-b-2 border-amber-900/30">
                {/* School Logo */}
                {schoolLogo ? (
                  <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-white border-2 border-amber-600/60 p-1 flex items-center justify-center shadow-md">
                    <img
                      src={schoolLogo}
                      alt={schoolName}
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-amber-100 border-2 border-amber-600 flex items-center justify-center text-amber-950 shadow-sm">
                    <School className="w-8 h-8 text-amber-900" />
                  </div>
                )}

                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-amber-950 font-serif drop-shadow-xs">
                  {schoolName}
                </h1>

                {resolvedSchool.tagline && (
                  <p className="text-xs italic text-amber-900 font-medium mt-0.5 tracking-wide">
                    &ldquo;{resolvedSchool.tagline}&rdquo;
                  </p>
                )}

                <p className="text-xs text-slate-700 mt-1 font-sans font-medium">
                  {address}
                  {phone ? ` • Tel: ${phone}` : ''}
                  {email ? ` • Email: ${email}` : ''}
                </p>

                {(affiliationNumber || registrationNumber) && (
                  <p className="text-[11px] text-amber-900/80 font-sans mt-0.5 font-semibold">
                    {affiliationNumber ? `Affiliation No: ${affiliationNumber}` : ''}
                    {affiliationNumber && registrationNumber ? ' | ' : ''}
                    {registrationNumber ? `Registration No: ${registrationNumber}` : ''}
                  </p>
                )}
              </div>

              {/* Certificate Title Banner */}
              <div className="text-center my-6">
                <div className="inline-block relative">
                  <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 text-amber-100 px-10 py-2.5 rounded-sm uppercase tracking-[0.25em] font-sans font-black text-sm sm:text-base shadow-md border-y-2 border-amber-400">
                    {currentConfig.badgeTitle}
                  </div>
                  <div className="flex justify-between items-center px-2 mt-1.5 font-sans text-[11px] font-bold text-amber-900/90">
                    <span>Doc Ref: {certificateRefNumber}</span>
                    <span>Session: {sessionYear}</span>
                  </div>
                </div>
              </div>

              {/* Certificate Body */}
              <div className="py-4 text-slate-900 text-sm sm:text-base leading-relaxed text-justify space-y-4 px-2 sm:px-6">
                <p>
                  This is to certify that{' '}
                  <strong className="text-amber-950 underline decoration-amber-600 underline-offset-4 uppercase font-black text-base sm:text-lg">
                    {activeStudent.firstName} {activeStudent.lastName}
                  </strong>
                  , child of{' '}
                  <strong className="text-slate-950 font-bold">
                    {activeStudent.fatherName || activeStudent.parentName || 'Guardian'}
                  </strong>
                  , bearing Admission Number{' '}
                  <strong className="font-mono text-slate-950">{activeStudent.admissionNo || 'N/A'}</strong> and Roll Number{' '}
                  <strong className="font-mono text-slate-950">{activeStudent.rollNumber || 'N/A'}</strong>, is a registered student of Class{' '}
                  <strong className="text-slate-950">{activeStudent.class} (Section {activeStudent.section || 'A'})</strong> at this institution.
                </p>

                {selectedType === 'character' && (
                  <p>
                    During the period of their academic stay, their conduct, character, and institutional discipline have been observed to be{' '}
                    <strong className="text-amber-900 font-bold">Exemplary and Commendable</strong>. To the best of our knowledge and official record, they took active part in co-curricular activities and exhibited respectful behavior toward faculty and peers.
                  </p>
                )}

                {selectedType === 'bonafide' && (
                  <p>
                    They are a bonafide and regular student of our institution for the academic session{' '}
                    <strong>{sessionYear}</strong>. Their enrollment is active and verified as per the institutional register.
                  </p>
                )}

                {selectedType === 'transfer' && (
                  <p>
                    All institutional dues, library balances, and examination clearances against this student have been settled in full up to the current term. Their general conduct during attendance was satisfactory. We wish them success in their future academic endeavors.
                  </p>
                )}

                {selectedType === 'excellence' && (
                  <p>
                    This certificate is awarded in recognition of scholastic diligence, exceptional examination performance, and academic dedication exhibited during the <strong>{sessionYear}</strong> evaluation period.
                  </p>
                )}

                {customRemark && (
                  <p className="italic text-amber-950 bg-amber-100/60 p-3 rounded-lg border border-amber-300 font-sans text-xs font-medium">
                    Special Commendation: {customRemark}
                  </p>
                )}

                <p>
                  We wish them continued success and distinction in all future educational pursuits.
                </p>
              </div>

              {/* Signatures & Golden Wax Seal Section */}
              <div className="grid grid-cols-3 gap-4 pt-8 mt-6 border-t border-amber-800/30 items-end font-sans text-xs">
                {/* Issue Date */}
                <div className="text-left">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Date of Issue</span>
                  <strong className="text-slate-900 block mt-0.5">
                    {new Date(issueDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </strong>
                  <span className="text-[10px] text-slate-400 mt-1 block">Verified Record</span>
                </div>

                {/* Golden Wax Seal Emblem with Ribbon Tails */}
                <div className="flex flex-col items-center justify-center text-center relative">
                  <div className="relative flex flex-col items-center">
                    <div className="w-18 h-18 rounded-full bg-gradient-to-br from-amber-400 via-amber-600 to-amber-800 border-4 border-amber-200 flex flex-col items-center justify-center text-white p-1 shadow-lg shadow-amber-900/30 ring-2 ring-amber-700">
                      <ShieldCheck className="w-6 h-6 text-amber-100 drop-shadow-xs" />
                      <span className="text-[6.5px] font-black uppercase tracking-widest leading-none mt-0.5 text-amber-100">OFFICIAL SEAL</span>
                      <span className="text-[6px] text-amber-200 leading-none truncate max-w-[50px]">{schoolName.slice(0, 10)}</span>
                    </div>
                  </div>
                </div>

                {/* Principal Signature */}
                <div className="text-right">
                  <div className="inline-block text-center min-w-[140px]">
                    {resolvedSchool.principalSignatureUrl ? (
                      <div className="h-10 flex items-center justify-center mb-1">
                        <img
                          src={resolvedSchool.principalSignatureUrl}
                          alt="Principal Signature"
                          className="max-h-full object-contain mx-auto"
                        />
                      </div>
                    ) : (
                      <span
                        className="block font-serif italic text-base text-slate-900 font-bold"
                        style={{ fontFamily: '"Brush Script MT", "Dancing Script", Georgia, cursive' }}
                      >
                        {principalName}
                      </span>
                    )}
                    <div className="w-32 h-px bg-slate-500 mx-auto my-1" />
                    <strong className="text-slate-900 block text-[11px] uppercase tracking-wider font-bold">
                      Principal / Head of Institution
                    </strong>
                    <span className="text-[10px] text-slate-600 block">{schoolName}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
