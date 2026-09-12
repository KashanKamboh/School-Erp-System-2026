import React from 'react';
import { useERPData } from '../../context/ERPDataContext';
import { KpiCard } from '../common/KpiCard';
import { Badge } from '../common/Badge';
import {
  CreditCard,
  TrendingUp,
  Receipt,
  Briefcase,
  AlertTriangle,
  ArrowRight,
  Plus,
  Download,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface AccountantDashboardProps {
  onNavigate: (view: string) => void;
}

export const AccountantDashboard: React.FC<AccountantDashboardProps> = ({ onNavigate }) => {
  const { feeInvoices, expenses, payrollRecords, analyticsData, settings } = useERPData();

  const totalCollected = feeInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalPending = feeInvoices.reduce(
    (sum, i) => sum + (i.status !== 'Paid' ? i.totalPayable - i.paidAmount : 0),
    0
  );
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const monthlyPayroll = payrollRecords.reduce((sum, p) => sum + p.netSalary, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          {settings?.logoUrl ? (
            <div className="w-12 h-12 rounded-xl bg-white p-1 shrink-0 shadow-md flex items-center justify-center">
              <img src={settings.logoUrl} alt={settings.schoolName || 'School Logo'} className="w-full h-full object-contain" />
            </div>
          ) : null}
          <div>
            <Badge variant="success" className="bg-emerald-500/20 text-emerald-200 border-emerald-400/30 mb-2">
              {settings?.schoolName ? `${settings.schoolName} • Finance Desk` : 'Bursar & Finance Desk'}
            </Badge>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Financial & Accounts Operations
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Real-time fee collections, expense auditing, payroll dispatch, and ledger summaries.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('fees')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Invoices</span>
          </button>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Fee Revenue (YTD)"
          value={`$${(totalCollected / 1000).toFixed(1)}k`}
          subValue="94.2% collected"
          icon={CreditCard}
          accentColor="emerald"
          onClick={() => onNavigate('fees')}
        />
        <KpiCard
          label="Pending Fee Arrears"
          value={`$${(totalPending / 1000).toFixed(1)}k`}
          subValue="42 overdue accounts"
          icon={AlertTriangle}
          accentColor="rose"
          onClick={() => onNavigate('fees')}
        />
        <KpiCard
          label="Monthly Staff Payroll"
          value={`$${(monthlyPayroll / 1000).toFixed(1)}k`}
          subValue="84 staff members"
          icon={Briefcase}
          accentColor="indigo"
          onClick={() => onNavigate('payroll')}
        />
        <KpiCard
          label="School Expenses (Q3)"
          value={`$${(totalExpenses / 1000).toFixed(1)}k`}
          subValue="Utilities & maintenance"
          icon={Receipt}
          accentColor="amber"
          onClick={() => onNavigate('expenses')}
        />
      </div>

      {/* Revenue & Expenses Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Collections Trend (PKR)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Actual monthly cash inflow vs budgeted targets
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => `Rs. ${v / 1000}k`}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val: any) => [`Rs. ${Number(val).toLocaleString()}`, '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="collected" fill="#10b981" name="Collected" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Operations */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Quick Bursar Actions
            </h3>

            <div className="space-y-2.5">
              <button
                onClick={() => onNavigate('fees')}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-left text-xs font-bold"
              >
                <span>Record Offline Cash / Cheque</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => onNavigate('payroll')}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-left text-xs font-bold"
              >
                <span>Process Monthly Payslips</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => onNavigate('expenses')}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-left text-xs font-bold"
              >
                <span>Add Voucher / Expense Claim</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          <button
            onClick={() => onNavigate('reports')}
            className="w-full mt-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl text-xs hover:bg-emerald-700 transition-colors shadow-xs"
          >
            Export Financial Audit Report
          </button>
        </div>
      </div>
    </div>
  );
};
