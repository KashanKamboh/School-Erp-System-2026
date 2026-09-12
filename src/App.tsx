import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ERPDataProvider, useERPData } from './context/ERPDataContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { ToastContainer } from './components/common/ToastContainer';
import { LoginView } from './components/auth/LoginView';
import { ForgotPasswordModal } from './components/auth/ForgotPasswordModal';
import { LockScreenModal } from './components/auth/LockScreenModal';
import { SessionExpiredModal } from './components/auth/SessionExpiredModal';
import { AccessDeniedView } from './components/auth/AccessDeniedView';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { SetupSchoolWizard } from './components/setup/SetupSchoolWizard';

// Views
import { Dashboard } from './components/dashboard/Dashboard';
import { StudentsList } from './components/students/StudentsList';
import { StudentProfileView } from './components/students/StudentProfileView';
import { StudentFormModal } from './components/students/StudentFormModal';
import { TeachersList } from './components/teachers/TeachersList';
import { ClassesList } from './components/classes/ClassesList';
import { AttendanceView } from './components/attendance/AttendanceView';
import { ExamsView } from './components/exams/ExamsView';
import { TimetableView } from './components/timetable/TimetableView';
import { HomeworkView } from './components/homework/HomeworkView';
import { FeesView } from './components/fees/FeesView';
import { PayrollView } from './components/payroll/PayrollView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { LibraryView } from './components/library/LibraryView';
import { TransportView } from './components/transport/TransportView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { CardsView } from './components/cards/CardsView';
import { NoticesView } from './components/communications/NoticesView';
import { MessagesView } from './components/communications/MessagesView';
import { LeavesView } from './components/hr/LeavesView';
import { UsersView } from './components/admin/UsersView';
import { AuditLogsView } from './components/admin/AuditLogsView';
import { UserProfileView } from './components/profile/UserProfileView';
import { SecurityAuditPlayground } from './components/admin/SecurityAuditPlayground';
import { Student } from './types/erp';
import { ShieldCheck, Loader2, School } from 'lucide-react';
import { DesktopTitlebar } from './components/layout/DesktopTitlebar';

const VALID_ROUTES = [
  'dashboard',
  'students',
  'teachers',
  'classes',
  'attendance',
  'exams',
  'cards',
  'timetable',
  'homework',
  'fees',
  'payroll',
  'expenses',
  'library',
  'transport',
  'reports',
  'settings',
  'notices',
  'notifications',
  'messages',
  'leaves',
  'users',
  'roles',
  'audit',
  'security',
  'direct-url-test',
  'profile',
  'login',
  '403',
];

const MainLayout: React.FC = () => {
  const {
    currentUser,
    isAuthenticated,
    isCheckingAuth,
    isSetupCompleted,
    completeSetupSession,
    isLocked,
    isSessionExpired,
    closeSessionExpiredModal,
    switchRole,
  } = useAuth();
  const { isDark } = useTheme();
  const { toasts, removeToast, updateSettings } = useERPData();

  // Initialize active tab from current browser URL path or Electron hash
  const getInitialTabFromUrl = (): string => {
    if (typeof window === 'undefined') return 'dashboard';
    const isFileProtocol = window.location.protocol === 'file:';
    const path = isFileProtocol
      ? window.location.hash.replace(/^#\/?/, '').split('/')[0]
      : window.location.pathname.replace(/^\/+/, '').split('/')[0];

    if (path && VALID_ROUTES.includes(path)) {
      if (path === 'roles') return 'users';
      return path;
    }
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTabFromUrl);
  const [navHistory, setNavHistory] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isForgotPassOpen, setIsForgotPassOpen] = useState(false);

  // Student 360 profile view state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [isStudentEditModalOpen, setIsStudentEditModalOpen] = useState(false);

  // Synchronize Browser Address Bar & History with activeTab
  const handleNavigate = (view: string) => {
    if (view !== activeTab) {
      setNavHistory((prev) => [...prev, activeTab]);
    }
    setActiveTab(view);
    setSelectedStudent(null);
    setIsSidebarOpen(false);

    if (typeof window !== 'undefined') {
      if (window.location.protocol === 'file:') {
        window.location.hash = view === 'dashboard' ? '' : `#/${view}`;
      } else {
        const targetUrl = view === 'dashboard' ? '/' : `/${view}`;
        if (window.location.pathname !== targetUrl) {
          window.history.pushState({ tab: view }, '', targetUrl);
        }
      }
    }
  };

  const handleBack = () => {
    if (selectedStudent) {
      setSelectedStudent(null);
      return;
    }
    if (navHistory.length > 0) {
      const prev = navHistory[navHistory.length - 1];
      setNavHistory((hist) => hist.slice(0, -1));
      setActiveTab(prev || 'dashboard');
      if (typeof window !== 'undefined') {
        if (window.location.protocol === 'file:') {
          window.location.hash = prev === 'dashboard' ? '' : `#/${prev}`;
        } else {
          const targetUrl = prev === 'dashboard' ? '/' : `/${prev}`;
          window.history.pushState({ tab: prev }, '', targetUrl);
        }
      }
    } else {
      setActiveTab('dashboard');
    }
  };

  const canGoBack = activeTab !== 'dashboard' || !!selectedStudent;

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const isFileProtocol = window.location.protocol === 'file:';
      const path = isFileProtocol
        ? window.location.hash.replace(/^#\/?/, '').split('/')[0] || 'dashboard'
        : window.location.pathname.replace(/^\/+/, '').split('/')[0] || 'dashboard';

      if (VALID_ROUTES.includes(path)) {
        setActiveTab(path === 'roles' ? 'users' : path);
        setSelectedStudent(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Keyboard shortcut for Ctrl+K search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
  };

  const handleEditStudentFromProfile = (student: Student) => {
    setStudentToEdit(student);
    setIsStudentEditModalOpen(true);
  };

  // 1. Initial Auth Boot Loading Screen (Never flash protected dashboard content)
  if (isCheckingAuth) {
    return (
      <div className={`min-h-screen flex flex-col ${isDark ? 'dark bg-[#0B1120] text-slate-100' : 'bg-slate-900 text-white'}`}>
        <DesktopTitlebar />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-center space-y-4 max-w-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/25 animate-pulse">
              <School className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">EduPulse ERP</h2>
              <p className="text-xs text-slate-400 mt-1">Verifying encrypted institutional session...</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-blue-400 pt-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Checking authentication gateway...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. First-Run Institutional Setup: If the school has not been configured yet
  if (!isSetupCompleted) {
    return (
      <div className={`min-h-screen flex flex-col ${isDark ? 'dark bg-[#0B1120] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'}`}>
        <DesktopTitlebar />
        <div className="flex-1 flex flex-col">
          <SetupSchoolWizard
            onSetupComplete={(result) => {
              completeSetupSession(result.user, result.token);
              if (result.schoolConfig) {
                updateSettings(result.schoolConfig);
              }
            }}
          />
        </div>
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </div>
    );
  }

  // 3. Unauthenticated User Protection: Automatic Redirect to /login
  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100 select-none">
        <DesktopTitlebar />
        <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
          <LoginView onForgotPassword={() => setIsForgotPassOpen(true)} />
        </div>
        <ForgotPasswordModal
          isOpen={isForgotPassOpen}
          onClose={() => setIsForgotPassOpen(false)}
        />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </div>
    );
  }

  // 4. Authenticated Main Layout with Route Guards
  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col ${isDark ? 'dark bg-[#0B1120] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'}`}>
      <DesktopTitlebar />
      <div className="flex flex-1 h-full overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleNavigate}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Navbar */}
          <Navbar
            onOpenSidebar={() => setIsSidebarOpen(true)}
            onOpenSearch={() => setIsSearchOpen(true)}
            onNavigate={handleNavigate}
            canGoBack={canGoBack}
            onBack={handleBack}
          />

          {/* Scrollable View Container */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto pb-16">
              {/* Dynamic View Rendering with ProtectedRoute Role & RBAC Guards */}

              {/* 1. Dashboard (All authenticated roles) */}
              {activeTab === 'dashboard' && (
                <ProtectedRoute
                  currentPath="dashboard"
                  onNavigateHome={() => handleNavigate('dashboard')}
                  onSwitchRole={switchRole}
                >
                  <Dashboard onNavigate={handleNavigate} />
                </ProtectedRoute>
              )}

              {/* 2. Students Module */}
              {activeTab === 'students' && (
                <ProtectedRoute
                  allowedRoles={['Super Admin', 'School Admin', 'Principal', 'Teacher', 'Accountant', 'Student', 'Parent']}
                  requiredModule="students"
                  requiredAction="view"
                  currentPath="students"
                  onNavigateHome={() => handleNavigate('dashboard')}
                  onSwitchRole={switchRole}
                >
                  {selectedStudent ? (
                    <StudentProfileView
                      student={selectedStudent}
                      onBack={() => setSelectedStudent(null)}
                      onEdit={handleEditStudentFromProfile}
                    />
                  ) : (
                    <StudentsList onSelectStudent={handleSelectStudent} />
                  )}
                </ProtectedRoute>
              )}

              {/* 3. Teachers Module */}
              {activeTab === 'teachers' && (
                <ProtectedRoute
                  allowedRoles={['Super Admin', 'School Admin', 'Principal', 'Teacher']}
                  requiredModule="teachers"
                  requiredAction="view"
                  currentPath="teachers"
                  onNavigateHome={() => handleNavigate('dashboard')}
                  onSwitchRole={switchRole}
                >
                  <TeachersList />
                </ProtectedRoute>
              )}

              {/* 4. Classes Module */}
              {activeTab === 'classes' && (
                <ProtectedRoute
                  allowedRoles={['Super Admin', 'School Admin', 'Principal', 'Teacher']}
                  requiredModule="classes"
                  requiredAction="view"
                  currentPath="classes"
                  onNavigateHome={() => handleNavigate('dashboard')}
                  onSwitchRole={switchRole}
                >
                  <ClassesList />
                </ProtectedRoute>
              )}

              {/* 5. Attendance Module */}
              {activeTab === 'attendance' && (
                <ProtectedRoute
                  allowedRoles={['Super Admin', 'School Admin', 'Principal', 'Teacher', 'Student', 'Parent']}
                  requiredModule="attendance"
                  requiredAction="view"
                  currentPath="attendance"
                  onNavigateHome={() => handleNavigate('dashboard')}
                  onSwitchRole={switchRole}
                >
                  <AttendanceView />
                </ProtectedRoute>
              )}

              {/* 6. Exams & Results Module */}
              {activeTab === 'exams' && (
                <ProtectedRoute
                  allowedRoles={['Super Admin', 'School Admin', 'Principal', 'Teacher', 'Student', 'Parent']}
                  requiredModule="exams"
                  requiredAction="view"
                  currentPath="exams"
                  onNavigateHome={() => handleNavigate('dashboard')}
                  onSwitchRole={switchRole}
                >
                  <ExamsView />
                </ProtectedRoute>
              )}

              {/* 6b. Identity Cards */}
              {activeTab === 'cards' && (
                <ProtectedRoute
                  allowedRoles={['Super Admin', 'School Admin', 'Principal', 'Teacher', 'Accountant', 'Student', 'Parent']}
                  requiredModule="students"
                  requiredAction="view"
                  currentPath="cards"
                  onNavigateHome={() => handleNavigate('dashboard')}
                  onSwitchRole={switchRole}
                >
                  <CardsView />
                </ProtectedRoute>
              )}

              {/* 7. Timetable */}
              {activeTab === 'timetable' && (
                <ProtectedRoute
                  allowedRoles={['Super Admin', 'School Admin', 'Principal', 'Teacher', 'Student', 'Parent']}
                  requiredModule="timetable"
                  requiredAction="view"
                  currentPath="timetable"
                  onNavigateHome={() => handleNavigate('dashboard')}
                  onSwitchRole={switchRole}
                >
                  <TimetableView />
                </ProtectedRoute>
              )}

              {/* 8. Homework */}
              {activeTab === 'homework' && (
                <ProtectedRoute
                  allowedRoles={['Super Admin', 'School Admin', 'Principal', 'Teacher', 'Student', 'Parent']}
                  requiredModule="homework"
                  requiredAction="view"
                  currentPath="homework"
                  onNavigateHome={() => handleNavigate('dashboard')}
                  onSwitchRole={switchRole}
                >
                  <HomeworkView />
                </ProtectedRoute>
              )}

              {/* 9. Fees & Invoicing */}
              {activeTab === 'fees' && (
                <ProtectedRoute
                  allowedRoles={['Super Admin', 'School Admin', 'Principal', 'Accountant', 'Student', 'Parent']}
                  requiredModule="fees"
                  requiredAction="view"
                  currentPath="fees"
                  onNavigateHome={() => handleNavigate('dashboard')}
                  onSwitchRole={switchRole}
                >
                  <FeesView />
                </ProtectedRoute>
              )}

              {/* 10. Payroll (Strict RBAC: Super Admin, School Admin, Principal, Accountant ONLY) */}
              {activeTab === 'payroll' && (
                <ProtectedRoute
                  allowedRoles={['Super Admin', 'School Admin', 'Principal', 'Accountant']}
                  requiredModule="payroll"
                  requiredAction="view"
                  currentPath="payroll"
                  onNavigateHome={() => handleNavigate('dashboard')}
                  onSwitchRole={switchRole}
                >
                  <PayrollView />
                </ProtectedRoute>
              )}

              {/* 11. Expenses (Strict RBAC: Super Admin, School Admin, Principal, Accountant ONLY) */}
              {activeTab === 'expenses' && (
                <ProtectedRoute
                  allowedRoles={['Super Admin', 'School Admin', 'Principal', 'Accountant']}
                  requiredModule="expenses"
                  requiredAction="view"
                  currentPath="expenses"
                  onNavigateHome={() => handleNavigate('dashboard')}
                  onSwitchRole={switchRole}
                >
                  <ExpensesView />
                </ProtectedRoute>
              )}

              {/* 12. Library */}
              {activeTab === 'library' && (
                <ProtectedRoute
                  allowedRoles={['Super Admin', 'School Admin', 'Principal', 'Librarian', 'Teacher', 'Student']}
                  requiredModule="library"
                  requiredAction="view"
                  currentPath="library"
                  onNavigateHome={() => handleNavigate('dashboard')}
                  onSwitchRole={switchRole}
                >
                  <LibraryView />
                </ProtectedRoute>
              )}

              {/* 13. Transport */}
              {activeTab === 'transport' && (
                <ProtectedRoute
                  allowedRoles={['Super Admin', 'School Admin', 'Principal', 'Transport Manager', 'Parent', 'Student']}
                  requiredModule="transport"
                  requiredAction="view"
                  currentPath="transport"
                  onNavigateHome={() => handleNavigate('dashboard')}
                  onSwitchRole={switchRole}
                >
                  <TransportView />
                </ProtectedRoute>
              )}

              {/* 14. Reports */}
              {activeTab === 'reports' && (
                <ProtectedRoute
                  allowedRoles={['Super Admin', 'School Admin', 'Principal', 'Accountant', 'Teacher']}
                  requiredModule="reports"
                  requiredAction="view"
                  currentPath="reports"
                  onNavigateHome={() => handleNavigate('dashboard')}
                  onSwitchRole={switchRole}
                >
                  <ReportsView />
                </ProtectedRoute>
              )}

              {/* 15. System Settings (Super Admin, School Admin ONLY) */}
              {activeTab === 'settings' && (
                <ProtectedRoute
                  allowedRoles={['Super Admin', 'School Admin']}
                  requiredModule="settings"
                  requiredAction="view"
                  currentPath="settings"
                  onNavigateHome={() => handleNavigate('dashboard')}
                  onSwitchRole={switchRole}
                >
                  <SettingsView />
                </ProtectedRoute>
              )}

              {/* 16. Notices */}
              {(activeTab === 'notices' || activeTab === 'notifications') && (
                <ProtectedRoute
                  currentPath="notices"
                  onNavigateHome={() => handleNavigate('dashboard')}
                  onSwitchRole={switchRole}
                >
                  <NoticesView />
                </ProtectedRoute>
              )}

              {/* 17. Messages */}
              {activeTab === 'messages' && (
                <ProtectedRoute
                  currentPath="messages"
                  onNavigateHome={() => handleNavigate('dashboard')}
                  onSwitchRole={switchRole}
                >
                  <MessagesView />
                </ProtectedRoute>
              )}

              {/* 18. Leaves */}
              {activeTab === 'leaves' && (
                <ProtectedRoute
                  allowedRoles={['Super Admin', 'School Admin', 'Principal', 'Teacher', 'Accountant', 'Librarian', 'Transport Manager']}
                  requiredModule="leaves"
                  requiredAction="view"
                  currentPath="leaves"
                  onNavigateHome={() => handleNavigate('dashboard')}
                  onSwitchRole={switchRole}
                >
                  <LeavesView />
                </ProtectedRoute>
              )}

              {/* 19. User Management (Super Admin & School Admin ONLY) */}
              {activeTab === 'users' && (
                <ProtectedRoute
                  allowedRoles={['Super Admin', 'School Admin']}
                  requiredModule="users"
                  requiredAction="view"
                  currentPath="users"
                  onNavigateHome={() => handleNavigate('dashboard')}
                  onSwitchRole={switchRole}
                >
                  <UsersView />
                </ProtectedRoute>
              )}

              {/* 20. Audit Logs (Super Admin & School Admin ONLY) */}
              {activeTab === 'audit' && (
                <ProtectedRoute
                  allowedRoles={['Super Admin', 'School Admin']}
                  requiredModule="audit"
                  requiredAction="view"
                  currentPath="audit"
                  onNavigateHome={() => handleNavigate('dashboard')}
                  onSwitchRole={switchRole}
                >
                  <AuditLogsView />
                </ProtectedRoute>
              )}

              {/* 21. Security Verification & Direct URL Attack Harness */}
              {(activeTab === 'security' || activeTab === 'direct-url-test') && (
                <ProtectedRoute
                  currentPath="security"
                  onNavigateHome={() => handleNavigate('dashboard')}
                  onSwitchRole={switchRole}
                >
                  <SecurityAuditPlayground onNavigate={handleNavigate} />
                </ProtectedRoute>
              )}

              {/* 22. Profile */}
              {activeTab === 'profile' && (
                <ProtectedRoute
                  currentPath="profile"
                  onNavigateHome={() => handleNavigate('dashboard')}
                  onSwitchRole={switchRole}
                >
                  <UserProfileView />
                </ProtectedRoute>
              )}

              {/* 23. Direct 403 route */}
              {activeTab === '403' && (
                <AccessDeniedView
                  attemptedPath="/restricted"
                  requiredRoles={['Super Admin', 'School Admin']}
                  onNavigateHome={() => handleNavigate('dashboard')}
                  onSwitchRole={switchRole}
                />
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Screen Lock Modal */}
      <LockScreenModal isOpen={isLocked} />

      {/* Session Expired Re-Authentication Modal */}
      <SessionExpiredModal
        isOpen={isSessionExpired}
        onClose={closeSessionExpiredModal}
      />

      {/* Edit Student Modal from 360 profile */}
      <StudentFormModal
        isOpen={isStudentEditModalOpen}
        onClose={() => setIsStudentEditModalOpen(false)}
        studentToEdit={studentToEdit}
      />

      {/* Toast Feedback */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Application Shell Error">
      <ThemeProvider>
        <AuthProvider>
          <ERPDataProvider>
            <ErrorBoundary fallbackTitle="Module View Error">
              <MainLayout />
            </ErrorBoundary>
          </ERPDataProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
