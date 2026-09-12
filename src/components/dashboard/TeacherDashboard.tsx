import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useERPData } from '../../context/ERPDataContext';
import { KpiCard } from '../common/KpiCard';
import { Badge } from '../common/Badge';
import {
  Users,
  CalendarCheck,
  BookOpenCheck,
  FileCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface TeacherDashboardProps {
  onNavigate: (view: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { homeworks, timetableSlots, notices, students, settings } = useERPData();

  // Find teacher's classes today (e.g., Monday schedule)
  const myClassesToday = [
    { period: 1, time: '08:30 - 09:15', class: 'Grade 10-A', subject: 'Mathematics', room: 'Room 201' },
    { period: 2, time: '09:20 - 10:05', class: 'Grade 9-B', subject: 'Mathematics', room: 'Room 105' },
    { period: 4, time: '11:15 - 12:00', class: 'Grade 10-B', subject: 'Advanced Algebra', room: 'Room 202' },
    { period: 6, time: '01:30 - 02:15', class: 'Grade 8-A', subject: 'Mathematics Lab', room: 'Math Lab 1' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          {settings?.logoUrl ? (
            <div className="w-12 h-12 rounded-xl bg-white p-1 shrink-0 shadow-md flex items-center justify-center">
              <img src={settings.logoUrl} alt={settings.schoolName || 'School Logo'} className="w-full h-full object-contain" />
            </div>
          ) : null}
          <div>
            <Badge variant="primary" className="bg-white/10 text-indigo-200 border-white/20 mb-2">
              {settings?.schoolName ? `${settings.schoolName} • Faculty Workspace` : 'Faculty Workspace'}
            </Badge>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Welcome back, {currentUser.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              You have 4 lecture periods scheduled today. Grade 10-A attendance register is pending.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('attendance')}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shrink-0 flex items-center gap-2"
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Mark Class Attendance</span>
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="My Assigned Students"
          value="142"
          subValue="across 4 classes"
          icon={Users}
          accentColor="indigo"
          onClick={() => onNavigate('students')}
        />
        <KpiCard
          label="Today's Lecture Periods"
          value="4"
          subValue="Next: Period 1 (08:30)"
          icon={Clock}
          accentColor="blue"
          onClick={() => onNavigate('timetable')}
        />
        <KpiCard
          label="Assignments Pending Review"
          value="18"
          subValue="Grade 10-A Trigonometry"
          icon={BookOpenCheck}
          accentColor="amber"
          onClick={() => onNavigate('homework')}
        />
        <KpiCard
          label="Upcoming Class Exam"
          value="Oct 12"
          subValue="Mid-Term Mathematics"
          icon={FileCheck}
          accentColor="emerald"
          onClick={() => onNavigate('exams')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Teaching Schedule */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Today's Lecture Schedule
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily period timetable and classroom allocations
              </p>
            </div>
            <button
              onClick={() => onNavigate('timetable')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Full Timetable
            </button>
          </div>

          <div className="space-y-3">
            {myClassesToday.map((period, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex flex-col items-center justify-center font-bold text-xs">
                    <span>P{period.period}</span>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {period.subject} • {period.class}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {period.time} • {period.room}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate('attendance')}
                    className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 text-slate-700 dark:text-slate-200"
                  >
                    Attendance
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Homework Grading */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Active Assignments
              </h3>
              <button
                onClick={() => onNavigate('homework')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Manage
              </button>
            </div>

            <div className="space-y-3">
              {homeworks.slice(0, 3).map((hw) => (
                <div
                  key={hw.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                      {hw.title}
                    </h5>
                    <Badge variant="warning" size="sm">
                      Due: {hw.dueDate}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {hw.class} {hw.section} • {hw.submissionsCount} submissions received
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('homework')}
            className="w-full mt-4 py-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 font-semibold rounded-xl text-xs hover:bg-blue-100 transition-colors"
          >
            Create New Homework Assignment
          </button>
        </div>
      </div>
    </div>
  );
};
