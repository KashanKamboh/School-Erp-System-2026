import React, { useState, useMemo } from 'react';
import { Student, ExamResult, SchoolSettings, ClassSection, AttendanceRecord } from '../../types/erp';
import { Printer, Download, Award, CheckCircle2, Star, Shield, User, FileText, School, AlertCircle, Users, Check, ChevronDown, Sparkles } from 'lucide-react';

interface ResultCardViewProps {
  students: Student[];
  examResults: ExamResult[];
  schoolSettings: SchoolSettings;
  classes?: ClassSection[];
  attendanceRecords?: AttendanceRecord[];
  canPrint?: boolean;
}

export type ExamTerm = 'First Term' | 'Mid Term' | 'Final Term';

interface SubjectMarkEntry {
  sr: number;
  subject: string;
  totalMarks: number;
  passMarks: number;
  theoryMarks: number | null;
  practicalMarks?: number | null;
  obtainedMarks: number | null;
  grade?: string;
  remarks: string;
  isRecorded: boolean;
}

export const ResultCardView: React.FC<ResultCardViewProps> = ({
  students,
  examResults,
  schoolSettings,
  classes = [],
  attendanceRecords = [],
  canPrint = true,
}) => {
  const [selectedTerm, setSelectedTerm] = useState<ExamTerm>('Mid Term');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [printScope, setPrintScope] = useState<'single' | 'batch'>('single');

  // Extract unique classes dynamically derived from Classes & Section page
  const configuredClasses = useMemo(() => Array.from(new Set(classes.map((c) => c.name))).filter(Boolean), [classes]);
  const studentClasses = useMemo(() => Array.from(new Set(students.map((s) => s.class))).filter(Boolean), [students]);
  const availableClasses = configuredClasses.length > 0 ? configuredClasses : (studentClasses.length > 0 ? studentClasses : ['Grade 10', 'Grade 9', 'Grade 8']);

  // Extract sections dynamically from Classes & Section page
  const availableSections = useMemo(() => {
    const relevant = selectedClass === 'All' ? classes : classes.filter((c) => c.name === selectedClass);
    const secs = Array.from(new Set(relevant.map((c) => c.section).filter(Boolean)));
    return secs.length > 0 ? secs : ['A', 'B'];
  }, [classes, selectedClass]);

  // Filter students based on selected class and section
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedClass !== 'All' && s.class !== selectedClass) return false;
      if (selectedSection !== 'All' && s.section && s.section !== selectedSection) return false;
      return true;
    });
  }, [students, selectedClass, selectedSection]);

  // Fallback student if list is empty
  const defaultStudent: Student = useMemo(() => ({
    id: 'std-sample',
    firstName: 'Student',
    lastName: 'Candidate',
    rollNumber: '01',
    admissionNo: 'RPS-2025-001',
    class: availableClasses[0] || 'Grade 10',
    section: availableSections[0] || 'A',
    gender: 'Male',
    dateOfBirth: '2010-04-14',
    fatherName: 'Guardian',
    parentName: 'Guardian',
    parentPhone: '+92 300 0000000',
    emergencyContact: '+92 300 0000000',
    address: 'Lahore, Pakistan',
    status: 'Active',
    cnicOrBForm: '35201-0000000-1',
    attendanceRate: 96,
    bloodGroup: 'B+',
    admissionDate: '2024-04-01',
  }), [availableClasses, availableSections]);

  const targetStudent: Student = useMemo(() => {
    if (selectedStudentId) {
      const found = filteredStudents.find((s) => s.id === selectedStudentId);
      if (found) return found;
    }
    if (filteredStudents.length > 0) {
      return filteredStudents[0];
    }
    if (selectedClass !== 'All') {
      const clsObj = classes.find((c) => c.name === selectedClass);
      return {
        ...defaultStudent,
        firstName: 'Student',
        lastName: `(${selectedClass})`,
        class: selectedClass,
        section: selectedSection !== 'All' ? selectedSection : (clsObj?.section || availableSections[0] || 'A'),
      };
    }
    return students[0] || defaultStudent;
  }, [selectedStudentId, filteredStudents, students, selectedClass, selectedSection, classes, availableSections, defaultStudent]);

  // Precompute class rankings for all students in the class/section for the selected term
  const classScoresMap = useMemo(() => {
    const scores = new Map<string, { totalObtained: number; totalPossible: number; count: number; studentId: string }>();

    filteredStudents.forEach((st) => {
      const results = examResults.filter(
        (r) => r.studentId === st.id && (!r.term || r.term === selectedTerm)
      );
      const totalObtained = results.reduce((acc, r) => acc + (r.obtainedMarks || 0), 0);
      const totalPossible = results.reduce((acc, r) => acc + (r.totalMarks || 100), 0);
      const count = results.filter((r) => r.obtainedMarks !== null && r.obtainedMarks !== undefined).length;
      scores.set(st.id, { totalObtained, totalPossible, count, studentId: st.id });
    });

    return scores;
  }, [filteredStudents, examResults, selectedTerm]);

  // Calculate ranking helper
  const getStudentRankInfo = (student: Student) => {
    const peerList = filteredStudents.filter((s) => s.class === student.class);
    const sorted = peerList
      .map((p) => {
        const sc = classScoresMap.get(p.id) || { totalObtained: 0, count: 0 };
        return { studentId: p.id, total: sc.totalObtained, count: sc.count };
      })
      .sort((a, b) => b.total - a.total);

    const studentScore = classScoresMap.get(student.id);
    if (!studentScore || studentScore.count === 0) {
      return {
        rank: '-',
        positionText: 'Awaiting Results',
        isTopper: false,
        totalPeers: peerList.length,
      };
    }

    const rankIdx = sorted.findIndex((s) => s.studentId === student.id);
    const rankNum = rankIdx + 1;
    let suffix = 'th';
    if (rankNum === 1) suffix = 'st';
    else if (rankNum === 2) suffix = 'nd';
    else if (rankNum === 3) suffix = 'rd';

    const positionText =
      rankNum === 1
        ? '1st Position (Class Topper)'
        : `${rankNum}${suffix} Position (of ${peerList.length})`;

    return {
      rank: `${rankNum}${suffix}`,
      positionText,
      isTopper: rankNum === 1,
      totalPeers: peerList.length,
    };
  };

  // Real attendance calculation helper
  const getStudentAttendance = (student: Student) => {
    const logs = attendanceRecords.filter((a) => a.studentId === student.id);
    if (logs.length > 0) {
      const present = logs.filter((a) => a.status === 'Present').length;
      const total = logs.length;
      const pct = Math.round((present / total) * 100);
      return {
        present,
        total,
        percentage: pct,
        label: `${present} / ${total} Days (${pct}% - ${pct >= 85 ? 'Regular' : 'Satisfactory'})`,
      };
    }

    // Realistic fallback based on student.attendanceRate
    const rate = student.attendanceRate !== undefined ? student.attendanceRate : 96;
    const estTotal = 192;
    const estPresent = Math.round((rate / 100) * estTotal);
    return {
      present: estPresent,
      total: estTotal,
      percentage: rate,
      label: `${estPresent} / ${estTotal} Days (${rate}% - ${rate >= 85 ? 'Regular' : 'Satisfactory'})`,
    };
  };

  // Helper to compute subject results for a given student
  const getStudentSubjectData = (student: Student) => {
    const studentRes = examResults.filter(
      (r) => r.studentId === student.id && (!r.term || r.term === selectedTerm)
    );

    const matchingCls = classes.find(
      (c) => c.name.toLowerCase() === (student.class || '').toLowerCase()
    );

    const rawSubjects =
      matchingCls?.subjects && matchingCls.subjects.length > 0
        ? matchingCls.subjects
        : [
            'Mathematics',
            'English Language & Literature',
            'Urdu Language & Literature',
            'General Science / Physics',
            'Chemistry / Biology',
            'Islamiat / Ethics',
            'Pakistan Studies (Social Studies)',
            'Computer Science',
          ];

    const subjectsData: SubjectMarkEntry[] = rawSubjects.map((subName, idx) => {
      const matched = studentRes.find(
        (r) => r.subject.toLowerCase() === subName.toLowerCase()
      );

      if (matched && matched.obtainedMarks !== undefined && matched.obtainedMarks !== null) {
        const total = matched.totalMarks || 100;
        const obtained = Number(matched.obtainedMarks);
        const pct = Math.round((obtained / total) * 100);

        let gr = matched.grade;
        if (!gr) {
          if (pct >= 90) gr = 'A+';
          else if (pct >= 80) gr = 'A';
          else if (pct >= 70) gr = 'B';
          else if (pct >= 60) gr = 'C';
          else if (pct >= 50) gr = 'D';
          else if (pct >= 40) gr = 'E';
          else gr = 'F';
        }

        return {
          sr: idx + 1,
          subject: subName,
          totalMarks: total,
          passMarks: Math.round(total * 0.4),
          theoryMarks: matched.theoryMarks !== null && matched.theoryMarks !== undefined ? Number(matched.theoryMarks) : obtained,
          practicalMarks: matched.practicalMarks !== null && matched.practicalMarks !== undefined ? Number(matched.practicalMarks) : null,
          obtainedMarks: obtained,
          grade: gr,
          remarks: matched.remarks || (pct >= 80 ? 'Excellent' : pct >= 60 ? 'Good' : pct >= 40 ? 'Satisfactory' : 'Needs Improvement'),
          isRecorded: true,
        };
      }

      return {
        sr: idx + 1,
        subject: subName,
        totalMarks: 100,
        passMarks: 40,
        theoryMarks: null,
        practicalMarks: null,
        obtainedMarks: null,
        grade: '-',
        remarks: 'Pending Examination',
        isRecorded: false,
      };
    });

    const gradedSubjects = subjectsData.filter((s) => s.isRecorded && s.obtainedMarks !== null);
    const hasRecordedMarks = gradedSubjects.length > 0;

    const totalMaxMarks = hasRecordedMarks
      ? gradedSubjects.reduce((acc, curr) => acc + curr.totalMarks, 0)
      : subjectsData.reduce((acc, curr) => acc + curr.totalMarks, 0);

    const totalObtainedMarks = gradedSubjects.reduce((acc, curr) => acc + (curr.obtainedMarks || 0), 0);
    const overallPercentage = hasRecordedMarks
      ? ((totalObtainedMarks / totalMaxMarks) * 100).toFixed(2)
      : null;

    const getOverallGrade = (pct: number | null) => {
      if (pct === null) return { grade: 'Pending', title: 'Awaiting Examination Marks' };
      if (pct >= 90) return { grade: 'A+', title: 'Outstanding / Exceptional' };
      if (pct >= 80) return { grade: 'A', title: 'Excellent' };
      if (pct >= 70) return { grade: 'B', title: 'Very Good' };
      if (pct >= 60) return { grade: 'C', title: 'Good' };
      if (pct >= 50) return { grade: 'D', title: 'Satisfactory' };
      if (pct >= 40) return { grade: 'E', title: 'Pass' };
      return { grade: 'F', title: 'Failed' };
    };

    const gradeInfo = getOverallGrade(overallPercentage !== null ? parseFloat(overallPercentage) : null);

    // Dynamic Teacher Remarks
    const pctNum = overallPercentage !== null ? parseFloat(overallPercentage) : null;
    let teacherRemarks = 'Awaiting exam marks for comprehensive academic evaluation.';
    if (pctNum !== null) {
      if (pctNum >= 90) {
        teacherRemarks = `An exceptionally brilliant, polite, and motivated student. Maintains outstanding academic discipline and sets an inspiring benchmark for peers.`;
      } else if (pctNum >= 80) {
        teacherRemarks = `A highly dedicated, diligent, and attentive student. Consistently produces high-quality work and demonstrates great enthusiasm in class.`;
      } else if (pctNum >= 70) {
        teacherRemarks = `Shows solid understanding of course material and good potential. Regular revision and active class participation will help reach top honors.`;
      } else if (pctNum >= 60) {
        teacherRemarks = `Satisfactory performance. Advised to focus more on subject fundamentals, homework completion, and regular study habits.`;
      } else if (pctNum >= 40) {
        teacherRemarks = `Eligible for promotion but requires focused guidance and extra tutoring in weaker subjects to strengthen foundation.`;
      } else {
        teacherRemarks = `Struggling in core examinations. Urgent parent-teacher consultation recommended to structure remedial classes and a revision plan.`;
      }
    }

    const principalMessage = `Heartiest congratulations on performance in the ${selectedTerm}. Keep up the high standard of academic excellence and institutional values.`;

    return {
      subjectsData,
      hasRecordedMarks,
      totalMaxMarks,
      totalObtainedMarks,
      overallPercentage,
      gradeInfo,
      teacherRemarks,
      principalMessage,
    };
  };

  const handlePrint = () => {
    window.print();
  };

  // Render a single student's official progress report card
  const renderCard = (student: Student, isBatch = false) => {
    const {
      subjectsData,
      hasRecordedMarks,
      totalMaxMarks,
      totalObtainedMarks,
      overallPercentage,
      gradeInfo,
      teacherRemarks,
      principalMessage,
    } = getStudentSubjectData(student);

    const rankInfo = getStudentRankInfo(student);
    const attendanceInfo = getStudentAttendance(student);

    return (
      <div
        key={student.id}
        className={`max-w-4xl mx-auto bg-white text-slate-900 shadow-xl rounded-2xl border-4 border-double border-slate-800 p-4 sm:p-6 font-serif print:shadow-none print:border-2 print:border-black print:p-4 print:m-0 print:w-full print:max-w-none print:break-inside-avoid ${
          isBatch ? 'mb-8 break-after-page page-break-after-always' : ''
        }`}
        style={{
          boxSizing: 'border-box',
        }}
      >
        {/* Certificate Outer Border Frame */}
        <div className="border-2 border-slate-900 p-3 sm:p-4 relative">
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-1 left-1 text-slate-700 select-none text-xs">❖</div>
          <div className="absolute top-1 right-1 text-slate-700 select-none text-xs">❖</div>
          <div className="absolute bottom-1 left-1 text-slate-700 select-none text-xs">❖</div>
          <div className="absolute bottom-1 right-1 text-slate-700 select-none text-xs">❖</div>

          {/* School Header Section */}
          <div className="text-center pb-2 border-b-2 border-slate-900">
            <div className="flex flex-row items-center justify-center gap-3 mb-1">
              {/* School Emblem / Custom Logo */}
              {schoolSettings.logoUrl ? (
                <div className="w-12 h-12 rounded-full border-2 border-slate-900 bg-white p-0.5 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                  <img
                    src={schoolSettings.logoUrl}
                    alt={schoolSettings.schoolName}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-50 flex items-center justify-center text-slate-900 shrink-0">
                  <Shield className="w-6 h-6 text-blue-900" />
                </div>
              )}

              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-wide text-slate-950 font-serif leading-tight">
                  {schoolSettings.schoolName || 'ACADEMIC INSTITUTION'}
                </h1>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-700">
                  {schoolSettings.tagline || (schoolSettings.city ? `${schoolSettings.city} Campus` : 'Knowledge • Character • Academic Excellence')}
                </p>
              </div>
            </div>

            <p className="text-[10px] text-slate-600">
              {schoolSettings.affiliationNumber ? `Affiliation No: ${schoolSettings.affiliationNumber}` : 'Affiliated with Board of Intermediate & Secondary Education'} • Academic Session {schoolSettings.currentSession || '2025–2026'}
            </p>

            {/* Official Report Card Title Banner */}
            <div className="mt-1.5 inline-block px-5 py-1 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded-sm shadow-xs">
              STUDENT PROGRESS REPORT & DETAILED MARKS CERTIFICATE
            </div>
            <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wide mt-0.5">
              {selectedTerm.toUpperCase()} EXAMINATION
            </div>
          </div>

          {/* Student Profile & Bio-Data Grid */}
          <div className="my-2 border border-slate-800 text-xs">
            <div className="grid grid-cols-12">
              {/* Data fields */}
              <div className="col-span-9 p-2.5 grid grid-cols-2 gap-y-1.5 gap-x-3 border-r border-slate-800">
                <div>
                  <span className="text-slate-500 font-semibold block text-[9.5px] uppercase">Student Name:</span>
                  <strong className="text-xs font-bold text-slate-900 truncate block">
                    {student.firstName} {student.lastName}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block text-[9.5px] uppercase">Father / Guardian Name:</span>
                  <strong className="text-xs font-bold text-slate-900 truncate block">
                    {student.fatherName || student.parentName || 'Guardian'}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block text-[9.5px] uppercase">Roll Number:</span>
                  <strong className="text-xs font-bold text-blue-900">
                    #{student.rollNumber || '01'}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block text-[9.5px] uppercase">Admission / Reg. No:</span>
                  <strong className="text-xs font-bold text-slate-900">
                    {student.admissionNo || 'RPS-2025-001'}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block text-[9.5px] uppercase">Class & Section:</span>
                  <strong className="text-xs font-bold text-slate-900">
                    {student.class} - {student.section || 'A'}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block text-[9.5px] uppercase">Attendance Record:</span>
                  <strong className="text-xs font-bold text-emerald-800 truncate block">
                    {attendanceInfo.label}
                  </strong>
                </div>
              </div>

              {/* Student Photo Box */}
              <div className="col-span-3 p-2 flex flex-col items-center justify-center bg-slate-50">
                <div className="w-18 h-20 border border-slate-400 rounded-sm flex flex-col items-center justify-center overflow-hidden bg-white shadow-xs">
                  {student.photoUrl || student.avatar ? (
                    <img
                      src={student.photoUrl || student.avatar}
                      alt="Student"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-1">
                      <User className="w-6 h-6 text-slate-300 mx-auto mb-0.5" />
                      <span className="text-[8px] text-slate-400 uppercase font-bold leading-tight block">
                        Student Photo
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Marks Statement Table */}
          <div className="overflow-x-auto my-2 border border-slate-800">
            <table className="w-full text-left border-collapse font-sans">
              <thead className="bg-slate-900 text-white text-[10px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="p-1.5 border-r border-slate-800 text-center w-8">Sr</th>
                  <th className="p-1.5 border-r border-slate-800">Course / Subject Name</th>
                  <th className="p-1.5 border-r border-slate-800 text-center w-14">Max</th>
                  <th className="p-1.5 border-r border-slate-800 text-center w-14">Pass</th>
                  <th className="p-1.5 border-r border-slate-800 text-center w-14">Theory</th>
                  <th className="p-1.5 border-r border-slate-800 text-center w-14">Pract.</th>
                  <th className="p-1.5 border-r border-slate-800 text-center w-16">Obtained</th>
                  <th className="p-1.5 border-r border-slate-800 text-center w-14">%age</th>
                  <th className="p-1.5 border-r border-slate-800 text-center w-14">Grade</th>
                  <th className="p-1.5 text-center w-28">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {subjectsData.map((row) => {
                  const pct = row.isRecorded && row.obtainedMarks !== null
                    ? Math.round((row.obtainedMarks / row.totalMarks) * 100)
                    : null;
                  const gr = row.grade || '-';

                  return (
                    <tr key={row.sr} className="text-[10.5px]">
                      <td className="p-1 border-r border-slate-800 text-center font-bold text-slate-600">
                        {row.sr}
                      </td>
                      <td className="p-1 border-r border-slate-800 font-bold text-slate-900">
                        {row.subject}
                      </td>
                      <td className="p-1 border-r border-slate-800 text-center">{row.totalMarks}</td>
                      <td className="p-1 border-r border-slate-800 text-center text-slate-600">{row.passMarks}</td>
                      <td className="p-1 border-r border-slate-800 text-center text-slate-700">
                        {row.theoryMarks !== null ? row.theoryMarks : '-'}
                      </td>
                      <td className="p-1 border-r border-slate-800 text-center text-slate-500">
                        {row.practicalMarks !== undefined && row.practicalMarks !== null ? row.practicalMarks : '-'}
                      </td>
                      <td className="p-1 border-r border-slate-800 text-center font-extrabold text-slate-950">
                        {row.obtainedMarks !== null ? (
                          row.obtainedMarks
                        ) : (
                          <span className="text-slate-400 font-medium italic">Pending</span>
                        )}
                      </td>
                      <td className="p-1 border-r border-slate-800 text-center font-semibold">
                        {pct !== null ? `${pct}%` : '-'}
                      </td>
                      <td className="p-1 border-r border-slate-800 text-center font-extrabold text-blue-900">
                        {row.isRecorded ? gr : <span className="text-slate-400 font-normal">-</span>}
                      </td>
                      <td className="p-1 text-center text-slate-700 font-medium text-[9.5px]">
                        {row.isRecorded ? (
                          row.remarks
                        ) : (
                          <span className="text-slate-400 italic">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Grand Total Summary Row */}
              <tfoot>
                <tr className="bg-slate-100 text-slate-950 font-bold border-t-2 border-slate-900 text-[11px]">
                  <td colSpan={2} className="p-1.5 border-r border-slate-800 uppercase tracking-wider text-right pr-3 font-extrabold">
                    Grand Total:
                  </td>
                  <td className="p-1.5 border-r border-slate-800 text-center font-extrabold">
                    {hasRecordedMarks ? totalMaxMarks : '-'}
                  </td>
                  <td className="p-1.5 border-r border-slate-800 text-center text-slate-500">-</td>
                  <td colSpan={2} className="p-1.5 border-r border-slate-800 text-center text-slate-500">-</td>
                  <td className="p-1.5 border-r border-slate-800 text-center font-extrabold text-xs text-blue-900">
                    {hasRecordedMarks ? totalObtainedMarks : '-'}
                  </td>
                  <td className="p-1.5 border-r border-slate-800 text-center font-extrabold text-xs">
                    {overallPercentage !== null ? `${overallPercentage}%` : '-'}
                  </td>
                  <td className="p-1.5 border-r border-slate-800 text-center font-extrabold text-xs text-emerald-800">
                    {gradeInfo.grade}
                  </td>
                  <td className="p-1.5 text-center font-bold text-[11px] uppercase">
                    {hasRecordedMarks ? (
                      parseFloat(overallPercentage || '0') >= 40 ? (
                        <span className="text-emerald-800">PASSED</span>
                      ) : (
                        <span className="text-rose-700">RE-APPEAR</span>
                      )
                    ) : (
                      <span className="text-slate-500 font-normal">AWAITING</span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Result Standing & Performance Banner */}
          <div className="my-2 p-2 bg-slate-100 border border-slate-800 rounded-sm grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-slate-500 uppercase text-[9px] font-bold block">Class Standing / Rank:</span>
              <strong className={`text-xs font-extrabold ${rankInfo.isTopper ? 'text-blue-900' : 'text-slate-800'}`}>
                {rankInfo.positionText}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[9px] font-bold block">Academic Result:</span>
              <strong className="text-xs font-extrabold text-emerald-800">
                {hasRecordedMarks ? (parseFloat(overallPercentage || '0') >= 40 ? 'PASSED & PROMOTED' : 'NEEDS RE-APPEAR') : 'AWAITING MARKS'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[9px] font-bold block">Overall Evaluation:</span>
              <strong className="text-xs font-extrabold text-slate-900">
                Grade {gradeInfo.grade} ({gradeInfo.title})
              </strong>
            </div>
          </div>

          {/* Remarks Section */}
          <div className="my-2 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 border border-slate-800 bg-white">
              <span className="font-bold text-slate-800 uppercase block text-[9.5px] border-b border-slate-200 pb-0.5 mb-0.5">
                Class Teacher&apos;s Remarks:
              </span>
              <p className="text-slate-700 italic text-[10px] leading-tight">
                &ldquo;{teacherRemarks}&rdquo;
              </p>
            </div>

            <div className="p-2 border border-slate-800 bg-white">
              <span className="font-bold text-slate-800 uppercase block text-[9.5px] border-b border-slate-200 pb-0.5 mb-0.5">
                Principal&apos;s Message:
              </span>
              <p className="text-slate-700 italic text-[10px] leading-tight">
                &ldquo;{principalMessage}&rdquo;
              </p>
            </div>
          </div>

          {/* Official Signatures & Verification Seal */}
          <div className="mt-4 pt-3 border-t-2 border-slate-900 grid grid-cols-4 gap-3 text-center text-xs">
            {/* Class Teacher */}
            <div className="flex flex-col justify-end">
              <div className="h-8 border-b border-dashed border-slate-500 mb-1 flex items-center justify-center">
                <span className="italic text-xs font-serif text-slate-700 font-bold opacity-75">Teacher Sign</span>
              </div>
              <span className="font-bold text-slate-800 text-[10px]">Class Teacher</span>
            </div>

            {/* Exam Controller */}
            <div className="flex flex-col justify-end">
              <div className="h-8 border-b border-dashed border-slate-500 mb-1 flex items-center justify-center">
                <span className="italic text-xs font-serif text-slate-700 font-bold opacity-75">Controller Sign</span>
              </div>
              <span className="font-bold text-slate-800 text-[10px]">Controller Exam</span>
            </div>

            {/* Parent Signature */}
            <div className="flex flex-col justify-end">
              <div className="h-8 border-b border-dashed border-slate-500 mb-1" />
              <span className="font-bold text-slate-800 text-[10px]">Parent Signature</span>
            </div>

            {/* Principal Stamp & Signature */}
            <div className="flex flex-col items-center justify-end relative">
              <div className="h-8 border-b border-dashed border-slate-500 mb-1 w-full flex items-center justify-center">
                {schoolSettings.principalSignatureUrl ? (
                  <img
                    src={schoolSettings.principalSignatureUrl}
                    alt="Principal Signature"
                    className="max-h-full object-contain mx-auto"
                  />
                ) : (
                  <span
                    className="italic text-sm font-bold text-slate-900 select-none"
                    style={{ fontFamily: '"Brush Script MT", "Dancing Script", cursive' }}
                  >
                    {schoolSettings.principalName || 'Principal'}
                  </span>
                )}
              </div>
              <span className="font-bold text-slate-900 text-[10px]">Principal / Head</span>
            </div>
          </div>

          {/* Verification Timestamp */}
          <div className="mt-2 pt-1 border-t border-slate-300 flex items-center justify-between text-[9px] text-slate-500">
            <span>Issue Date: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span>Doc Ref: {(schoolSettings.affiliationNumber || schoolSettings.schoolCode || 'EDU')}-TR-{student.rollNumber || '01'}</span>
            <span>Controller Verification Seal</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Controls Bar - Hidden during print */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          {/* Term Selection Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Exam Term:
            </span>
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              {(['First Term', 'Mid Term', 'Final Term'] as ExamTerm[]).map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setSelectedTerm(term)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedTerm === term
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Print Scope & Print Button */}
          <div className="flex items-center gap-3">
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setPrintScope('single')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  printScope === 'single'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Single Student
              </button>
              <button
                type="button"
                onClick={() => setPrintScope('batch')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  printScope === 'batch'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Class Batch ({filteredStudents.length})</span>
              </button>
            </div>

            {canPrint && (
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>
                  {printScope === 'batch'
                    ? `Print All (${filteredStudents.length}) Cards`
                    : 'Print Official Result Card'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Class, Section, and Student Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Class Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Class (Classes & Sections)
            </label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSection('All');
                setSelectedStudentId('');
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-hidden"
            >
              <option value="All">All Classes ({availableClasses.length})</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => {
                setSelectedSection(e.target.value);
                setSelectedStudentId('');
              }}
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

          {/* Student Selector (Active only in Single mode) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              {printScope === 'batch' ? 'Student Focus (Batch Active)' : `Student (${filteredStudents.length})`}
            </label>
            <select
              value={targetStudent.id}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-hidden"
            >
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} (Roll #{s.rollNumber || '01'} • {s.class}-{s.section || 'A'})
                  </option>
                ))
              ) : (
                <option value="">No students in this class/section</option>
              )}
            </select>
          </div>
        </div>

        {printScope === 'batch' && (
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl text-xs text-blue-900 dark:text-blue-200">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Batch Print Mode Activated:</strong> Generating official progress report cards for all{' '}
                <strong>{filteredStudents.length} students</strong> in{' '}
                <strong>{selectedClass !== 'All' ? selectedClass : 'all classes'}</strong>{' '}
                {selectedSection !== 'All' ? `(Section ${selectedSection})` : ''}.
              </span>
            </div>
            <span className="font-semibold text-blue-700 dark:text-blue-300 text-[11px]">
              1 Page Per Student (Print-Ready)
            </span>
          </div>
        )}
      </div>

      {/* Render Single Student or Batch Cards */}
      {printScope === 'batch' ? (
        <div className="space-y-8">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => renderCard(student, true))
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                No students found matching current class and section filters.
              </p>
            </div>
          )}
        </div>
      ) : (
        renderCard(targetStudent, false)
      )}
    </div>
  );
};
