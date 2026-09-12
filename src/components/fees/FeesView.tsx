import React, { useState, useMemo } from 'react';
import { useERPData } from '../../context/ERPDataContext';
import { useAuth } from '../../context/AuthContext';
import { FeeVoucher, FeePayment } from '../../types/erp';
import { PageHeader } from '../common/PageHeader';
import { FeeVoucherPrintModal } from './FeeVoucherPrintModal';
import { PaymentCollectionModal } from './PaymentCollectionModal';
import { PaymentReceiptModal } from './PaymentReceiptModal';
import { BulkVoucherGeneratorModal } from './BulkVoucherGeneratorModal';
import { FeeStructureTab } from './FeeStructureTab';
import { FeeReportsTab } from './FeeReportsTab';
import {
  CreditCard,
  Plus,
  Printer,
  FileCheck,
  Search,
  Filter,
  Layers,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Landmark,
  Zap,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  Download,
  RefreshCw,
  Trash2,
} from 'lucide-react';

export const FeesView: React.FC = () => {
  const {
    feeVouchers,
    feePayments,
    schoolSettings,
    classes,
    feeMetrics,
    refreshFees,
    deleteFeeVoucher,
    showToast,
  } = useERPData();

  const { currentUser, hasModulePermission } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshFees();
      showToast('Data Refreshed', 'Fee records synchronized with persistent database.', 'success');
    } catch {
      showToast('Sync Error', 'Failed to refresh fees from server.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<
    'vouchers' | 'outstanding' | 'receipts' | 'structure' | 'reports'
  >('vouchers');

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PARTIALLY PAID' | 'PAID' | 'OVERDUE'>('ALL');
  const [classFilter, setClassFilter] = useState('All Classes');
  const [monthFilter, setMonthFilter] = useState('All Months');

  // Modals state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printVouchersList, setPrintVouchersList] = useState<FeeVoucher[]>([]);
  const [printInitialIndex, setPrintInitialIndex] = useState(0);

  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [selectedVoucherForPayment, setSelectedVoucherForPayment] = useState<FeeVoucher | null>(null);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedPaymentReceipt, setSelectedPaymentReceipt] = useState<FeePayment | null>(null);

  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);

  // Filter vouchers based on search & criteria
  const filteredVouchers = useMemo(() => {
    return feeVouchers.filter((v) => {
      // Role scope (Students & Parents only see their own vouchers)
      if (currentUser.role === 'Student') {
        if (currentUser.studentId && v.studentId !== currentUser.studentId && v.admissionNo !== currentUser.studentId) return false;
        if (!currentUser.studentId && currentUser.name && !v.studentName.toLowerCase().includes(currentUser.name.toLowerCase())) return false;
      }
      if (currentUser.role === 'Parent') {
        if (currentUser.parentChildIds && currentUser.parentChildIds.length > 0) {
          if (!currentUser.parentChildIds.includes(v.studentId)) return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = v.studentName.toLowerCase().includes(q);
        const matchFather = (v.fatherName || '').toLowerCase().includes(q);
        const matchVoucher = v.voucherNo.toLowerCase().includes(q);
        const matchAdm = (v.admissionNo || '').toLowerCase().includes(q);
        if (!matchName && !matchFather && !matchVoucher && !matchAdm) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'OVERDUE') {
          const isOverdue = v.status === 'OVERDUE' || (v.status !== 'PAID' && new Date(v.dueDate) < new Date());
          if (!isOverdue) return false;
        } else if (v.status !== statusFilter) {
          return false;
        }
      }

      // Class filter
      if (classFilter !== 'All Classes' && v.class !== classFilter) return false;

      // Month filter
      if (monthFilter !== 'All Months' && v.feeMonth !== monthFilter) return false;

      return true;
    });
  }, [feeVouchers, searchQuery, statusFilter, classFilter, monthFilter, currentUser]);

  // Outstanding vouchers for the dedicated Pending/Outstanding collection tab
  const outstandingVouchers = useMemo(() => {
    return feeVouchers.filter((v) => {
      if (v.remainingBalance <= 0) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          v.studentName.toLowerCase().includes(q) ||
          v.voucherNo.toLowerCase().includes(q) ||
          (v.admissionNo || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [feeVouchers, searchQuery]);

  // Actions
  const handleOpenPrintSingle = (voucher: FeeVoucher) => {
    setPrintVouchersList([voucher]);
    setPrintInitialIndex(0);
    setIsPrintModalOpen(true);
  };

  const handleOpenPrintFiltered = () => {
    if (filteredVouchers.length === 0) {
      showToast('No Vouchers', 'No vouchers match the current filter criteria.', 'warning');
      return;
    }
    setPrintVouchersList(filteredVouchers);
    setPrintInitialIndex(0);
    setIsPrintModalOpen(true);
  };

  const handleOpenCollectPayment = (voucher: FeeVoucher) => {
    setSelectedVoucherForPayment(voucher);
    setIsCollectModalOpen(true);
  };

  const handlePaymentSuccess = (payment: FeePayment) => {
    setIsCollectModalOpen(false);
    setSelectedPaymentReceipt(payment);
    setIsReceiptModalOpen(true);
  };

  const handleOpenReceipt = (payment: FeePayment) => {
    setSelectedPaymentReceipt(payment);
    setIsReceiptModalOpen(true);
  };

  // Distinct months present in vouchers for filter dropdown
  const distinctMonths = Array.from(new Set(feeVouchers.map((v) => v.feeMonth)));
  const distinctClasses = Array.from(new Set(classes.map((c) => c.name)));

  return (
    <div id="fees-management-view" className="space-y-6 pb-12">
      {/* Top Header with Breadcrumb & Primary Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <PageHeader
          title="Fee Management & Collection"
          subtitle="Pakistani Fee Voucher Engine • Dual-Copy Printing • Automated Arrears & Recovery Tracking"
        />

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sync SQLite Data */}
          <button
            type="button"
            id="refresh-fees-btn"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-lg cursor-pointer transition-colors border border-slate-300 dark:border-slate-700 disabled:opacity-50"
            title="Synchronize fee vouchers and payments directly with SQLite database"
          >
            <RefreshCw className={`w-4 h-4 text-blue-600 dark:text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Database'}</span>
          </button>

          {/* Bulk Voucher Generation Button */}
          <button
            type="button"
            id="open-bulk-generator-btn"
            onClick={() => setIsGeneratorModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-blue-950 font-black text-xs rounded-lg cursor-pointer transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Vouchers (Bulk)</span>
          </button>
        </div>
      </div>

      {/* FINANCIAL METRICS STRIP (PKR / Rs.) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Demanded */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Fee Demanded
            </span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-slate-900 dark:text-white">
            Rs. {feeMetrics.totalDemanded.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Across {feeVouchers.length} issued fee vouchers
          </p>
        </div>

        {/* Total Collected */}
        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-4 shadow-xs bg-gradient-to-br from-white to-emerald-50/40 dark:from-slate-900 dark:to-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Total Fee Collected
            </span>
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">
            Rs. {feeMetrics.totalCollected.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Realization: {feeMetrics.totalDemanded > 0 ? Math.round((feeMetrics.totalCollected / feeMetrics.totalDemanded) * 100) : 0}% recovery rate
          </p>
        </div>

        {/* Outstanding Dues */}
        <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 shadow-xs bg-gradient-to-br from-white to-amber-50/40 dark:from-slate-900 dark:to-amber-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Outstanding Dues
            </span>
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-amber-700 dark:text-amber-400">
            Rs. {feeMetrics.outstandingFees.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Pending student balances to recover
          </p>
        </div>

        {/* Overdue Amount */}
        <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-xl p-4 shadow-xs bg-gradient-to-br from-white to-rose-50/40 dark:from-slate-900 dark:to-rose-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
              Overdue Fees (Past Due)
            </span>
            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
            Rs. {feeMetrics.overdueFees.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Subject to Rs. {schoolSettings.lateFeeAmount || 300} fine per voucher
          </p>
        </div>
      </div>

      {/* MAIN MODULE NAVIGATION TABS */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
        <button
          type="button"
          id="tab-btn-vouchers"
          onClick={() => setActiveTab('vouchers')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'vouchers'
              ? 'border-blue-900 text-blue-950 dark:border-amber-400 dark:text-amber-400 font-extrabold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Fee Vouchers</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10.5px] bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 font-mono font-bold">
            {feeVouchers.length}
          </span>
        </button>

        <button
          type="button"
          id="tab-btn-outstanding"
          onClick={() => setActiveTab('outstanding')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'outstanding'
              ? 'border-blue-900 text-blue-950 dark:border-amber-400 dark:text-amber-400 font-extrabold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Pending / Outstanding</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10.5px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono font-bold">
            {feeVouchers.filter((v) => v.remainingBalance > 0).length}
          </span>
        </button>

        <button
          type="button"
          id="tab-btn-receipts"
          onClick={() => setActiveTab('receipts')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'receipts'
              ? 'border-blue-900 text-blue-950 dark:border-amber-400 dark:text-amber-400 font-extrabold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Payment Receipts</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10.5px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono font-bold">
            {feePayments.length}
          </span>
        </button>

        <button
          type="button"
          id="tab-btn-structure"
          onClick={() => setActiveTab('structure')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'structure'
              ? 'border-blue-900 text-blue-950 dark:border-amber-400 dark:text-amber-400 font-extrabold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Settings → Fee Structure</span>
        </button>

        <button
          type="button"
          id="tab-btn-reports"
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'reports'
              ? 'border-blue-900 text-blue-950 dark:border-amber-400 dark:text-amber-400 font-extrabold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>Reports & Ledgers</span>
        </button>
      </div>

      {/* TAB 1: FEE VOUCHERS LIST */}
      {activeTab === 'vouchers' && (
        <div id="vouchers-view-content" className="space-y-4">
          {/* SEARCH & FILTERS BAR */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                id="search-vouchers-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student, father, voucher #..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
              {/* Status filter */}
              <select
                id="voucher-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PARTIALLY PAID">Partially Paid</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
              </select>

              {/* Class filter */}
              <select
                id="voucher-class-filter"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
              >
                <option value="All Classes">All Classes</option>
                {distinctClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>

              {/* Month filter */}
              <select
                id="voucher-month-filter"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
              >
                <option value="All Months">All Months</option>
                {distinctMonths.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Bulk Print Filtered */}
              <button
                type="button"
                id="bulk-print-filtered-btn"
                onClick={handleOpenPrintFiltered}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-900 hover:bg-blue-800 text-amber-400 font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-xs"
                title="Print all vouchers matching the current filters"
              >
                <Printer className="w-4 h-4" />
                <span>Bulk Print ({filteredVouchers.length})</span>
              </button>
            </div>
          </div>

          {/* VOUCHERS TABLE */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 uppercase text-[10.5px] font-bold">
                    <th className="p-3.5 pl-6">Voucher No.</th>
                    <th className="p-3.5">Student & Father</th>
                    <th className="p-3.5">Class & Sec</th>
                    <th className="p-3.5">Fee Month</th>
                    <th className="p-3.5">Due Date</th>
                    <th className="p-3.5 text-right">Demanded</th>
                    <th className="p-3.5 text-right">Paid</th>
                    <th className="p-3.5 text-right font-black">Balance Due</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredVouchers.length > 0 ? (
                    filteredVouchers.map((v) => (
                      <tr
                        key={v.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="p-3.5 pl-6">
                          <span className="font-mono font-bold text-blue-900 dark:text-amber-300 block">
                            {v.voucherNo}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {v.studentType === 'New' ? 'New Admission' : 'Regular'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 dark:text-white text-sm">
                            {v.studentName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Father: {v.fatherName || '—'} • Adm #: <span className="font-mono">{v.admissionNo}</span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            {v.class} - {v.section}
                          </span>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                          {v.feeMonth}
                        </td>
                        <td className="p-3.5">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">
                            {v.dueDate}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                          Rs. {v.totalPayable.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          Rs. {v.paidAmount.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-right font-mono font-black text-sm text-rose-600 dark:text-rose-400">
                          Rs. {v.remainingBalance.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-xs text-[10.5px] font-bold uppercase ${
                              v.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : v.status === 'PARTIALLY PAID'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : v.status === 'OVERDUE'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {v.status}
                          </span>
                        </td>
                        <td className="p-3.5 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Collect Payment Button */}
                            {v.remainingBalance > 0 && (
                              <button
                                type="button"
                                onClick={() => handleOpenCollectPayment(v)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-md text-xs cursor-pointer shadow-xs transition-colors"
                                title="Collect Fee Payment"
                              >
                                Collect
                              </button>
                            )}

                            {/* Print Voucher (Dual Copy) Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenPrintSingle(v)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-blue-900 hover:bg-blue-800 text-amber-400 font-bold rounded-md text-xs cursor-pointer transition-colors shadow-xs"
                              title="Print 2-Copy Voucher (School + Parent)"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Voucher</span>
                            </button>

                            {/* Void / Delete Voucher */}
                            {hasModulePermission('fees', 'delete') && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to void/delete voucher ${v.voucherNo} for ${v.studentName}?`)) {
                                    deleteFeeVoucher(v.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer"
                                title="Void / Delete Voucher"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500">
                        No fee vouchers found matching the active filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PENDING / OUTSTANDING ARREARS COLLECTION */}
      {activeTab === 'outstanding' && (
        <div id="outstanding-view-content" className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Fee Collection Desk — Defaulters & Pending Arrears</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-mono font-bold">
                    {outstandingVouchers.length} pending
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Search student name or voucher # to record partial or full fee deposit immediately
                </p>
              </div>

              {/* Quick Search */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student or voucher #..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 my-2">
              {outstandingVouchers.length > 0 ? (
                outstandingVouchers.map((v) => (
                  <div
                    key={v.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 px-2 rounded-lg transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {v.studentName}
                        </span>
                        <span className="font-mono text-xs text-blue-800 dark:text-amber-300 font-bold bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-xs">
                          {v.voucherNo}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({v.class}-{v.section})
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                        <span>Father: {v.fatherName || '—'}</span>
                        <span>Adm #: {v.admissionNo}</span>
                        <span>Month: <strong>{v.feeMonth}</strong></span>
                        <span>Due: {v.dueDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="text-[10.5px] font-bold text-slate-400 uppercase block">Balance Due</span>
                        <span className="text-base font-black font-mono text-rose-600 dark:text-rose-400">
                          Rs. {v.remainingBalance.toLocaleString()}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenCollectPayment(v)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-xs"
                      >
                        Collect Payment
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-500">
                  No outstanding vouchers found. All students are up to date with their fees!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENT RECEIPTS HISTORY */}
      {activeTab === 'receipts' && (
        <div id="receipts-view-content" className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Official Fee Payment Receipts
              </h3>
              <span className="text-xs text-slate-500">
                {feePayments.length} receipts issued
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 uppercase text-[10.5px] font-bold">
                    <th className="p-3.5 pl-6">Receipt No.</th>
                    <th className="p-3.5">Voucher Ref</th>
                    <th className="p-3.5">Student Name</th>
                    <th className="p-3.5">Class</th>
                    <th className="p-3.5">Payment Date</th>
                    <th className="p-3.5">Method</th>
                    <th className="p-3.5">Received By</th>
                    <th className="p-3.5 text-right">Amount Paid (PKR)</th>
                    <th className="p-3.5 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {feePayments.length > 0 ? (
                    feePayments.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="p-3.5 pl-6 font-mono font-bold text-blue-900 dark:text-blue-300">
                          {p.receiptNo}
                        </td>
                        <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                          {p.voucherNo}
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 dark:text-white">{p.studentName}</div>
                          <div className="text-[10px] text-slate-400">Father: {p.fatherName || '—'}</div>
                        </td>
                        <td className="p-3.5 text-slate-700 dark:text-slate-300">
                          {p.class} - {p.section}
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-400">
                          {p.paymentDate}
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-400">
                          {p.receivedBy}
                        </td>
                        <td className="p-3.5 text-right font-mono font-black text-sm text-emerald-700 dark:text-emerald-400">
                          Rs. {p.amountPaid.toLocaleString()}
                        </td>
                        <td className="p-3.5 pr-6 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenReceipt(p)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-900 hover:bg-blue-800 text-amber-400 font-bold rounded-md text-xs cursor-pointer transition-colors shadow-xs ml-auto"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        No payment receipts issued yet. Collect a payment from the Vouchers tab.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SETTINGS → FEE STRUCTURE */}
      {activeTab === 'structure' && <FeeStructureTab />}

      {/* TAB 5: REPORTS & LEDGERS */}
      {activeTab === 'reports' && <FeeReportsTab />}

      {/* MODAL 1: PRINT VOUCHER (DUAL-COPY SCHOOL & PARENT) */}
      <FeeVoucherPrintModal
        vouchers={printVouchersList}
        initialIndex={printInitialIndex}
        schoolSettings={schoolSettings}
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />

      {/* MODAL 2: PAYMENT COLLECTION */}
      <PaymentCollectionModal
        voucher={selectedVoucherForPayment}
        isOpen={isCollectModalOpen}
        onClose={() => setIsCollectModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* MODAL 3: PAYMENT RECEIPT */}
      <PaymentReceiptModal
        payment={selectedPaymentReceipt}
        schoolSettings={schoolSettings}
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
      />

      {/* MODAL 4: BULK VOUCHER GENERATOR */}
      <BulkVoucherGeneratorModal
        isOpen={isGeneratorModalOpen}
        onClose={() => setIsGeneratorModalOpen(false)}
        onSuccess={(count) => {
          showToast('Generation Complete', `Successfully created ${count} fee vouchers.`);
        }}
      />
    </div>
  );
};
