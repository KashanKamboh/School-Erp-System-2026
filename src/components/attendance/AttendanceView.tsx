import React, { useState } from 'react';
import { useERPData } from '../../context/ERPDataContext';
import { PageHeader } from '../common/PageHeader';
import { Tabs } from '../common/Tabs';
import {
  CalendarCheck,
  UserCheck,
  History,
  FileBarChart,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { AttendanceRegister } from './AttendanceRegister';
import { StudentAttendanceCheck } from './StudentAttendanceCheck';
import { AttendanceHistory } from './AttendanceHistory';
import { AttendanceReports } from './AttendanceReports';

export const AttendanceView: React.FC = () => {
  const { attendanceRecords, students } = useERPData();

  const [activeTab, setActiveTab] = useState<'register' | 'student' | 'history' | 'reports'>(
    'register'
  );

  // When jumping from History to Register for editing
  const [registerProps, setRegisterProps] = useState<{
    date?: string;
    class?: string;
    section?: string;
  }>({});

  const handleEditSessionFromHistory = (date: string, className: string, sectionName: string) => {
    setRegisterProps({
      date,
      class: className,
      section: sectionName,
    });
    setActiveTab('register');
  };

  // High-level quick stats for the page header
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = attendanceRecords.filter((r) => r.date === todayStr);
  const todayPresent = todayRecords.filter((r) => r.status === 'Present').length;
  const todayAbsent = todayRecords.filter((r) => r.status === 'Absent').length;
  const todayLeave = todayRecords.filter(
    (r) => r.status === 'Leave' || (r.status as any) === 'Excused'
  ).length;
  const todayRate =
    todayRecords.length > 0 ? Math.round((todayPresent / todayRecords.length) * 100) : 0;

  const tabs = [
    {
      id: 'register',
      label: 'Class-wise Register',
      icon: CalendarCheck,
    },
    {
      id: 'student',
      label: 'Student-wise View',
      icon: UserCheck,
    },
    {
      id: 'history',
      label: 'Attendance History',
      icon: History,
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: FileBarChart,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Management"
        subtitle="Record class-wise roll call, inspect student profiles, audit historical database logs, and view institutional reports."
        breadcrumbs={[
          { label: 'Academic ERP' },
          { label: 'Attendance Management' },
        ]}
      />

      {/* Overview Quick Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Enrolled Students
            </span>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {students.length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-600/80 uppercase tracking-wider">
              Today's Present
            </span>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {todayPresent}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-rose-600/80 uppercase tracking-wider">
              Today's Absent
            </span>
            <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
              {todayAbsent}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-sky-600/80 uppercase tracking-wider">
              Today's Leaves / Rate
            </span>
            <p className="text-xl font-bold text-sky-600 dark:text-sky-400 mt-0.5">
              {todayLeave}{' '}
              <span className="text-xs font-semibold text-slate-500">
                ({todayRate > 0 ? `${todayRate}%` : 'Pending'})
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as any)}
      />

      {/* Active Tab Views */}
      {activeTab === 'register' && (
        <AttendanceRegister
          initialDate={registerProps.date}
          initialClass={registerProps.class}
          initialSection={registerProps.section}
        />
      )}

      {activeTab === 'student' && <StudentAttendanceCheck />}

      {activeTab === 'history' && (
        <AttendanceHistory onEditSession={handleEditSessionFromHistory} />
      )}

      {activeTab === 'reports' && <AttendanceReports />}
    </div>
  );
};
export default AttendanceView;
