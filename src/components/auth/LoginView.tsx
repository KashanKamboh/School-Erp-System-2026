import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useERPData } from '../../context/ERPDataContext';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { SignupModal } from './SignupModal';
import {
  GraduationCap,
  School,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  BookOpen,
  User,
  Heart,
  AlertCircle,
  Clock,
  XCircle,
  Users,
} from 'lucide-react';

interface LoginViewProps {
  onForgotPassword?: () => void;
}

type RoleType = 'Admin' | 'Teacher' | 'Student' | 'Parent';

const ROLES: { id: RoleType; label: string; icon: React.ElementType; iconColor: string }[] = [
  { id: 'Admin', label: 'Admin', icon: Shield, iconColor: 'text-[#FF5722]' },
  { id: 'Teacher', label: 'Teacher', icon: BookOpen, iconColor: 'text-sky-500' },
  { id: 'Student', label: 'Student', icon: Users, iconColor: 'text-indigo-500' },
  { id: 'Parent', label: 'Parent', icon: Heart, iconColor: 'text-rose-500' },
];

export const LoginView: React.FC<LoginViewProps> = ({ onForgotPassword }) => {
  const { login } = useAuth();
  const { settings, students, teachers } = useERPData();

  const [selectedRole, setSelectedRole] = useState<RoleType>('Admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Feedback states
  const [error, setError] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);

  // Modals
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  const handleRoleSelect = (role: RoleType) => {
    setSelectedRole(role);
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAccountStatus(null);
    setRejectionReason(null);
    setSubmittedAt(null);
    setLoading(true);

    const res = await login(email, password, true);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Invalid username or password.');
      if (res.status) setAccountStatus(res.status);
      if (res.rejectionReason) setRejectionReason(res.rejectionReason);
      if (res.submittedAt) setSubmittedAt(res.submittedAt);
    }
  };

  const schoolTitle = settings?.schoolName || 'EduFlow';
  const schoolLogo = settings?.logoUrl;
  const studentCount = students?.length > 0 ? students.length.toLocaleString() : '2,847';
  const teacherCount = teachers?.length > 0 ? teachers.length.toLocaleString() : '184';

  return (
    <div className="w-full h-full min-h-screen flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 select-none overflow-y-auto">
      {/* Container Card */}
      <div className="w-full max-w-5xl bg-white dark:bg-[#131B2E] rounded-3xl shadow-2xl overflow-hidden border border-slate-200/60 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
        
        {/* LEFT COLUMN: Orange Gradient Hero Showcase */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#FF6433] via-[#FF541E] to-[#E64A19] p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Ambient Background circles */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-20 w-72 h-72 bg-black/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Branding */}
          <div className="relative z-10 space-y-1.5">
            <div className="flex items-center gap-3">
              {schoolLogo ? (
                <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-md border border-white/30">
                  <img src={schoolLogo} alt={schoolTitle} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-black tracking-tight leading-none text-white">
                  {schoolTitle}
                </h2>
                <p className="text-xs text-white/80 font-medium mt-0.5">
                  School Management System
                </p>
              </div>
            </div>
          </div>

          {/* Middle Hero Copy */}
          <div className="relative z-10 my-10 lg:my-0 space-y-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white drop-shadow-xs">
              Manage your school with confidence
            </h1>
            <p className="text-sm text-white/90 leading-relaxed max-w-sm font-normal">
              A complete platform for administrators, teachers, students, and parents.
            </p>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-3 gap-2.5 pt-4">
              <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 text-left">
                <div className="text-lg sm:text-xl font-black text-white leading-tight">
                  {studentCount}
                </div>
                <div className="text-[11px] text-white/80 font-medium">Students</div>
              </div>

              <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 text-left">
                <div className="text-lg sm:text-xl font-black text-white leading-tight">
                  {teacherCount}
                </div>
                <div className="text-[11px] text-white/80 font-medium">Teachers</div>
              </div>

              <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 text-left">
                <div className="text-lg sm:text-xl font-black text-white leading-tight">
                  100%
                </div>
                <div className="text-[11px] text-white/80 font-medium">Offline</div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="relative z-10 text-[11px] text-white/70 font-medium pt-4">
            © 2026 {schoolTitle}. All rights reserved.
          </div>
        </div>

        {/* RIGHT COLUMN: Sign In Form & Role Selector */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-white dark:bg-[#131B2E] text-slate-800 dark:text-slate-100">
          <div className="max-w-md w-full mx-auto space-y-6">
            
            {/* Header */}
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Welcome back
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Select your role and sign in
              </p>
            </div>

            {/* Feedback Alerts */}
            {error && !accountStatus && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {accountStatus === 'Pending' && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-1 text-xs text-amber-800 dark:text-amber-300">
                <div className="flex items-center gap-1.5 font-bold">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Account Status: Pending Approval</span>
                </div>
                <p className="text-[11px]">Your registration is currently under review by administration.</p>
              </div>
            )}

            {accountStatus === 'Rejected' && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-xl space-y-1 text-xs text-rose-800 dark:text-rose-300">
                <div className="flex items-center gap-1.5 font-bold">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Account Registration Declined</span>
                </div>
                {rejectionReason && <p className="text-[11px]">Reason: {rejectionReason}</p>}
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email / Username Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email / Username</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#FF5722] focus:border-[#FF5722] focus:outline-hidden text-slate-900 dark:text-white placeholder:text-slate-400 transition-colors"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Password</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#FF5722] focus:border-[#FF5722] focus:outline-hidden text-slate-900 dark:text-white placeholder:text-slate-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Active Role Indicator Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-900/50 text-[11px] font-semibold text-[#FF5722]">
                <Shield className="w-3.5 h-3.5" />
                <span>Signing in as <strong className="font-bold">{selectedRole}</strong></span>
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#FF5722] to-[#F4511E] hover:from-[#F4511E] hover:to-[#E64A19] text-white font-bold rounded-xl text-sm shadow-md shadow-orange-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In as {selectedRole}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Register Link */}
            <div className="text-center text-xs text-slate-500 dark:text-slate-400">
              New school?{' '}
              <button
                type="button"
                onClick={() => setShowSignupModal(true)}
                className="font-bold text-[#FF5722] hover:underline cursor-pointer"
              >
                Register School
              </button>
            </div>

            {/* SELECT ROLE SECTION */}
            <div className="space-y-2.5 pt-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                SELECT ROLE
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {ROLES.map((roleItem) => {
                  const Icon = roleItem.icon;
                  const isSelected = selectedRole === roleItem.id;
                  return (
                    <button
                      key={roleItem.id}
                      type="button"
                      onClick={() => handleRoleSelect(roleItem.id)}
                      className={`p-3 rounded-2xl border transition-all flex items-center gap-3 text-left cursor-pointer ${
                        isSelected
                          ? 'bg-orange-50/90 dark:bg-orange-950/30 border-[#FF5722] shadow-xs'
                          : 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-[#FF5722]/15 text-[#FF5722]'
                            : 'bg-white dark:bg-slate-800 shadow-xs text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div
                          className={`text-xs font-bold ${
                            isSelected ? 'text-[#FF5722]' : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {roleItem.label}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>

      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
      />

      <SignupModal
        isOpen={showSignupModal}
        defaultRole="Super Admin"
        onClose={() => setShowSignupModal(false)}
        onSuccess={(registeredEmail) => {
          setEmail(registeredEmail);
          setPassword('');
        }}
      />
    </div>
  );
};
