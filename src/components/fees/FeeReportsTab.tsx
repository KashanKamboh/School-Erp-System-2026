import React, { useState, useMemo } from 'react';
import { useERPData } from '../../context/ERPDataContext';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  Users,
  AlertCircle,
  FileSpreadsheet,
  TrendingUp,
  Landmark,
  UserCheck,
} from 'lucide-react';

export const FeeReportsTab: React.FC = () => {
  const {
    feeVouchers,
    feePayments,
    students,
    classes,
    schoolSettings,
  } = useERPData();

  const [activeReport, setActiveReport] = useState<
    'daily' | 'monthly' | 'outstanding' | 'classwise' | 'ledger'
  >('daily');

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [selectedClass, setSelectedClass] = useState('All Classes');

  // Daily Collection Calculation
  const dailyPayments = useMemo(() => {
    return feePayments.filter((p) => p.paymentDate === selectedDate);
  }, [feePayments, selectedDate]);

  const dailyTotal = dailyPayments.reduce((sum, p) => sum + p.amountPaid, 0);

  // Class-wise Collection Breakdown
  const classWiseData = useMemo(() => {
    const classNames = Array.from(new Set(classes.map((c) => c.name)));
    return classNames.map((cName) => {
      const classVouchers = feeVouchers.filter((v) => v.class === cName);
      const demanded = classVouchers.reduce((sum, v) => sum + (v.totalPayable || 0), 0);
      const collected = classVouchers.reduce((sum, v) => sum + (v.paidAmount || 0), 0);
      const balance = demanded - collected;
      const rate = demanded > 0 ? Math.round((collected / demanded) * 100) : 0;

      return {
        className: cName,
        voucherCount: classVouchers.length,
        demanded,
        collected,
        balance,
        recoveryRate: rate,
      };
    });
  }, [classes, feeVouchers]);

  // Outstanding / Defaulters
  const outstandingVouchers = useMemo(() => {
    return feeVouchers
      .filter((v) => v.remainingBalance > 0)
      .sort((a, b) => b.remainingBalance - a.remainingBalance);
  }, [feeVouchers]);

  // Student Ledger
  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const studentVouchers = feeVouchers.filter((v) => v.studentId === selectedStudentId);
  const studentPayments = feePayments.filter((p) => p.studentId === selectedStudentId);

  // Combined ledger entries sorted chronologically
  const ledgerEntries = useMemo(() => {
    const entries: Array<{
      date: string;
      description: string;
      refNo: string;
      debit: number; // charges
      credit: number; // payments
      balance: number;
    }> = [];

    let runningBalance = 0;

    // Sort all events by date
    const allEvents = [
      ...studentVouchers.map((v) => ({
        type: 'VOUCHER',
        date: v.issueDate || v.createdAt.substring(0, 10),
        description: `Fee Voucher (${v.feeMonth} - ${v.academicYear})`,
        refNo: v.voucherNo,
        amount: v.totalPayable,
      })),
      ...studentPayments.map((p) => ({
        type: 'PAYMENT',
        date: p.paymentDate,
        description: `Payment Received via ${p.paymentMethod} (${p.remarks || 'Standard receipt'})`,
        refNo: p.receiptNo,
        amount: p.amountPaid,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const ev of allEvents) {
      if (ev.type === 'VOUCHER') {
        runningBalance += ev.amount;
        entries.push({
          date: ev.date,
          description: ev.description,
          refNo: ev.refNo,
          debit: ev.amount,
          credit: 0,
          balance: runningBalance,
        });
      } else {
        runningBalance -= ev.amount;
        entries.push({
          date: ev.date,
          description: ev.description,
          refNo: ev.refNo,
          debit: 0,
          credit: ev.amount,
          balance: Math.max(0, runningBalance),
        });
      }
    }

    return entries;
  }, [studentVouchers, studentPayments]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeReport === 'daily') {
      csvContent += 'Receipt No,Student Name,Class,Section,Amount (PKR),Payment Method,Date,Cashier\n';
      dailyPayments.forEach((p) => {
        csvContent += `"${p.receiptNo}","${p.studentName}","${p.class}","${p.section}",${p.amountPaid},"${p.paymentMethod}","${p.paymentDate}","${p.receivedBy}"\n`;
      });
    } else if (activeReport === 'outstanding') {
      csvContent += 'Voucher No,Student Name,Class,Section,Due Date,Total Demanded,Paid,Balance Due,Status\n';
      outstandingVouchers.forEach((v) => {
        csvContent += `"${v.voucherNo}","${v.studentName}","${v.class}","${v.section}","${v.dueDate}",${v.totalPayable},${v.paidAmount},${v.remainingBalance},"${v.status}"\n`;
      });
    } else if (activeReport === 'classwise') {
      csvContent += 'Class,Vouchers Count,Demanded (PKR),Collected (PKR),Outstanding (PKR),Recovery Rate (%)\n';
      classWiseData.forEach((c) => {
        csvContent += `"${c.className}",${c.voucherCount},${c.demanded},${c.collected},${c.balance},${c.recoveryRate}%\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `edupulse_${activeReport}_report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="fee-reports-tab" className="space-y-6">
      {/* Report Switcher & Actions Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs print:hidden">
        {/* Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            type="button"
            id="rep-tab-daily"
            onClick={() => setActiveReport('daily')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
              activeReport === 'daily'
                ? 'bg-blue-900 text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Daily Collection
          </button>
          <button
            type="button"
            id="rep-tab-outstanding"
            onClick={() => setActiveReport('outstanding')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
              activeReport === 'outstanding'
                ? 'bg-blue-900 text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Outstanding & Overdue
          </button>
          <button
            type="button"
            id="rep-tab-classwise"
            onClick={() => setActiveReport('classwise')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
              activeReport === 'classwise'
                ? 'bg-blue-900 text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Class-wise Recovery
          </button>
          <button
            type="button"
            id="rep-tab-ledger"
            onClick={() => setActiveReport('ledger')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
              activeReport === 'ledger'
                ? 'bg-blue-900 text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Student Fee Ledger
          </button>
        </div>

        {/* Global Export & Print Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            id="report-export-csv-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-lg cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            id="report-print-view-btn"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-amber-400 font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* REPORT 1: DAILY COLLECTION */}
      {activeReport === 'daily' && (
        <div id="daily-collection-report" className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Daily Counter & Bank Collection Summary
                </h3>
                <p className="text-xs text-slate-500">
                  Itemized ledger of verified receipts for the selected day
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md font-semibold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Daily stats summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Payments</span>
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {dailyPayments.length} transactions
                </span>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300 block">Total Collected</span>
                <span className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-400">
                  Rs. {dailyTotal.toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800">
                <span className="text-[10px] font-bold uppercase text-blue-800 dark:text-blue-300 block">Date</span>
                <span className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                  {selectedDate}
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase text-[10.5px]">
                    <th className="p-3">Receipt No</th>
                    <th className="p-3">Voucher Ref</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Class & Sec</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Cashier</th>
                    <th className="p-3 text-right">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {dailyPayments.length > 0 ? (
                    dailyPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-blue-900 dark:text-blue-300">
                          {p.receiptNo}
                        </td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                          {p.voucherNo}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white">{p.studentName}</div>
                          <div className="text-[10px] text-slate-400">Adm: {p.admissionNo}</div>
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">
                          {p.class} - {p.section}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          {p.receivedBy}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-sm text-slate-900 dark:text-white">
                          Rs. {p.amountPaid.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No payments were recorded for {selectedDate}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 2: OUTSTANDING & OVERDUE */}
      {activeReport === 'outstanding' && (
        <div id="outstanding-report" className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Outstanding & Overdue Fee Balances
              </h3>
              <p className="text-xs text-slate-500">
                Active fee vouchers with pending arrears and remaining balances
              </p>
            </div>

            <div className="overflow-x-auto my-4 border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase text-[10.5px]">
                    <th className="p-3">Voucher #</th>
                    <th className="p-3">Student</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">Month</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3 text-right">Total Demanded</th>
                    <th className="p-3 text-right">Paid</th>
                    <th className="p-3 text-right font-black">Balance Due</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {outstandingVouchers.length > 0 ? (
                    outstandingVouchers.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-blue-900 dark:text-blue-300">
                          {v.voucherNo}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white">{v.studentName}</div>
                          <div className="text-[10px] text-slate-400">Adm: {v.admissionNo}</div>
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">
                          {v.class} - {v.section}
                        </td>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                          {v.feeMonth}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          {v.dueDate}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                          Rs. {v.totalPayable.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                          Rs. {v.paidAmount.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                          Rs. {v.remainingBalance.toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase ${
                              v.status === 'OVERDUE'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        All fee vouchers have been fully settled! No outstanding dues.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 3: CLASS-WISE RECOVERY */}
      {activeReport === 'classwise' && (
        <div id="classwise-report" className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Class-wise Fee Recovery Analysis
              </h3>
              <p className="text-xs text-slate-500">
                Recovery metrics and realization percentages across each grade
              </p>
            </div>

            <div className="overflow-x-auto my-4 border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase text-[10.5px]">
                    <th className="p-3">Class</th>
                    <th className="p-3 text-center">Vouchers</th>
                    <th className="p-3 text-right">Total Demanded (PKR)</th>
                    <th className="p-3 text-right">Total Collected (PKR)</th>
                    <th className="p-3 text-right font-bold">Outstanding (PKR)</th>
                    <th className="p-3 w-48">Recovery Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {classWiseData.map((cd) => (
                    <tr key={cd.className} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-white text-sm">
                        {cd.className}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-600 dark:text-slate-400">
                        {cd.voucherCount}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                        Rs. {cd.demanded.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        Rs. {cd.collected.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                        Rs. {cd.balance.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                cd.recoveryRate >= 80
                                  ? 'bg-emerald-500'
                                  : cd.recoveryRate >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, cd.recoveryRate)}%` }}
                            ></div>
                          </div>
                          <span className="font-mono font-bold text-xs w-9 text-right text-slate-800 dark:text-slate-200">
                            {cd.recoveryRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 4: STUDENT FEE LEDGER */}
      {activeReport === 'ledger' && (
        <div id="student-ledger-report" className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Individual Student Fee Ledger
                </h3>
                <p className="text-xs text-slate-500">
                  Chronological account statement with debits, credits, and running balance
                </p>
              </div>

              {/* Student selector */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  Select Student:
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md font-medium text-slate-900 dark:text-white max-w-xs"
                >
                  {students.slice(0, 50).map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name || `${st.firstName} ${st.lastName}`.trim()} ({st.class}-{st.section})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Student Info Card */}
            {selectedStudent && (
              <div className="my-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10.5px]">Student Name:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedStudent.name || `${selectedStudent.firstName} ${selectedStudent.lastName}`.trim()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10.5px]">Admission / Roll No:</span>
                  <span className="font-mono font-bold text-blue-900 dark:text-blue-300">
                    {selectedStudent.admissionNumber || selectedStudent.rollNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10.5px]">Class & Section:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedStudent.class} - {selectedStudent.section}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10.5px]">Current Net Balance:</span>
                  <span className="font-mono font-black text-rose-600 dark:text-rose-400">
                    Rs. {(selectedStudent.previousBalance || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Ledger Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase text-[10.5px]">
                    <th className="p-3">Date</th>
                    <th className="p-3">Ref No</th>
                    <th className="p-3">Particulars / Description</th>
                    <th className="p-3 text-right">Debit / Charges</th>
                    <th className="p-3 text-right">Credit / Paid</th>
                    <th className="p-3 text-right font-black">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {ledgerEntries.length > 0 ? (
                    ledgerEntries.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                          {entry.date}
                        </td>
                        <td className="p-3 font-mono font-bold text-blue-900 dark:text-blue-300">
                          {entry.refNo}
                        </td>
                        <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                          {entry.description}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                          {entry.debit > 0 ? `Rs. ${entry.debit.toLocaleString()}` : '—'}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {entry.credit > 0 ? `Rs. ${entry.credit.toLocaleString()}` : '—'}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-slate-900 dark:text-amber-300">
                          Rs. {entry.balance.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No financial activity found for this student.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
