import React, { useState } from 'react';
import { useERPData } from '../../context/ERPDataContext';
import { KpiCard } from '../common/KpiCard';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import {
  Users,
  CalendarCheck,
  CreditCard,
  Award,
  Bus,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface ParentDashboardProps {
  onNavigate: (view: string) => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ onNavigate }) => {
  const { students, feeInvoices, showToast, settings } = useERPData();
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);

  // Parent's linked children (e.g., Alex Hayes & Maya Lin)
  const children = students.slice(0, 2);
  const activeChild = children[selectedChildIndex] || children[0];

  // Invoices for active child
  const childInvoices = feeInvoices.filter((inv) =>
    inv.studentName.toLowerCase().includes(activeChild?.firstName.toLowerCase() || '')
  );

  return (
    <div className="space-y-6">
      {/* Parent Welcome & Child Switcher Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          {settings.logoUrl ? (
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white p-1 shrink-0 shadow-xs flex items-center justify-center">
              <img src={settings.logoUrl} alt={settings.schoolName || 'School Logo'} className="w-full h-full object-contain" />
            </div>
          ) : null}
          <div>
            <Badge variant="primary" className="mb-1.5">
              {settings.schoolName ? `${settings.schoolName} Guardian Portal` : 'Guardian & Parent Portal'}
            </Badge>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Ward Academic Oversight
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Monitor real-time academic progress, bus transit GPS, attendance, and fee invoices.
            </p>
          </div>
        </div>

        {/* Children Tabs Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl self-start md:self-auto">
          {children.map((child, idx) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildIndex(idx)}
              className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedChildIndex === idx
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Avatar name={`${child.firstName} ${child.lastName}`} size="xs" />
              <span>{child.firstName} ({child.class}-{child.section})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Child Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Attendance Rate (Term 1)"
          value="96.2%"
          subValue="Present 46 / 48 days"
          icon={CalendarCheck}
          accentColor="emerald"
          onClick={() => onNavigate('attendance')}
        />
        <KpiCard
          label="Current Term GPA"
          value="3.85 / 4.0"
          subValue="Excellent (Grade A)"
          icon={Award}
          accentColor="indigo"
          onClick={() => onNavigate('exams')}
        />
        <KpiCard
          label="Pending Tuition Dues"
          value="Rs. 0"
          subValue="All invoices cleared"
          icon={CreditCard}
          accentColor="emerald"
          onClick={() => onNavigate('fees')}
        />
        <KpiCard
          label="School Bus #04 Status"
          value="On Route"
          subValue="ETA to Stop: 12 min"
          icon={Bus}
          accentColor="amber"
          onClick={() => onNavigate('transport')}
        />
      </div>

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Child Profile & Recent Attendance */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Student Information & Class Standing
            </h3>
            <button
              onClick={() => onNavigate('student-profile')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Full Profile Card
            </button>
          </div>

          <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 mb-5">
            <Avatar
              name={`${activeChild.firstName} ${activeChild.lastName}`}
              src={activeChild.avatar}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {activeChild.firstName} {activeChild.lastName}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Admission #{activeChild.admissionNo} • Roll #{activeChild.rollNumber} • {activeChild.class} Section {activeChild.section}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="success" size="sm">Active Student</Badge>
                <Badge variant="neutral" size="sm">Blood Grp: {activeChild.bloodGroup}</Badge>
              </div>
            </div>
          </div>

          {/* Fee Invoices */}
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Recent Fee Invoices
          </h4>
          <div className="space-y-2.5">
            {childInvoices.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No pending fee statements.</p>
            ) : (
              childInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {inv.invoiceNumber} • {inv.feeCategory}
                    </span>
                    <p className="text-slate-500 mt-0.5">Due date: {inv.dueDate}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 dark:text-white">
                      ${inv.totalPayable}
                    </span>
                    <Badge variant={inv.status === 'Paid' ? 'success' : 'danger'} size="sm">
                      {inv.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Contact & Bus Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Class Teacher & Support
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Direct line to {settings.schoolName || 'School'} faculty & administration
            </p>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 mb-4">
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Marcus Brody (Mathematics / Class Mentor)
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{settings.email || 'teacher.support@school.edu'}</p>
              <button
                onClick={() => onNavigate('messages')}
                className="mt-3 w-full py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 font-semibold rounded-lg text-xs hover:bg-blue-100 flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message Class Teacher</span>
              </button>
            </div>

            <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/60">
              <div className="flex items-center gap-2 font-bold text-xs text-amber-800 dark:text-amber-300">
                <Bus className="w-4 h-4 text-amber-600" />
                <span>School Transport Route #04</span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                Driver: David Miller (+1 555-0192) • Vehicle: BUS-104
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('transport')}
            className="w-full mt-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs hover:bg-blue-700 transition-colors shadow-xs"
          >
            Open Live Bus GPS Radar
          </button>
        </div>
      </div>
    </div>
  );
};
