import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useERPData } from '../../context/ERPDataContext';
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Building,
  Phone,
  FileText,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  X,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (registeredEmail: string) => void;
  defaultRole?: string;
}

export const SignupModal: React.FC<SignupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultRole = 'Super Admin',
}) => {
  const { signup } = useAuth();
  const { settings } = useERPData();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(defaultRole);
  const [department, setDepartment] = useState(
    defaultRole === 'Super Admin' ? 'Executive Administration' : 'Science Faculty'
  );
  const [phone, setPhone] = useState('');
  const [registrationReason, setRegistrationReason] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedStatus, setSubmittedStatus] = useState<boolean>(false);
  const [submittedEmail, setSubmittedEmail] = useState<string>('');

  if (!isOpen) return null;

  // Password validation checks
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    if (!isPasswordValid) {
      setError('Password does not satisfy institutional security policy requirements.');
      return;
    }

    setLoading(true);
    try {
      const res = await signup({
        name,
        email,
        password,
        role,
        department,
        phone,
        registrationReason,
      });

      setLoading(false);
      if (res.success) {
        setSubmittedStatus(true);
        setSubmittedEmail(email);
        if (onSuccess) onSuccess(email);
      } else {
        setError(res.error || 'Registration request could not be processed.');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'An error occurred during registration.');
    }
  };

  const handleResetForm = () => {
    setName('');
    setEmail('');
    setRole('Teacher');
    setDepartment('Science Faculty');
    setPhone('');
    setRegistrationReason('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setSubmittedStatus(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Institutional User Registration
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Self-register for staff, student, or guardian access (Subject to Super Admin Approval)
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleResetForm();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Information Banner */}
        <div className="px-6 py-2.5 bg-blue-50/70 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/50 text-[11px] text-blue-900 dark:text-blue-200">
          <div className="flex items-center justify-between flex-wrap gap-2 font-medium">
            <div className="flex items-center gap-1.5 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Real-Time Institutional Enrollment:</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
              <span className="bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <Check className="w-3 h-3" /> Direct Clearance & Instant Account Activation
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {submittedStatus ? (
            /* Post-submission Success & Direct Access View */
            <div className="py-6 space-y-6 text-center animate-in fade-in duration-300">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-500/10">
                <Check className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
                  <Check className="w-3.5 h-3.5" /> Account Status: ACTIVE
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Welcome to {settings.schoolName || 'School ERP'}!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                  Your account for <span className="font-semibold text-slate-900 dark:text-white">{submittedEmail}</span> has been established and activated. You have direct access to all institutional systems.
                </p>
              </div>

              {/* Status Explanation Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2.5">
                <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-900 dark:text-white">Active Session Initialized:</strong> A secure JWT session has been generated and provisioned. Your real credentials are now active on the system.
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    handleResetForm();
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <span>Enter Portal Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Legal Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Dr. Julian Bashir"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Official / Personal Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. j.bashir@greenwood.edu"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Requested Role */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Requested Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value);
                      if (e.target.value === 'Super Admin') setDepartment('Executive Administration');
                      else if (e.target.value === 'School Admin') setDepartment('School Operations');
                      else if (e.target.value === 'Teacher') setDepartment('Science Faculty');
                      else if (e.target.value === 'Student') setDepartment('Grade 10 - Section A');
                      else if (e.target.value === 'Parent') setDepartment('Guardian of Student');
                      else if (e.target.value === 'Accountant') setDepartment('Finance & Accounts');
                      else if (e.target.value === 'Librarian') setDepartment('Library & Media');
                      else if (e.target.value === 'Transport Manager') setDepartment('Fleet & Transit');
                    }}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-900 dark:text-white font-medium"
                  >
                    <option value="Super Admin">Super Admin (Full System & RBAC Control)</option>
                    <option value="School Admin">School Admin (Institutional Operations)</option>
                    <option value="Teacher">Teacher (Faculty & Academics)</option>
                    <option value="Student">Student (Timetable, Exams & Marks)</option>
                    <option value="Parent">Parent / Guardian (Child Progress & Fees)</option>
                    <option value="Accountant">Accountant (Invoices, Payroll & Ledgers)</option>
                    <option value="Librarian">Librarian (Book Catalog & Loans)</option>
                    <option value="Transport Manager">Transport Manager (Bus Routes & Fleet)</option>
                  </select>
                </div>

                {/* Department / Class */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department / Class / Affiliation
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Mathematics Department"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 019-9000"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Registration Reason / Verification ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Staff ID / Admission ID / Verification Note
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={registrationReason}
                      onChange={(e) => setRegistrationReason(e.target.value)}
                      placeholder="e.g. Staff ID #FAC-2026 or Student #GIA-001"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Create Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Real-time Password Policy Badges */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2 text-[11px]">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                  Password Security Policy Requirements:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <span
                    className={`flex items-center gap-1.5 font-medium ${
                      hasMinLength ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${hasMinLength ? 'text-emerald-500' : 'text-slate-300'}`} />
                    8+ Characters
                  </span>
                  <span
                    className={`flex items-center gap-1.5 font-medium ${
                      hasUpper ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${hasUpper ? 'text-emerald-500' : 'text-slate-300'}`} />
                    Uppercase (A-Z)
                  </span>
                  <span
                    className={`flex items-center gap-1.5 font-medium ${
                      hasLower ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${hasLower ? 'text-emerald-500' : 'text-slate-300'}`} />
                    Lowercase (a-z)
                  </span>
                  <span
                    className={`flex items-center gap-1.5 font-medium ${
                      hasNumber ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${hasNumber ? 'text-emerald-500' : 'text-slate-300'}`} />
                    Number (0-9)
                  </span>
                  <span
                    className={`flex items-center gap-1.5 font-medium ${
                      hasSpecial ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${hasSpecial ? 'text-emerald-500' : 'text-slate-300'}`} />
                    Special Symbol (!@#)
                  </span>
                  <span
                    className={`flex items-center gap-1.5 font-medium ${
                      passwordsMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${passwordsMatch ? 'text-emerald-500' : 'text-slate-300'}`} />
                    Passwords Match
                  </span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
                >
                  {loading ? (
                    <span>Submitting Request...</span>
                  ) : (
                    <>
                      <span>Submit for Super Admin Approval</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
