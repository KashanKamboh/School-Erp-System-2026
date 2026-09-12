import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useERPData } from '../../context/ERPDataContext';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Building2,
  CalendarCheck,
  CreditCard,
  FileCheck,
  Calendar,
  BookOpenCheck,
  Library,
  Bus,
  Briefcase,
  CalendarDays,
  Receipt,
  Bell,
  MessageSquare,
  BarChart3,
  Settings,
  Shield,
  ShieldAlert,
  History,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  School,
  Contact,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentView?: string;
  activeTab?: string;
  onNavigate?: (view: string) => void;
  onSelectTab?: (view: string) => void;
  isOpen: boolean;
  onCloseMobile?: () => void;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  roles?: string[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  activeTab,
  onNavigate,
  onSelectTab,
  isOpen,
  onCloseMobile,
  onClose,
  isCollapsed: controlledIsCollapsed,
  onToggleCollapse,
}) => {
  const { currentUser } = useAuth();
  const { settings } = useERPData();
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);

  const isCollapsed =
    controlledIsCollapsed !== undefined ? controlledIsCollapsed : internalIsCollapsed;

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalIsCollapsed(!internalIsCollapsed);
    }
  };

  const handleNav = (id: string) => {
    if (onNavigate) {
      onNavigate(id);
    } else if (onSelectTab) {
      onSelectTab(id);
    }
    if (onCloseMobile) {
      onCloseMobile();
    } else if (onClose) {
      onClose();
    }
  };

  const handleClose = () => {
    if (onCloseMobile) {
      onCloseMobile();
    } else if (onClose) {
      onClose();
    }
  };

  const currentTab = currentView || activeTab || 'dashboard';

  const sections: NavSection[] = [
    {
      title: 'Main',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Academics',
      items: [
        { id: 'students', label: 'Students', icon: GraduationCap, roles: ['Super Admin', 'School Admin', 'Principal', 'Teacher', 'Accountant'] },
        { id: 'teachers', label: 'Teachers', icon: Users, roles: ['Super Admin', 'School Admin', 'Principal', 'Teacher'] },
        { id: 'classes', label: 'Classes & Sections', icon: Building2, roles: ['Super Admin', 'School Admin', 'Principal', 'Teacher'] },
        { id: 'attendance', label: 'Attendance', icon: CalendarCheck, roles: ['Super Admin', 'School Admin', 'Principal', 'Teacher', 'Student', 'Parent'] },
        { id: 'exams', label: 'Examinations & Results', icon: FileCheck, roles: ['Super Admin', 'School Admin', 'Principal', 'Teacher', 'Student', 'Parent'] },
        { id: 'cards', label: 'Student & Faculty Cards', icon: Contact, roles: ['Super Admin', 'School Admin', 'Principal', 'Teacher', 'Accountant', 'Student', 'Parent'] },
        { id: 'timetable', label: 'Timetable', icon: Calendar, roles: ['Super Admin', 'School Admin', 'Principal', 'Teacher', 'Student', 'Parent'] },
        { id: 'homework', label: 'Homework', icon: BookOpenCheck, roles: ['Super Admin', 'School Admin', 'Principal', 'Teacher', 'Student', 'Parent'] },
      ],
    },
    {
      title: 'Operations & Logistics',
      items: [
        { id: 'library', label: 'Library Management', icon: Library, roles: ['Super Admin', 'School Admin', 'Principal', 'Librarian', 'Teacher', 'Student'] },
        { id: 'transport', label: 'Transport & Fleet', icon: Bus, roles: ['Super Admin', 'School Admin', 'Principal', 'Transport Manager', 'Parent', 'Student'] },
      ],
    },
    {
      title: 'Finance & HR',
      items: [
        { id: 'fees', label: 'Fees & Invoicing', icon: CreditCard, roles: ['Super Admin', 'School Admin', 'Principal', 'Accountant', 'Student', 'Parent'] },
        { id: 'payroll', label: 'Staff & Payroll', icon: Briefcase, roles: ['Super Admin', 'School Admin', 'Principal', 'Accountant'] },
        { id: 'leaves', label: 'Leave Requests', icon: CalendarDays, roles: ['Super Admin', 'School Admin', 'Principal', 'Teacher', 'Accountant', 'Librarian', 'Transport Manager'] },
        { id: 'expenses', label: 'School Expenses', icon: Receipt, roles: ['Super Admin', 'School Admin', 'Principal', 'Accountant'] },
      ],
    },
    {
      title: 'Communications & Analytics',
      items: [
        { id: 'notices', label: 'Notice Board', icon: Bell },
        { id: 'messages', label: 'Messages / Chat', icon: MessageSquare },
        { id: 'reports', label: 'Reports Center', icon: BarChart3, roles: ['Super Admin', 'School Admin', 'Principal', 'Teacher', 'Accountant'] },
      ],
    },
    {
      title: 'Administration',
      items: [
        { id: 'users', label: 'Users & RBAC', icon: Shield, roles: ['Super Admin', 'School Admin'] },
        { id: 'security', label: 'Security & URL Tests', icon: ShieldAlert },
        { id: 'settings', label: 'School Settings', icon: Settings, roles: ['Super Admin', 'School Admin', 'Principal'] },
        { id: 'audit', label: 'Audit Logs', icon: History, roles: ['Super Admin', 'School Admin'] },
      ],
    },
  ];

  // Filter items according to active role
  const isItemVisible = (item: NavItem) => {
    if (!item.roles) return true;
    return item.roles.includes(currentUser.role);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden"
          onClick={handleClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 lg:static lg:h-full lg:z-auto bg-white dark:bg-[#0F172A] text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-xl transition-all duration-300 ease-in-out flex flex-col shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div
            onClick={() => handleNav('dashboard')}
            className="flex items-center gap-3 cursor-pointer overflow-hidden"
          >
            {settings.logoUrl ? (
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-indigo-200 dark:border-indigo-800 bg-white flex items-center justify-center p-0.5 shrink-0 shadow-xs">
                <img src={settings.logoUrl} alt={settings.schoolName} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
                <School className="w-5 h-5 text-white" />
              </div>
            )}
            {!isCollapsed && (
              <div className="truncate">
                <h2 className="font-bold text-base tracking-tight text-slate-900 dark:text-white leading-tight truncate">
                  {settings.schoolName || 'School ERP'}
                </h2>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                  {settings.currentSession ? `Session ${settings.currentSession}` : (settings.tagline || 'Institutional Portal')}
                </p>
              </div>
            )}
          </div>

          {/* Mobile close or desktop collapse button */}
          <div className="flex items-center">
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={handleToggle}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {sections.map((section, sIdx) => {
            const visibleItems = section.items.filter(isItemVisible);
            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx}>
                {!isCollapsed && (
                  <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {section.title}
                  </p>
                )}
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      currentTab === item.id ||
                      (item.id === 'students' && currentTab === 'student-profile');

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNav(item.id)}
                        title={isCollapsed ? item.label : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group relative cursor-pointer ${
                          isActive
                            ? 'bg-indigo-50 dark:bg-indigo-600/15 border-l-4 border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                        } ${isCollapsed ? 'justify-center px-2 border-l-0' : ''}`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                          }`}
                        />
                        {!isCollapsed && (
                          <span className="truncate flex-1 text-left">
                            {item.label}
                          </span>
                        )}
                        {!isCollapsed && item.badge && (
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                              isActive
                                ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer User Info / Session Badge */}
        {!isCollapsed ? (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#0B1120]/60 shrink-0">
            <div className="flex items-center space-x-3 bg-white dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-slate-700 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-xs">
                {currentUser?.name?.slice(0, 2).toUpperCase() || 'AD'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{currentUser?.name || 'Administrator'}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{currentUser?.role || 'Admin User'}</p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 px-1">
              <span>Session: {settings.currentSession}</span>
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                Live Sync
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="System Online" />
          </div>
        )}
      </aside>
    </>
  );
};
