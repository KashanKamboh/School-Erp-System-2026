import React, { useState } from 'react';
import { useERPData } from '../../context/ERPDataContext';
import { PageHeader } from '../common/PageHeader';
import { Badge } from '../common/Badge';
import { Tabs } from '../common/Tabs';
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  Calendar,
  FileSpreadsheet,
  Users,
  GraduationCap,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';

export const ReportsView: React.FC = () => {
  const { analyticsData, students, feeInvoices, teachers, showToast, settings } = useERPData();
  const [activeTab, setActiveTab] = useState<'financial' | 'academic' | 'attendance'>('financial');

  const handleExportCSV = (reportName: string) => {
    showToast('Report Generated', `${reportName} downloaded as CSV.`);
  };

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Official Institutional Print Header */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex items-center gap-3">
          {settings?.logoUrl ? (
            <div className="w-14 h-14 rounded-lg border border-slate-300 p-1 flex items-center justify-center shrink-0">
              <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : null}
          <div>
            <h1 className="text-xl font-black uppercase text-slate-950">
              {settings?.schoolName || 'Academic Institution'}
            </h1>
            <p className="text-xs text-slate-600">
              {settings?.address || (settings?.city ? `${settings.city}, ${settings.country || 'Pakistan'}` : 'Institutional Campus')}
            </p>
            <p className="text-[10px] text-slate-500">
              {settings?.affiliationNumber ? `Affiliation: ${settings.affiliationNumber} • ` : ''}Academic Session {settings?.currentSession || '2025–2026'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-block px-3 py-1 bg-slate-900 text-white font-mono text-xs font-bold uppercase rounded-xs">
            Official Audit & Reports
          </span>
          <p className="text-[10px] text-slate-500 mt-1">Audit Date: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="print:hidden">
        <PageHeader
          title="Institutional Analytics & Reports"
          subtitle={`${settings?.schoolName || 'School'} executive audit logs, fee collection reconciliations, and academic performance analysis`}
          badge={<Badge variant="primary">Audit Ready</Badge>}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportCSV('Executive Summary Report')}
                className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs hover:bg-slate-50"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Audit</span>
              </button>
            </div>
          }
        />
      </div>

      <Tabs
        tabs={[
          { id: 'financial', label: 'Financial & Collections Audit', icon: CreditCard },
          { id: 'academic', label: 'Academic & Grade Metrics', icon: GraduationCap },
          { id: 'attendance', label: 'Student & Staff Attendance', icon: Users },
        ]}
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as any)}
      />

      {activeTab === 'financial' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Monthly Fee Collections vs Targets (PKR)
                </h3>
                <p className="text-xs text-slate-400">Cash inflow vs projected fee billing per month</p>
              </div>
              <Badge variant="success">94.2% Realization Rate</Badge>
            </div>

            <div className="h-72 w-full">
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
                  <Legend />
                  <Bar dataKey="projected" fill="#cbd5e1" name="Target Budget" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="collected" fill="#3b82f6" name="Actual Realized" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'academic' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Grade Distribution Across Upper School
            </h3>
            <p className="text-xs text-slate-400 mb-6">Percentage of students scoring within grade thresholds</p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200">
                <p className="text-2xl font-bold text-emerald-600">38%</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">Grade A+ / A</p>
                <p className="text-[10px] text-slate-400">90% - 100%</p>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200">
                <p className="text-2xl font-bold text-blue-600">42%</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">Grade B</p>
                <p className="text-[10px] text-slate-400">75% - 89%</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200">
                <p className="text-2xl font-bold text-amber-600">14%</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">Grade C</p>
                <p className="text-[10px] text-slate-400">60% - 74%</p>
              </div>
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200">
                <p className="text-2xl font-bold text-rose-600">4%</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">Grade D</p>
                <p className="text-[10px] text-slate-400">40% - 59%</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200">
                <p className="text-2xl font-bold text-slate-600 dark:text-slate-300">2%</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">Remedial</p>
                <p className="text-[10px] text-slate-400">&lt; 40%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Daily Attendance Rate Trend (Term 1)
          </h3>
          <p className="text-xs text-slate-400">Consistent average hovering at 95.8% student attendance</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData.dailyAttendance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`${val}% Present`, 'Rate']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981' }}
                  name="Attendance %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
