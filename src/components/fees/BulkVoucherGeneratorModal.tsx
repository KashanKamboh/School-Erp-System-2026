import React, { useState, useMemo } from 'react';
import { useERPData } from '../../context/ERPDataContext';
import { FeeVoucher, FeeVoucherItem, Student } from '../../types/erp';
import {
  X,
  FileCheck,
  Users,
  AlertTriangle,
  CheckCircle,
  Filter,
  Calendar,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';

interface BulkVoucherGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (count: number) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const BulkVoucherGeneratorModal: React.FC<BulkVoucherGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    students,
    classes,
    feeStructures,
    feeVouchers,
    schoolSettings,
    generateBulkVouchers,
    seed500DemoStudents,
    showToast,
  } = useERPData();

  const currentMonthIdx = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const [academicYear, setAcademicYear] = useState<string>('2025-2026');
  const [feeMonth, setFeeMonth] = useState<string>(MONTH_NAMES[currentMonthIdx]);
  const [selectedClass, setSelectedClass] = useState<string>('All Classes');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [studentTypeFilter, setStudentTypeFilter] = useState<'All' | 'Regular' | 'New'>('All');

  // Default due date: 10th of the selected month
  const defaultDueDate = useMemo(() => {
    const monthNum = MONTH_NAMES.indexOf(feeMonth) + 1;
    const mStr = monthNum < 10 ? `0${monthNum}` : `${monthNum}`;
    return `${currentYear}-${mStr}-10`;
  }, [feeMonth, currentYear]);

  const [dueDate, setDueDate] = useState<string>(defaultDueDate);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<{
    generatedCount: number;
    skippedCount: number;
    durationMs: number;
  } | null>(null);

  // Filter students based on criteria
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      // Must be active student
      if (st.status && st.status !== 'Active') return false;

      // Class filter
      if (selectedClass !== 'All Classes' && st.class !== selectedClass) return false;

      // Section filter
      if (selectedSection !== 'All' && st.section !== selectedSection) return false;

      // Student type filter
      if (studentTypeFilter !== 'All') {
        const type = st.studentType || 'Regular';
        if (type !== studentTypeFilter) return false;
      }

      return true;
    });
  }, [students, selectedClass, selectedSection, studentTypeFilter]);

  // Pre-calculate fee items and amounts for each filtered student
  const studentFeeRows = useMemo(() => {
    return filteredStudents.map((st) => {
      const type = st.studentType || 'Regular';

      // Check if voucher already generated for this student in this academic year & month
      const alreadyGenerated = feeVouchers.some(
        (v) =>
          v.studentId === st.id &&
          v.feeMonth.trim().toLowerCase() === feeMonth.trim().toLowerCase() &&
          v.academicYear.trim().toLowerCase() === academicYear.trim().toLowerCase()
      );

      // Match applicable fee structures
      const applicableStructures = feeStructures.filter((fs) => {
        if (!fs.isActive) return false;
        // Match student type: 'All' or matches student's type
        if (fs.studentType !== 'All' && fs.studentType !== type) return false;
        // Match class: 'All Classes' or matches student's class
        const fsClass = fs.class || fs.className || 'All Classes';
        if (fsClass !== 'All Classes' && fsClass !== st.class) return false;
        // Match section
        const fsSec = fs.section || fs.sectionName || 'All';
        if (fsSec !== 'All' && fsSec !== st.section) return false;
        return true;
      });

      // Break down items
      let currentCharges = 0;
      const items: FeeVoucherItem[] = [];

      if (applicableStructures.length > 0) {
        applicableStructures.forEach((fs, idx) => {
          items.push({
            id: `item-${st.id}-${idx}`,
            voucherId: '',
            feeStructureId: fs.id,
            feeDescription: fs.feeName || fs.name,
            amount: fs.amount,
            srNo: idx + 1,
          });
          currentCharges += fs.amount;
        });
      } else {
        // Default fallback if no structure configured yet
        const defaultAmount = type === 'New' ? 22000 : 5500;
        const desc = type === 'New' ? 'Admission & Tuition Package' : 'Monthly Tuition & School Fee';
        items.push({
          id: `item-${st.id}-def`,
          voucherId: '',
          feeDescription: desc,
          amount: defaultAmount,
          srNo: 1,
        });
        currentCharges = defaultAmount;
      }

      // Previous balance: take from student or latest unpaid voucher
      const previousBalance = st.previousBalance || 0;

      // Discount / Concession
      const discount = (st as any).feeDiscount || 0;

      // Fine
      const fine = 0;

      const netPayable = Math.max(0, currentCharges + previousBalance - discount + fine);

      return {
        student: st,
        studentType: type,
        alreadyGenerated,
        currentCharges,
        previousBalance,
        discount,
        fine,
        netPayable,
        items,
      };
    });
  }, [filteredStudents, feeStructures, feeVouchers, feeMonth, academicYear]);

  // Update selected students when rows change: auto-select only non-generated rows
  const handleSelectAll = () => {
    const eligibleIds = new Set(
      studentFeeRows.filter((r) => !r.alreadyGenerated).map((r) => r.student.id)
    );
    setSelectedStudentIds(eligibleIds);
  };

  const handleDeselectAll = () => {
    setSelectedStudentIds(new Set());
  };

  const handleToggleStudent = (id: string, alreadyGenerated: boolean) => {
    if (alreadyGenerated) return; // Prevent selecting duplicates
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Generate Action
  const handleGenerate = (targetIds?: Set<string>) => {
    const idsToProcess = targetIds || selectedStudentIds;
    if (idsToProcess.size === 0) {
      showToast('No Students Selected', 'Please select at least one student to generate vouchers.', 'warning');
      return;
    }

    setIsGenerating(true);
    const startTime = performance.now();

    const selectedRows = studentFeeRows.filter(
      (r) => idsToProcess.has(r.student.id) && !r.alreadyGenerated
    );

    const vouchersToCreate: Omit<FeeVoucher, 'id' | 'voucherNo'>[] = selectedRows.map((r) => ({
      studentId: r.student.id,
      studentName: r.student.name || `${r.student.firstName} ${r.student.lastName}`.trim(),
      fatherName: r.student.fatherName || '',
      admissionNo: r.student.admissionNo || r.student.admissionNumber || r.student.rollNumber || 'ADM-000',
      class: r.student.class || (r.student as any).className || 'General',
      className: r.student.class || (r.student as any).className || 'General',
      section: r.student.section || (r.student as any).sectionName || 'A',
      sectionName: r.student.section || (r.student as any).sectionName || 'A',
      rollNumber: r.student.rollNumber || '',
      studentType: r.studentType as 'Regular' | 'New',
      academicYear,
      feeMonth,
      issueDate: new Date().toISOString().substring(0, 10),
      dueDate: dueDate || defaultDueDate,
      currentCharges: r.currentCharges,
      previousBalance: r.previousBalance,
      discount: r.discount,
      fine: r.fine,
      totalPayable: r.netPayable,
      paidAmount: 0,
      remainingBalance: r.netPayable,
      status: 'PENDING',
      items: r.items,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const result = generateBulkVouchers(vouchersToCreate);
    const durationMs = Math.round(performance.now() - startTime);

    setIsGenerating(false);
    setSelectedStudentIds(new Set());
    setGenerationResult({
      generatedCount: result.generatedCount,
      skippedCount: result.skippedCount,
      durationMs,
    });

    if (onSuccess && result.generatedCount > 0) {
      onSuccess(result.generatedCount);
    }
  };

  if (!isOpen) return null;

  // Aggregate stats
  const eligibleCount = studentFeeRows.filter((r) => !r.alreadyGenerated).length;
  const duplicateCount = studentFeeRows.filter((r) => r.alreadyGenerated).length;
  const totalPayableDemand = studentFeeRows
    .filter((r) => selectedStudentIds.has(r.student.id))
    .reduce((sum, r) => sum + r.netPayable, 0);

  return (
    <div
      id="bulk-voucher-generator-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
    >
      <div
        id="bulk-voucher-generator-modal-card"
        className="relative bg-white dark:bg-slate-900 w-full max-w-6xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200 dark:border-slate-800"
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 bg-blue-950 text-white border-b border-blue-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-400 text-blue-950 flex items-center justify-center font-bold shadow-xs">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base tracking-wide text-white flex items-center gap-2">
                <span>Bulk Voucher Generation</span>
                <span className="text-xs bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/40">
                  Pakistani Fee Engine
                </span>
              </h2>
              <p className="text-xs text-blue-200">
                Automated Pakistani fee calculations for New Admissions and Regular Students
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Real Enrolled Students Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-900/80 text-blue-200 text-xs rounded-lg border border-blue-800 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="font-bold text-white">{students.length}</span>
              <span>Enrolled Students</span>
            </div>

            <button
              type="button"
              id="close-bulk-voucher-generator-btn"
              onClick={onClose}
              className="p-2 text-blue-200 hover:text-white hover:bg-blue-900 rounded-lg cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTROLS & FILTERS BAR */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Academic Year */}
            <div>
              <label htmlFor="gen-academic-year-select" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Academic Year
              </label>
              <select
                id="gen-academic-year-select"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 dark:text-white"
              >
                <option value="2025-2026">2025-2026</option>
                <option value="2026-2027">2026-2027</option>
                <option value="2024-2025">2024-2025</option>
              </select>
            </div>

            {/* Fee Month */}
            <div>
              <label htmlFor="gen-fee-month-select" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Fee Month
              </label>
              <select
                id="gen-fee-month-select"
                value={feeMonth}
                onChange={(e) => setFeeMonth(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 font-bold text-blue-900 dark:text-amber-300"
              >
                {MONTH_NAMES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Class */}
            <div>
              <label htmlFor="gen-class-select" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Class
              </label>
              <select
                id="gen-class-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
              >
                <option value="All Classes">All Classes ({classes.length})</option>
                {Array.from(new Set(classes.map((c) => c.name))).map((cName) => (
                  <option key={cName} value={cName}>
                    {cName}
                  </option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div>
              <label htmlFor="gen-section-select" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Section
              </label>
              <select
                id="gen-section-select"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
              >
                <option value="All">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>

            {/* Student Type */}
            <div>
              <label htmlFor="gen-student-type-select" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Student Type
              </label>
              <select
                id="gen-student-type-select"
                value={studentTypeFilter}
                onChange={(e) => setStudentTypeFilter(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
              >
                <option value="All">All Types</option>
                <option value="Regular">Regular Student</option>
                <option value="New">New Student</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="gen-due-date-input" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Due Date
              </label>
              <input
                type="date"
                id="gen-due-date-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>
        </div>

        {/* METRICS & SELECTION STATUS STRIP */}
        <div className="px-6 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">Total Active Students:</span>
              <span className="font-bold font-mono text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-sm">
                {studentFeeRows.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">Eligible:</span>
              <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-sm">
                {eligibleCount}
              </span>
            </div>

            {duplicateCount > 0 && (
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-sm">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{duplicateCount} already generated for {feeMonth}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">Selected:</span>
              <span className="font-bold font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-sm">
                {selectedStudentIds.size}
              </span>
            </div>

            {selectedStudentIds.size > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 dark:text-slate-400">Total Demanded:</span>
                <span className="font-black font-mono text-slate-900 dark:text-amber-300">
                  Rs. {totalPayableDemand.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Quick Selection Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="bulk-select-all-btn"
              onClick={handleSelectAll}
              className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md cursor-pointer transition-colors"
            >
              Select All Eligible ({eligibleCount})
            </button>
            <button
              type="button"
              id="bulk-deselect-all-btn"
              onClick={handleDeselectAll}
              className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* SUCCESS SUMMARY POPUP BANNER */}
        {generationResult && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                  Generated {generationResult.generatedCount} Fee Vouchers in {generationResult.durationMs}ms!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  {generationResult.skippedCount > 0 && `${generationResult.skippedCount} duplicate vouchers were safely skipped. `}
                  Vouchers are now live in the database and ready for dual-copy printing.
                </p>
              </div>
            </div>
            <button
              type="button"
              id="dismiss-generation-result-btn"
              onClick={() => setGenerationResult(null)}
              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-md cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* STUDENT ROSTER TABLE */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      id="table-master-checkbox"
                      checked={selectedStudentIds.size > 0 && selectedStudentIds.size === eligibleCount}
                      onChange={(e) => (e.target.checked ? handleSelectAll() : handleDeselectAll())}
                      className="rounded-xs text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3">Student</th>
                  <th className="p-3">Admission No.</th>
                  <th className="p-3">Class & Section</th>
                  <th className="p-3">Student Type</th>
                  <th className="p-3 text-right">Current Fee</th>
                  <th className="p-3 text-right">Previous Balance</th>
                  <th className="p-3 text-right">Discount</th>
                  <th className="p-3 text-right">Fine</th>
                  <th className="p-3 text-right font-black">Net Payable</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {studentFeeRows.length > 0 ? (
                  studentFeeRows.map((row) => {
                    const isSelected = selectedStudentIds.has(row.student.id);
                    return (
                      <tr
                        key={row.student.id}
                        className={`transition-colors ${
                          row.alreadyGenerated
                            ? 'bg-slate-50/50 dark:bg-slate-900/40 opacity-60'
                            : isSelected
                            ? 'bg-blue-50/60 dark:bg-blue-950/30'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={row.alreadyGenerated}
                            onChange={() => handleToggleStudent(row.student.id, row.alreadyGenerated)}
                            className="rounded-xs text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {row.student.name || `${row.student.firstName} ${row.student.lastName}`.trim()}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Father: {row.student.fatherName || '—'}
                          </div>
                        </td>
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                          {row.student.admissionNumber || row.student.rollNumber || '—'}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            {row.student.class} - {row.student.section}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              row.studentType === 'New'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                            }`}
                          >
                            {row.studentType === 'New' ? 'New Student' : 'Regular Student'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                          Rs. {row.currentCharges.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono text-amber-700 dark:text-amber-400">
                          {row.previousBalance > 0 ? `Rs. ${row.previousBalance.toLocaleString()}` : '—'}
                        </td>
                        <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                          {row.discount > 0 ? `- Rs. ${row.discount.toLocaleString()}` : '—'}
                        </td>
                        <td className="p-3 text-right font-mono text-rose-600 dark:text-rose-400">
                          {row.fine > 0 ? `+ Rs. ${row.fine.toLocaleString()}` : '—'}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-slate-900 dark:text-amber-300 text-sm">
                          Rs. {row.netPayable.toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          {row.alreadyGenerated ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                              Already Created
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                              Ready
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No active students found matching the selected class and section criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL FOOTER ACTION BAR */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {selectedStudentIds.size > 0 ? (
              <span>
                Ready to generate <strong className="text-blue-600 dark:text-blue-400">{selectedStudentIds.size}</strong> fee voucher{selectedStudentIds.size > 1 ? 's' : ''} for <strong>{feeMonth} {academicYear}</strong>.
              </span>
            ) : (
              <span>Select students above or click "Generate All" to process all eligible students.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="cancel-bulk-generation-btn"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-lg cursor-pointer transition-colors"
            >
              Cancel
            </button>

            {/* Generate Selected */}
            <button
              type="button"
              id="generate-selected-vouchers-btn"
              disabled={isGenerating || selectedStudentIds.size === 0}
              onClick={() => handleGenerate()}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : `Generate Selected (${selectedStudentIds.size})`}
            </button>

            {/* Generate All Eligible */}
            <button
              type="button"
              id="generate-all-vouchers-btn"
              disabled={isGenerating || eligibleCount === 0}
              onClick={() => {
                const allEligibleIds = new Set(
                  studentFeeRows.filter((r) => !r.alreadyGenerated).map((r) => r.student.id)
                );
                handleGenerate(allEligibleIds);
              }}
              className="flex items-center gap-1.5 px-5 py-2 bg-amber-400 hover:bg-amber-300 text-blue-950 font-black text-xs rounded-lg cursor-pointer transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Zap className="w-4 h-4 text-blue-950" />
              <span>{isGenerating ? 'Generating...' : `Generate All (${eligibleCount})`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
