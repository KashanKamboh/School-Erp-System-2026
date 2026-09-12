import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Mail, KeyRound, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useERPData } from '../../context/ERPDataContext';
import { api } from '../../services/apiClient';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { showToast } = useERPData();
  const [step, setStep] = useState<'email' | 'otp' | 'reset' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [dispatchedOtp, setDispatchedOtp] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      setLoading(false);
      if (res.otpCode) {
        setDispatchedOtp(res.otpCode);
      }
      setStep('otp');
      showToast('Verification Code Dispatched', `A 6-digit verification code has been generated for ${email}`, 'info');
    } catch (err: any) {
      setLoading(false);
      showToast('Error', err.message || 'Could not send verification code.', 'error');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return;
    setStep('reset');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('Password Mismatch', 'New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('Security Policy', 'Password must be at least 8 characters long.', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: email.trim(),
        otp: otp.join(''),
        newPassword,
      });
      setLoading(false);
      setStep('success');
      showToast('Password Reset Complete', 'Your credentials have been securely updated.');
    } catch (err: any) {
      setLoading(false);
      showToast('Reset Failed', err.message || 'Failed to reset password.', 'error');
    }
  };

  const handleOtpChange = (val: string, idx: number) => {
    const updated = [...otp];
    updated[idx] = val.substring(val.length - 1);
    setOtp(updated);
    if (val && idx < 5) {
      const nextInput = document.getElementById(`otp-input-${idx + 1}`);
      nextInput?.focus();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setStep('email');
      }}
      title="Reset ERP Account Password"
      subtitle="Secure two-factor recovery flow"
      maxWidth="md"
    >
      {step === 'email' && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Enter your institutional email address or student/employee ID to receive an OTP code.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Registered Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@greenwood.edu"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? 'Sending OTP Code...' : 'Send Verification OTP'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4 text-center">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Enter the 6-digit OTP code sent to <strong className="text-slate-900 dark:text-white">{email}</strong>
          </p>

          <div className="flex justify-center gap-2 py-3">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-input-${idx}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(e.target.value, idx)}
                className="w-11 h-12 text-center text-lg font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            ))}
          </div>

          {dispatchedOtp && (
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 rounded-xl text-xs text-blue-700 dark:text-blue-300 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <span>Security verification code: <strong>{dispatchedOtp}</strong></span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || otp.join('').length < 6}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer"
          >
            {loading ? 'Verifying...' : 'Verify OTP Code'}
          </button>
        </form>
      )}

      {step === 'reset' && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            {loading ? 'Updating...' : 'Set New Password'}
          </button>
        </form>
      )}

      {step === 'success' && (
        <div className="text-center py-4 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-base">
            Password Changed Successfully!
          </h4>
          <p className="text-xs text-slate-500">
            You can now log in using your new credentials.
          </p>
          <button
            onClick={onClose}
            className="mt-3 px-6 py-2 bg-blue-600 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs"
          >
            Back to Sign In
          </button>
        </div>
      )}
    </Modal>
  );
};
