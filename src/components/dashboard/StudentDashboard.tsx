import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useERPData } from '../../context/ERPDataContext';
import { KpiCard } from '../common/KpiCard';
import { Badge } from '../common/Badge';
import {
  CalendarCheck,
  BookOpenCheck,
  FileCheck,
  CreditCard,
  Clock,
  BookOpen,
  Award,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface StudentDashboardProps {
  onNavigate: (view: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { homework, exams, feeInvoices, libraryBooks, timetables, settings } = useERPData();

  // Student specific mock values for Alex Hayes (Grade 10-A)
  const studentTimetable = [
    { period: 1, time: '08:30 - 09:15', subject: 'Mathematics', teacher: 'Marcus Brody', room: 'Room 201' },
    { period: 2, time: '09:20 - 10:05', subject: 'English Literature', teacher: 'Sarah Jenkins', room: 'Room 102' },
    { period: 3, time: '10:10 - 10:55', subject: 'Physics', teacher: 'Dr. Alan Grant', room: 'Science Lab A' },
    { period: 4, time: '11:15 - 12:00', subject: 'History', teacher: 'Elena Rostova', room: 'Room 204' },
  ];

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          {settings?.logoUrl ? (
            <div className="w-12 h-12 rounded-xl bg-white p-1 shrink-0 shadow-md flex items-center justify-center">
              <img src={settings.logoUrl} alt={settings.schoolName || 'School Logo'} className="w-full h-full object-contain" />
            </div>
          ) : null}
          <div>
            <Badge variant="primary" className="bg-white/10 text-blue-200 border-white/20 mb-2">
              {settings?.schoolName ? `${settings.schoolName} • Student Portal` : 'Student Portal'}
            </Badge>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Hello, {currentUser.name}! 🎓
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Keep up the great momentum! Your overall attendance is 96.2% with Grade 'A' academic standing.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('homework')}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shrink-0 flex items-center gap-2"
        >
          <BookOpenCheck className="w-4 h-4" />
          <span>View Due Homework</span>
        </button>
      </div>

      {/* Student Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Attendance (Present Days)"
          value="96.2%"
          subValue="46 / 48 days"
          icon={CalendarCheck}
          accentColor="emerald"
          onClick={() => onNavigate('attendance')}
        />
        <KpiCard
          label="Pending Homework"
          value="2"
          subValue="Due in next 48 hrs"
          icon={BookOpenCheck}
          accentColor="amber"
          onClick={() => onNavigate('homework')}
        />
        <KpiCard
          label="Latest Term GPA"
          value="3.85 / 4.0"
          subValue="Rank 3 in Class 10-A"
          icon={Award}
          accentColor="indigo"
          onClick={() => onNavigate('exams')}
        />
        <KpiCard
          label="Library Books Issued"
          value="1"
          subValue="Due Oct 15"
          icon={BookOpen}
          accentColor="sky"
          onClick={() => onNavigate('library')}
        />
      </div>

      {/* Timetable & Homework */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Today's Class Schedule (Monday)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live classroom sequence and instructor locations
              </p>
            </div>
            <button
              onClick={() => onNavigate('timetable')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Full Schedule
            </button>
          </div>

          <div className="space-y-3">
            {studentTimetable.map((slot, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex flex-col items-center justify-center font-bold text-xs">
                    <span>P{slot.period}</span>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {slot.subject}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {slot.time} • {slot.teacher} • <span className="font-semibold">{slot.room}</span>
                    </p>
                  </div>
                </div>

                <Badge variant="neutral" size="sm">
                  Ongoing
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Due Assignments & Exam alerts */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Upcoming Deadlines
              </h3>
              <button
                onClick={() => onNavigate('homework')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                View
              </button>
            </div>

            <div className="space-y-3">
              {homework.slice(0, 2).map((hw) => (
                <div
                  key={hw.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                      {hw.title}
                    </h5>
                    <Badge variant="danger" size="sm">
                      {hw.dueDate}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{hw.subject} • {hw.teacherName}</p>
                </div>
              ))}

              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-800 dark:text-blue-300">
                  <FileCheck className="w-4 h-4 text-blue-600" />
                  <span>Mid-Term Examination 2026</span>
                </div>
                <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1">
                  Starting in 12 days (Oct 12, 2026). Hall tickets available for download.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('exams')}
            className="w-full mt-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs hover:bg-blue-700 transition-colors shadow-xs"
          >
            Download Exam Timetable & Hall Ticket
          </button>
        </div>
      </div>
    </div>
  );
};
