import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useERPData } from '../../context/ERPDataContext';
import { Avatar } from '../common/Avatar';
import {
  Search,
  Bell,
  MessageSquare,
  Sun,
  Moon,
  Laptop,
  LogOut,
  Lock,
  Key,
  User as UserIcon,
  Menu,
  ArrowLeft,
  ChevronDown,
  School,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  onOpenSidebar?: () => void;
  onOpenSearch: () => void;
  onNavigate: (view: string) => void;
  canGoBack?: boolean;
  onBack?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenSidebar,
  onOpenSearch,
  onNavigate,
  canGoBack,
  onBack,
}) => {
  const { currentUser, logout, lockScreen, hasModulePermission } = useAuth();
  const { theme, setTheme, toggleTheme, isDark } = useTheme();
  const { notifications, markNotificationRead, clearAllNotifications, messages, settings } = useERPData();

  const handleToggleMenu = () => {
    if (onOpenSidebar) onOpenSidebar();
    else if (onToggleSidebar) onToggleSidebar();
  };

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showMsgMenu, setShowMsgMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const msgRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
      if (msgRef.current && !msgRef.current.contains(event.target as Node)) {
        setShowMsgMenu(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadNotifs = notifications.filter((n) => !n.read);
  const unreadMsgs = messages.filter((m) => !m.read);

  return (
    <header className="no-print sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button, Back Button & Search Trigger */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-1 max-w-xl">
          <button
            onClick={handleToggleMenu}
            className="p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-hidden lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop/Web Navigation Back Button */}
          {canGoBack && (
            <button
              onClick={onBack}
              type="button"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
              title="Go back to previous page"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          {/* Quick Search Omnibox */}
          <button
            onClick={onOpenSearch}
            className="flex-1 flex items-center justify-between px-3.5 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-500 dark:text-slate-400 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              <span className="truncate">Search students, fees, classes, exams...</span>
            </div>
            <div className="hidden sm:flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md">
                ⌘K
              </kbd>
            </div>
          </button>
        </div>

        {/* Dynamic School Branding in Header */}
        <div
          onClick={() => onNavigate('settings')}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/60 rounded-xl cursor-pointer transition-colors"
          title="School Profile Settings"
        >
          {settings.logoUrl ? (
            <div className="w-6 h-6 rounded-md bg-white p-0.5 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
              <img src={settings.logoUrl} alt={settings.schoolName || 'School'} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
              <School className="w-3.5 h-3.5" />
            </div>
          )}
          <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate max-w-[160px] lg:max-w-[220px]">
            {settings.schoolName || 'School ERP'}
          </span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Quick Toggle */}
          <button
            onClick={() => toggleTheme()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline font-bold">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline font-bold">Dark</span>
              </>
            )}
          </button>

          {/* Notifications Popover */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-40 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Notifications
                    </span>
                    {unreadNotifs.length > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-full">
                        {unreadNotifs.length} new
                      </span>
                    )}
                  </div>
                  <button
                    onClick={clearAllNotifications}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-xs ${
                          !n.read ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-semibold text-slate-900 dark:text-white">
                            {n.title}
                          </h5>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {n.timestamp}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-800/30">
                  <button
                    onClick={() => {
                      onNavigate('notifications');
                      setShowNotifMenu(false);
                    }}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Messages Trigger */}
          <div className="relative" ref={msgRef}>
            <button
              onClick={() => setShowMsgMenu(!showMsgMenu)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative"
              title="Messages"
            >
              <MessageSquare className="w-4 h-4" />
              {unreadMsgs.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {showMsgMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-40 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Direct Communications
                  </span>
                  <button
                    onClick={() => {
                      onNavigate('messages');
                      setShowMsgMenu(false);
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Open Inbox
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => {
                        onNavigate('messages');
                        setShowMsgMenu(false);
                      }}
                      className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer flex items-start gap-3"
                    >
                      <Avatar name={m.senderName} src={m.senderAvatar} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {m.senderName}
                          </p>
                          <span className="text-[10px] text-slate-400">{m.timestamp}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate mt-0.5">
                          {m.subject}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {m.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

          {/* User Profile Avatar & Menu */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors focus:outline-hidden"
            >
              <Avatar
                name={currentUser.name}
                src={currentUser.avatar}
                size="sm"
                status="online"
              />
              <div className="text-left hidden lg:block">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {currentUser.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none mt-0.5">
                  {currentUser.role}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-40 p-2">
                <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {currentUser.email}
                  </p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                    {currentUser.role}
                  </span>
                </div>

                <div className="py-1.5 text-xs">
                  <button
                    onClick={() => {
                      onNavigate('profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>My Profile</span>
                  </button>

                  {hasModulePermission('settings', 'view') && (
                    <button
                      onClick={() => {
                        onNavigate('settings');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Key className="w-4 h-4 text-slate-400" />
                      <span>School Settings</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      lockScreen();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span>Lock Screen</span>
                  </button>
                </div>

                <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-xs font-semibold cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out of ERP</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Header Sign Out Button */}
          <button
            type="button"
            onClick={() => logout()}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-rose-200/80 dark:border-rose-900/50 bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
            title="Sign Out of ERP Session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="font-bold">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
