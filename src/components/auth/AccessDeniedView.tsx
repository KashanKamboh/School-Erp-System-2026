import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft, Lock, UserCheck, AlertTriangle, LogOut, School } from 'lucide-react';

interface AccessDeniedViewProps {
  attemptedPath?: string;
  requiredRoles?: string[];
  onNavigateHome: () => void;
  onSwitchRole?: (role: string) => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  attemptedPath = '/restricted',
  requiredRoles = ['Super Admin', 'School Admin'],
  onNavigateHome,
}) => {
  const { currentUser, logout } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-rose-200 dark:border-rose-900/50 shadow-2xl shadow-rose-500/10 text-center relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* 403 Badge & Icon */}
        <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 mb-6 shadow-inner">
          <ShieldAlert className="w-10 h-10 animate-pulse" />
          <span className="absolute -bottom-2 -right-2 px-2 py-0.5 bg-rose-600 text-white text-[11px] font-black rounded-md tracking-wider shadow-sm">
            403
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
          403 — Access Denied
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          You do not have the required institutional clearance to access this module or execute this action.
        </p>

        {/* Access Diagnostics Box */}
        <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 text-left space-y-3 mb-6 text-xs sm:text-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Attempted Route:</span>
            <code className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 rounded font-mono text-xs font-bold">
              {attemptedPath}
            </code>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Your Current Identity:</span>
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-500" />
              {currentUser.name}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Active Role:</span>
            <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md font-semibold text-xs">
              {currentUser.role}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Required Clearance:</span>
            <div className="flex flex-wrap gap-1 justify-end max-w-[220px]">
              {requiredRoles.map((r) => (
                <span
                  key={r}
                  className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded text-[10px] font-bold"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Security Audit Notice */}
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-start gap-2.5 text-left mb-6">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>Security Telemetry:</strong> This unauthorized access attempt has been logged in the immutable security audit log with your session identifier and timestamp for institutional review.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onNavigateHome}
            className="flex-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>

          <button
            onClick={logout}
            className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs sm:text-sm border border-slate-300 dark:border-slate-600 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Sign In with Different Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
