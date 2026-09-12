import React, { useState, useMemo } from 'react';
import { useERPData } from '../../context/ERPDataContext';
import { useAuth } from '../../context/AuthContext';
import { PayrollRecord } from '../../types/erp';
import { PageHeader } from '../common/PageHeader';
import { DataTable, Column } from '../common/DataTable';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  Briefcase,
  DollarSign,
  Printer,
  CheckCircle2,
  Calendar,
  CreditCard,
  School,
  Download,
  FileSpreadsheet,
  Play,
  Clock,
  Building,
  UserCheck,
  Filter,
  CheckSquare,
  Square,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

const MONTH_OPTIONS = [
  'September 2026',
  'August 2026',
  'July 2026',
  'June 2026',
  'May 2026',
  'April 2026',
];

// Helper to convert number to words for Pakistani currency formatting
function numberToWordsPKR(num: number): string {
  if (num === 0) return 'Zero Rupees Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n === 0) return '';
    if (n < 20) return a[n] + ' ';
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '') + ' ';
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred ' + inWords(n % 100);
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + inWords(n % 1000);
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + inWords(n % 100000);
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + inWords(n % 10000000);
  }

  return 'Rupees ' + inWords(Math.floor(num)).trim() + ' Only';
}

export const PayrollView: React.FC = () => {
  const {
    payrollRecords,
    staff,
    updatePayrollStatus,
    generateMonthlyPayroll,
    disburseBulkPayroll,
    showToast,
    schoolSettings,
  } = useERPData();
  const { hasModulePermission } = useAuth();

  const canDisburse = hasModulePermission('payroll', 'approve') || hasModulePermission('payroll', 'edit');
  const canPrintPayslip = hasModulePermission('payroll', 'print');

  const [selectedMonth, setSelectedMonth] = useState<string>('August 2026');
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [isPayslipOpen, setIsPayslipOpen] = useState(false);
  const [isBankAdviceOpen, setIsBankAdviceOpen] = useState(false);
  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Cheque' | 'Cash'>('Bank Transfer');
  const [disbursementDate, setDisbursementDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );

  // Filter records by month
  const monthRecords = useMemo(() => {
    if (selectedMonth === 'All Months') return payrollRecords;
    return payrollRecords.filter((p) => p.month === selectedMonth);
  }, [payrollRecords, selectedMonth]);

  // Apply department & status filters
  const filteredRecords = useMemo(() => {
    return monthRecords.filter((p) => {
      const matchDept = departmentFilter === 'All' || p.department === departmentFilter;
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchDept && matchStatus;
    });
  }, [monthRecords, departmentFilter, statusFilter]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    payrollRecords.forEach((p) => {
      if (p.department) set.add(p.department);
    });
    return Array.from(set).sort();
  }, [payrollRecords]);

  // Calculation metrics
  const totalBudget = monthRecords.reduce((sum, p) => sum + p.netSalary, 0);
  const totalDisbursed = monthRecords
    .filter((p) => p.status === 'Paid')
    .reduce((sum, p) => sum + p.netSalary, 0);
  const totalPending = monthRecords
    .filter((p) => p.status !== 'Paid')
    .reduce((sum, p) => sum + p.netSalary, 0);
  const paidCount = monthRecords.filter((p) => p.status === 'Paid').length;
  const pendingCount = monthRecords.filter((p) => p.status !== 'Paid').length;

  // Selected records pending disbursal
  const pendingRecords = monthRecords.filter((p) => p.status !== 'Paid');

  // Handle Run / Generate Payroll
  const handleGeneratePayroll = async () => {
    if (selectedMonth === 'All Months') {
      showToast('Select Month', 'Please select a specific month to run payroll.', 'warning');
      return;
    }
    setIsGenerating(true);
    try {
      const res = await generateMonthlyPayroll(selectedMonth);
      if (res.success) {
        setSelectedIds([]);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Single Disbursal
  const handlePaySalary = (recordId: string) => {
    updatePayrollStatus(recordId, 'Paid', 'Bank Transfer');
  };

  // Handle Bulk Disbursal Trigger
  const handleBulkDisburse = async () => {
    const targetIds = selectedIds.length > 0 ? selectedIds : pendingRecords.map((p) => p.id);
    if (targetIds.length === 0) {
      showToast('No Pending Salaries', 'All staff members are already disbursed.', 'info');
      return;
    }
    await disburseBulkPayroll(targetIds, paymentMethod, disbursementDate);
    setIsDisburseModalOpen(false);
    setSelectedIds([]);
  };

  // Toggle selection for bulk actions
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecords.map((r) => r.id));
    }
  };

  // Export Bank Advice CSV
  const handleExportBankAdviceCsv = () => {
    const headers = ['Sr #', 'Employee ID', 'Name', 'CNIC', 'Department', 'Bank Name', 'Account / IBAN', 'Gross Pay', 'Allowances', 'Deductions', 'Tax', 'Net Disbursed'];
    const rows = monthRecords.map((p, idx) => {
      const staffInfo = staff.find((s) => s.employeeId === p.employeeId || s.id === p.employeeId);
      return [
        idx + 1,
        `"${p.employeeId}"`,
        `"${p.employeeName}"`,
        `"${staffInfo?.cnic || 'N/A'}"`,
        `"${p.department}"`,
        `"${staffInfo?.bankName || 'Meezan Bank Ltd.'}"`,
        `"${staffInfo?.bankAccountNo || '0101-0029384910'}"`,
        p.basicSalary,
        p.allowances,
        p.deductions,
        p.tax,
        p.netSalary,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bank_Salary_Advice_${selectedMonth.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Bank Advice Exported', `Downloaded CSV advice for ${monthRecords.length} records.`);
  };

  const handleOpenPayslip = (p: PayrollRecord) => {
    setSelectedRecord(p);
    setIsPayslipOpen(true);
  };

  const selectedStaffMember = useMemo(() => {
    if (!selectedRecord) return null;
    return staff.find(
      (s) => s.employeeId === selectedRecord.employeeId || s.id === selectedRecord.employeeId
    );
  }, [selectedRecord, staff]);

  // Table Columns
  const baseColumns: Column<PayrollRecord>[] = [
    {
      key: 'employeeName',
      header: 'Staff Member',
      accessor: (p) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{p.employeeName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {p.designation || p.role} • <span className="font-mono">{p.employeeId}</span>
          </p>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      accessor: (p) => (
        <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
          {p.department}
        </span>
      ),
    },
    {
      key: 'basicSalary',
      header: 'Basic Pay',
      accessor: (p) => (
        <span className="text-slate-700 dark:text-slate-300 font-medium">
          Rs. {p.basicSalary.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'allowances',
      header: 'Allowances (+)',
      accessor: (p) => (
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
          +Rs. {p.allowances.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'deductions',
      header: 'Deductions / Tax',
      accessor: (p) => (
        <span className="text-rose-500 font-semibold text-xs">
          -Rs. {(p.deductions + (p.tax || 0)).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'netSalary',
      header: 'Net Disbursed',
      accessor: (p) => (
        <span className="font-extrabold text-slate-900 dark:text-white text-sm">
          Rs. {p.netSalary.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (p) => (
        <div className="flex flex-col gap-0.5">
          <Badge variant={p.status === 'Paid' ? 'success' : 'warning'} size="sm" dot>
            {p.status}
          </Badge>
          {p.paymentDate && (
            <span className="text-[10px] text-slate-400">{p.paymentDate}</span>
          )}
        </div>
      ),
    },
  ];

  const columns: Column<PayrollRecord>[] = (canDisburse || canPrintPayslip)
    ? [
        ...baseColumns,
        {
          key: 'actions',
          header: 'Actions',
          sortable: false,
          accessor: (p) => (
            <div className="flex items-center gap-1.5">
              {canDisburse && p.status !== 'Paid' && (
                <button
                  onClick={() => handlePaySalary(p.id)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  title="Disburse Salary"
                >
                  Disburse
                </button>
              )}
              {canPrintPayslip && (
                <button
                  onClick={() => handleOpenPayslip(p)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Print Payslip"
                >
                  <Printer className="w-4 h-4" />
                </button>
              )}
            </div>
          ),
        },
      ]
    : baseColumns;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Payroll & Salary Disbursal"
        subtitle="Manage faculty payroll, compute allowances/deductions, and generate official institutional payslips"
        badge={
          <Badge variant={pendingCount === 0 ? 'success' : 'primary'}>
            {selectedMonth}: {paidCount} / {monthRecords.length} Paid
          </Badge>
        }
      />

      {/* Control Bar: Month Picker, Generator, Disbursal, & Bank Advice */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Payroll Period:
            </span>
          </div>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {MONTH_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
            <option value="All Months">All Recorded Periods</option>
          </select>

          <span className="text-xs text-slate-400">
            ({monthRecords.length} staff records on file)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canDisburse && (
            <button
              onClick={handleGeneratePayroll}
              disabled={isGenerating || selectedMonth === 'All Months'}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Play className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Computing...' : `Run ${selectedMonth} Payroll`}</span>
            </button>
          )}

          {canDisburse && pendingRecords.length > 0 && (
            <button
              onClick={() => setIsDisburseModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>
                {selectedIds.length > 0
                  ? `Disburse Selected (${selectedIds.length})`
                  : `Disburse All Pending (${pendingRecords.length})`}
              </span>
            </button>
          )}

          <button
            onClick={() => setIsBankAdviceOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Bank Transfer Advice</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payroll Budget</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">
              Rs. {totalBudget.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">{monthRecords.length} Staff Enrolled</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Disbursed (Paid)</p>
            <p className="text-xl font-extrabold text-emerald-600">
              Rs. {totalDisbursed.toLocaleString()}
            </p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
              {paidCount} Staff Member{paidCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Release</p>
            <p className="text-xl font-extrabold text-amber-600">
              Rs. {totalPending.toLocaleString()}
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mt-0.5">
              {pendingCount} Staff Member{pendingCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/60 rounded-xl text-purple-600">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Disbursal Progress</p>
            <p className="text-xl font-extrabold text-purple-600">
              {monthRecords.length > 0 ? Math.round((paidCount / monthRecords.length) * 100) : 0}%
            </p>
            <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all"
                style={{
                  width: `${monthRecords.length > 0 ? (paidCount / monthRecords.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-semibold text-slate-600 dark:text-slate-400">Department:</span>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium"
          >
            <option value="All">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <span className="font-semibold text-slate-600 dark:text-slate-400 ml-2">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span>{selectedIds.length} staff selected</span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Main DataTable */}
      <DataTable
        title={`${selectedMonth} Payroll Ledger`}
        subtitle="Staff Compensation, Allowances, and Tax Deductions (PKR)"
        data={filteredRecords}
        columns={columns}
        keyExtractor={(p) => p.id}
        searchPlaceholder="Search staff member, designation, ID..."
        bulkActions={(ids) => (
          <button
            onClick={() => {
              setSelectedIds(ids);
              setIsDisburseModalOpen(true);
            }}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Disburse Selected ({ids.length})</span>
          </button>
        )}
      />

      {/* Payslip Modal */}
      {selectedRecord && (
        <Modal
          isOpen={isPayslipOpen}
          onClose={() => setIsPayslipOpen(false)}
          title="Official Staff Salary Payslip"
          subtitle="Itemized Monthly Compensation Statement"
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-400 font-mono">
                RECORD ID: {selectedRecord.id}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Official Payslip</span>
                </button>
              </div>
            </div>
          }
        >
          <div className="p-6 bg-white text-slate-900 rounded-xl border border-slate-200 space-y-5 printable-payslip">
            {/* Header / Letterhead */}
            <div className="flex items-start justify-between border-b pb-4 border-slate-200">
              <div className="flex items-center gap-3">
                {schoolSettings?.logoUrl ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-300 bg-white flex items-center justify-center p-1 shrink-0">
                    <img
                      src={schoolSettings.logoUrl}
                      alt={schoolSettings.schoolName || 'Logo'}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0">
                    <School className="w-7 h-7" />
                  </div>
                )}
                <div>
                  <h3 className="font-black text-lg tracking-tight uppercase text-blue-950">
                    {schoolSettings?.schoolName || schoolSettings?.name || 'Academic Institution'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {schoolSettings?.address || (schoolSettings?.city ? `${schoolSettings.city}, ${schoolSettings.country || 'Pakistan'}` : 'Campus Address')}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {schoolSettings?.affiliationNumber ? `Affiliation: ${schoolSettings.affiliationNumber}` : 'Affiliated Educational Institution'} {schoolSettings?.registrationNumber ? `| Reg: ${schoolSettings.registrationNumber}` : ''}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 font-mono text-xs font-bold uppercase tracking-wider">
                  PAYSLIP: {selectedRecord.month.toUpperCase()}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Issued: {new Date().toLocaleDateString('en-GB')}
                </p>
              </div>
            </div>

            {/* Employee Particulars Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Employee Name</span>
                <strong className="text-slate-900 text-sm">{selectedRecord.employeeName}</strong>
                <p className="text-slate-500">{selectedRecord.designation || selectedRecord.role}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Staff ID & Department</span>
                <strong className="text-slate-900 font-mono">{selectedRecord.employeeId}</strong>
                <p className="text-slate-500">{selectedRecord.department}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">CNIC / Identification</span>
                <strong className="text-slate-900 font-mono">
                  {selectedStaffMember?.cnic || '35201-1829384-9'}
                </strong>
                <p className="text-slate-500">Gender: {selectedStaffMember?.gender || 'N/A'}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Bank Name</span>
                <strong className="text-slate-900">
                  {selectedStaffMember?.bankName || schoolSettings?.bankName || 'Direct Deposit'}
                </strong>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Account / IBAN</span>
                <strong className="text-slate-900 font-mono">
                  {selectedStaffMember?.bankAccountNo || 'On Record'}
                </strong>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Disbursal Status</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      selectedRecord.status === 'Paid' ? 'bg-emerald-600' : 'bg-amber-500'
                    }`}
                  />
                  <strong className={selectedRecord.status === 'Paid' ? 'text-emerald-700' : 'text-amber-700'}>
                    {selectedRecord.status} {selectedRecord.paymentDate ? `(${selectedRecord.paymentDate})` : ''}
                  </strong>
                </div>
              </div>
            </div>

            {/* Earnings & Deductions Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
              {/* Earnings Column */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-emerald-50 px-3.5 py-2 border-b border-emerald-100 flex items-center justify-between">
                  <h5 className="font-bold text-xs text-emerald-900 uppercase tracking-wider">
                    Earnings & Allowances
                  </h5>
                  <span className="text-[10px] font-bold text-emerald-700">PKR</span>
                </div>
                <div className="p-3 space-y-2 text-xs divide-y divide-slate-100">
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-600">Basic Salary:</span>
                    <strong className="text-slate-900">
                      Rs. {selectedRecord.basicSalary.toLocaleString()}
                    </strong>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-600">House Rent Allowance (HRA):</span>
                    <span className="text-emerald-700 font-medium">
                      +Rs. {Math.round(selectedRecord.allowances * 0.6).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-600">Medical & Transport Allowance:</span>
                    <span className="text-emerald-700 font-medium">
                      +Rs. {Math.round(selectedRecord.allowances * 0.4).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 font-bold text-slate-900 bg-slate-50 p-2 rounded-lg mt-2">
                    <span>Total Gross Earnings:</span>
                    <span>Rs. {(selectedRecord.basicSalary + selectedRecord.allowances).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Deductions Column */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-rose-50 px-3.5 py-2 border-b border-rose-100 flex items-center justify-between">
                  <h5 className="font-bold text-xs text-rose-900 uppercase tracking-wider">
                    Deductions & Taxes
                  </h5>
                  <span className="text-[10px] font-bold text-rose-700">PKR</span>
                </div>
                <div className="p-3 space-y-2 text-xs divide-y divide-slate-100">
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-600">Income Tax (Withholding):</span>
                    <span className="text-rose-600 font-medium">
                      -Rs. {(selectedRecord.tax || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-600">Provident Fund / EOBI:</span>
                    <span className="text-rose-600 font-medium">
                      -Rs. {(selectedRecord.deductions || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-600">Absence / Unpaid Leaves:</span>
                    <span className="text-slate-500">Rs. 0</span>
                  </div>
                  <div className="flex justify-between pt-2 font-bold text-rose-700 bg-rose-50/50 p-2 rounded-lg mt-2">
                    <span>Total Deductions:</span>
                    <span>-Rs. {(selectedRecord.deductions + (selectedRecord.tax || 0)).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Amount Box */}
            <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="font-bold text-blue-900 text-xs block">Net Payable / Disbursed Salary:</span>
                <p className="text-xs text-blue-700 font-medium italic mt-0.5">
                  {numberToWordsPKR(selectedRecord.netSalary)}
                </p>
              </div>
              <div className="text-right">
                <span className="font-black text-2xl text-blue-950 tracking-tight">
                  Rs. {selectedRecord.netSalary.toLocaleString()}.00
                </span>
                <span className="text-[11px] text-blue-700 block">Payment Method: {selectedRecord.paymentMethod || 'Bank Transfer'}</span>
              </div>
            </div>

            {/* Verification Signatures */}
            <div className="pt-8 border-t border-dashed border-slate-300 grid grid-cols-3 text-center text-xs text-slate-500 gap-4">
              <div className="border-t border-slate-400 pt-1">
                <p className="font-bold text-slate-700">Prepared By</p>
                <p className="text-[10px] text-slate-400">Accountant / Bursar</p>
              </div>

              <div className="border-t border-slate-400 pt-1">
                <p className="font-bold text-slate-700">Approved By</p>
                <p className="text-[10px] text-slate-400">Principal / Director</p>
              </div>

              <div className="border-t border-slate-400 pt-1">
                <p className="font-bold text-slate-700">Employee Signature</p>
                <p className="text-[10px] text-slate-400">Acknowledgement of Receipt</p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Bank Advice Schedule Modal */}
      <Modal
        isOpen={isBankAdviceOpen}
        onClose={() => setIsBankAdviceOpen(false)}
        title="Bank Transfer Advice Schedule"
        subtitle={`Corporate Payroll Disbursement Sheet • ${selectedMonth}`}
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-slate-400">
              Total Transfer Amount: <strong className="text-slate-800 dark:text-white">Rs. {totalBudget.toLocaleString()}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportBankAdviceCsv}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV Sheet</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Schedule</span>
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                {schoolSettings?.schoolName || 'Institutional School Account'}
              </p>
              <p className="text-slate-500">
                School Bank: {schoolSettings?.bankName || 'Meezan Bank Ltd.'} • Account No: {schoolSettings?.accountNumber || '0101-0982374619'}
              </p>
            </div>
            <Badge variant="primary">Month: {selectedMonth}</Badge>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">Emp ID</th>
                  <th className="p-2.5">Employee Name</th>
                  <th className="p-2.5">CNIC</th>
                  <th className="p-2.5">Bank Name</th>
                  <th className="p-2.5">Account / IBAN</th>
                  <th className="p-2.5 text-right">Net Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {monthRecords.map((p, idx) => {
                  const staffInfo = staff.find((s) => s.employeeId === p.employeeId || s.id === p.employeeId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-2.5 font-mono font-semibold text-slate-600 dark:text-slate-400">
                        {p.employeeId}
                      </td>
                      <td className="p-2.5 font-bold">{p.employeeName}</td>
                      <td className="p-2.5 font-mono text-slate-500">{staffInfo?.cnic || '35201-1829384-9'}</td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400">{staffInfo?.bankName || 'Meezan Bank'}</td>
                      <td className="p-2.5 font-mono text-xs">{staffInfo?.bankAccountNo || '0101-0928374829'}</td>
                      <td className="p-2.5 text-right font-extrabold text-slate-900 dark:text-white">
                        Rs. {p.netSalary.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t border-slate-200 dark:border-slate-700">
                <tr>
                  <td colSpan={6} className="p-2.5 text-right uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Total Salary Disbursement:
                  </td>
                  <td className="p-2.5 text-right text-sm text-emerald-600 dark:text-emerald-400 font-extrabold">
                    Rs. {totalBudget.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </Modal>

      {/* Bulk Disburse Confirmation Modal */}
      <Modal
        isOpen={isDisburseModalOpen}
        onClose={() => setIsDisburseModalOpen(false)}
        title="Authorize Salary Disbursement"
        subtitle="Process direct electronic funds transfer or cheque disbursement"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              onClick={() => setIsDisburseModalOpen(false)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkDisburse}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Disburse</span>
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                Ready to release payment for {selectedIds.length > 0 ? selectedIds.length : pendingRecords.length} staff members
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Total amount to be credited:{' '}
                <strong>
                  Rs.{' '}
                  {(selectedIds.length > 0
                    ? monthRecords.filter((p) => selectedIds.includes(p.id))
                    : pendingRecords
                  )
                    .reduce((sum, p) => sum + p.netSalary, 0)
                    .toLocaleString()}
                </strong>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Payment Channel / Instrument
              </label>
              <select
                value={paymentMethod}
                onChange={(e: any) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="Bank Transfer">Bank Direct Deposit / 1-Link Transfer</option>
                <option value="Cheque">Cross Cheque</option>
                <option value="Cash">Cash at Counter</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Payment Date
              </label>
              <input
                type="date"
                value={disbursementDate}
                onChange={(e) => setDisbursementDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-medium"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

