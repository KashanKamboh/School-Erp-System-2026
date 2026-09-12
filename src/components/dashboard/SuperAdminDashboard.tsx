import React, { useState } from 'react';
import { useERPData } from '../../context/ERPDataContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { KpiCard } from '../common/KpiCard';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import {
  Users,
  GraduationCap,
  CreditCard,
  CalendarCheck,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Plus,
  Send,
  FileText,
  Bus,
  Clock,
  Sparkles,
  School,
  UserCheck,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface SuperAdminDashboardProps {
  onNavigate: (view: string) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onNavigate }) => {
  const {
    settings,
    students,
    teachers,
    staff,
    attendanceRecords,
    transportRoutes,
    feeInvoices,
    feeVouchers,
    feePayments,
    classes,
    notices,
    auditLogs,
    analyticsData,
  } = useERPData();

  const { isDark } = useTheme();
  const [attendanceMode, setAttendanceMode] = useState<'weekly' | 'monthly'>('weekly');
  const { users } = useAuth();
  const pendingUsersCount = users.filter((u) => u.status === 'Pending').length;

  const currencySymbol = settings.currencySymbol || 'Rs.';

  // Aggregate stats strictly from real data
  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const totalRevenue = feePayments.reduce((acc, p) => acc + (p.amountPaid || 0), 0) || feeInvoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
  const totalPendingFees = feeVouchers.reduce(
    (acc, v) => acc + (v.status !== 'PAID' ? (v.remainingBalance ?? (v.totalPayable - (v.paidAmount || 0))) : 0),
    0
  ) || feeInvoices.reduce(
    (acc, inv) => acc + (inv.status !== 'Paid' ? inv.totalPayable - inv.paidAmount : 0),
    0
  );

  // Student distribution dynamically derived from real student classes
  const primaryCount = students.filter((s) => /grade [1-5]|class [1-5]/i.test(s.class || '')).length;
  const middleCount = students.filter((s) => /grade [6-8]|class [6-8]/i.test(s.class || '')).length;
  const secondaryCount = students.filter((s) => /grade (9|10)|class (9|10)/i.test(s.class || '')).length;
  const seniorCount = students.filter((s) => /grade (11|12)|class (11|12)/i.test(s.class || '')).length;
  const otherCount = students.length - (primaryCount + middleCount + secondaryCount + seniorCount);

  const studentDistribution = students.length > 0
    ? [
        { name: 'Primary (Gr 1-5)', value: primaryCount, color: '#3b82f6' },
        { name: 'Middle (Gr 6-8)', value: middleCount, color: '#6366f1' },
        { name: 'Secondary (Gr 9-10)', value: secondaryCount, color: '#0ea5e9' },
        { name: 'Senior Sec (Gr 11-12)', value: seniorCount, color: '#10b981' },
        ...(otherCount > 0 ? [{ name: 'Other Grades', value: otherCount, color: '#f59e0b' }] : []),
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden border border-blue-500/20 dark:border-slate-800">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial from-blue-400/20 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            {settings?.logoUrl ? (
              <div className="w-13 h-13 rounded-xl bg-white p-1 shrink-0 shadow-md flex items-center justify-center">
                <img src={settings.logoUrl} alt={settings.schoolName || 'School Logo'} className="w-full h-full object-contain" />
              </div>
            ) : null}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="primary" className="bg-white/20 text-white border-white/30">
                  <Sparkles className="w-3 h-3 mr-1 text-amber-300" /> Academic Session {settings?.currentSession || '2025–2026'}
                </Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                {settings?.schoolName ? `${settings.schoolName} Command Center` : 'School Administration Intelligence Dashboard'}
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 dark:text-slate-300 mt-1 max-w-xl">
                Real-time monitoring across {totalStudents} enrolled students, {totalTeachers} faculty members, daily attendance, fee collections, and school operations.
              </p>
            </div>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={() => onNavigate('students')}
              className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 backdrop-blur-xs border border-white/30 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Admit Student</span>
            </button>
            <button
              onClick={() => onNavigate('teachers')}
              className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 backdrop-blur-xs border border-white/30 shadow-xs transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Faculty Directory</span>
            </button>
            <button
              onClick={() => onNavigate('cards')}
              className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/30 transition-colors cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>ID Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pending User Approvals Action Banner */}
      {pendingUsersCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-400/40 dark:border-amber-600/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-900 dark:text-white shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  Registration Clearance Queue ({pendingUsersCount})
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {pendingUsersCount} self-registered user(s) are awaiting Super Admin approval to activate their institutional portal access.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('users')}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Review & Authorize ({pendingUsersCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <KpiCard
          label="Total Enrolled Students"
          value={totalStudents.toString()}
          subValue={`${students.filter(s => s.status === 'Active').length} active students`}
          icon={GraduationCap}
          accentColor="blue"
          trend={{ value: `${totalStudents}`, isPositive: true, text: 'total enrolled' }}
          onClick={() => onNavigate('students')}
        />
        <KpiCard
          label="Active Faculty & Staff"
          value={(totalTeachers + staff.length).toString()}
          subValue={`${totalTeachers} faculty, ${staff.length} staff`}
          icon={Users}
          accentColor="indigo"
          trend={{ value: `${totalTeachers}`, isPositive: true, text: 'active faculty' }}
          onClick={() => onNavigate('teachers')}
        />
        <KpiCard
          label="Fee Collections (YTD)"
          value={`${currencySymbol} ${totalRevenue.toLocaleString()}`}
          subValue={`${currencySymbol} ${totalPendingFees.toLocaleString()} pending`}
          icon={CreditCard}
          accentColor="emerald"
          trend={{ value: `${currencySymbol} ${totalRevenue.toLocaleString()}`, isPositive: true, text: 'collected' }}
          onClick={() => onNavigate('fees')}
        />
        <KpiCard
          label="Today's Attendance Rate"
          value={`${analyticsData.attendanceTodayRate}%`}
          subValue={
            attendanceRecords.filter((r) => r.date === new Date().toISOString().split('T')[0]).length > 0
              ? `${attendanceRecords.filter((r) => r.date === new Date().toISOString().split('T')[0] && r.status === 'Present').length} / ${attendanceRecords.filter((r) => r.date === new Date().toISOString().split('T')[0]).length} marked today`
              : `${attendanceRecords.filter((r) => r.status === 'Present').length} / ${attendanceRecords.length} records in DB`
          }
          icon={CalendarCheck}
          accentColor="sky"
          trend={{ value: `${analyticsData.attendanceTodayRate}%`, isPositive: true, text: 'real DB data' }}
          onClick={() => onNavigate('attendance')}
        />
      </div>

      {/* Primary Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Flow (Weekly vs Monthly Tabs) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {attendanceMode === 'weekly' ? 'Weekly Attendance Flow (%)' : 'Monthly Academic Attendance Flow (%)'}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  {attendanceMode === 'weekly' ? 'Daily Flow' : 'Year-to-Date'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {attendanceMode === 'weekly'
                  ? 'Real-time daily presence comparison of students and faculty members'
                  : 'Comprehensive monthly attendance rate across the 2025–2026 academic term'}
              </p>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center gap-2">
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setAttendanceMode('weekly')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    attendanceMode === 'weekly'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Weekly Flow
                </button>
                <button
                  onClick={() => setAttendanceMode('monthly')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    attendanceMode === 'monthly'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Monthly Flow
                </button>
              </div>

              <button
                onClick={() => onNavigate('attendance')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 ml-1"
              >
                Roll Call <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Indicators Legend */}
          <div className="flex items-center gap-4 mb-4 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Students
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Teachers
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-400">
              <span className="w-3 h-0.5 bg-amber-400 inline-block" /> Benchmark Target (95%)
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {attendanceMode === 'weekly' ? (
                <AreaChart data={(analyticsData.weeklyAttendanceTrends || analyticsData.attendanceTrends) as any}>
                  <defs>
                    <linearGradient id="studentAtt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="teacherAtt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }} tickLine={false} />
                  <YAxis domain={[80, 100]} tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, '']}
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#1e293b' : '#e2e8f0',
                      borderRadius: '0.75rem',
                      color: isDark ? '#ffffff' : '#0f172a',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="students"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#studentAtt)"
                    name="Students Attendance %"
                  />
                  <Area
                    type="monotone"
                    dataKey="teachers"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#teacherAtt)"
                    name="Teachers Attendance %"
                  />
                </AreaChart>
              ) : (
                <BarChart data={analyticsData.monthlyAttendanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }} tickLine={false} />
                  <YAxis domain={[80, 100]} tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, '']}
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#1e293b' : '#e2e8f0',
                      borderRadius: '0.75rem',
                      color: isDark ? '#ffffff' : '#0f172a',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Bar dataKey="students" fill="#2563eb" radius={[6, 6, 0, 0]} name="Student Monthly Avg %" />
                  <Bar dataKey="teachers" fill="#10b981" radius={[6, 6, 0, 0]} name="Teacher Monthly Avg %" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Student Enrollment Distribution Donut */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Enrollment Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Students categorized by education wing
            </p>
          </div>

          {studentDistribution.length > 0 ? (
            <>
              <div className="h-52 w-full my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={studentDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {studentDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {studentDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 dark:text-slate-400 truncate">{item.name}</span>
                    <span className="font-bold text-slate-900 dark:text-white ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 my-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <GraduationCap className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No Student Records Yet</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">
                Admit students into classes to visualize grade-wise distribution.
              </p>
              <button
                onClick={() => onNavigate('students')}
                className="mt-3 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-xs cursor-pointer"
              >
                Admit Student
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Financial Health & Revenue vs Expenses Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Monthly Financial Flow ({currencySymbol})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tuition revenue collected vs operational school expenses
              </p>
            </div>
            <button
              onClick={() => onNavigate('fees')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Fee Ledger <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => `${currencySymbol} ${v >= 1000 ? `${v / 1000}k` : v}`}
                  tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val: any) => [`${currencySymbol} ${Number(val).toLocaleString()}`, '']}
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#1e293b' : '#e2e8f0',
                    borderRadius: '0.75rem',
                    color: isDark ? '#ffffff' : '#0f172a',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="revenue" fill="#3b82f6" name="Tuition Collected" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" fill="#f43f5e" name="School Expenses" radius={[6, 6, 0, 0]} />
                <Bar dataKey="target" fill="#94a3b8" name="Target Benchmark" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Operations Shortcuts */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Operational Actions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Instant shortcuts for daily school administration
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => onNavigate('attendance')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 rounded-lg">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600">
                      Mark Daily Attendance
                    </p>
                    <p className="text-[10px] text-slate-400">Class-wise roll call</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate('notices')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 rounded-lg">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600">
                      Broadcast Circular / Notice
                    </p>
                    <p className="text-[10px] text-slate-400">Send to all parents & staff</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate('exams')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600">
                      Generate Report Cards
                    </p>
                    <p className="text-[10px] text-slate-400">Term-end grade publishing</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate('transport')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 rounded-lg">
                    <Bus className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600">
                      Live Fleet Monitoring
                    </p>
                    <p className="text-[10px] text-slate-400">{transportRoutes.length} bus routes active</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Last DB sync: just now</span>
            <span className="text-emerald-600 font-semibold">● Live Node API</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Notices & Real-time Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Notices */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Institutional Circulars & Notices
            </h3>
            <button
              onClick={() => onNavigate('notices')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {notices.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No circulars or notices posted yet. Use Broadcast Circular to post.
              </div>
            ) : (
              notices.slice(0, 3).map((notice) => (
              <div
                key={notice.id}
                className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {notice.title}
                  </span>
                  <Badge
                    variant={
                      notice.priority === 'High'
                        ? 'danger'
                        : notice.priority === 'Medium'
                        ? 'warning'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {notice.priority}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {notice.content}
                </p>
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Audience: {notice.targetAudience}</span>
                  <span>{notice.date} • by {notice.author}</span>
                </div>
              </div>
            )))}
          </div>
        </div>

        {/* Real-time System Audit Trail */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Security & Activity Audit Log
            </h3>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Audit Trail
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No audit events recorded yet. System activities will display here in real-time.
              </div>
            ) : (
              auditLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="py-3 flex items-start gap-3 text-xs">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {log.userName} ({log.userRole})
                      </span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">{log.timestamp}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{log.action}</span> in {log.module}: {log.details}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
