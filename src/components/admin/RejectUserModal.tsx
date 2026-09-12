import React, { useState } from 'react';
import { User } from '../../types/erp';
import { X, ShieldAlert, XCircle, AlertTriangle } from 'lucide-react';

interface RejectUserModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export const RejectUserModal: React.FC<RejectUserModalProps> = ({
  isOpen,
  user,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('Institutional affiliation could not be verified with school records.');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onConfirm(reason);
    setLoading(false);
    onClose();
  };

  const presetReasons = [
    'Institutional affiliation could not be verified with school records.',
    'Invalid student admission or faculty appointment number.',
    'Duplicate account registration detected.',
    'Incorrect academic department or role selected.',
    'Institutional policy requires in-person registrar clearance.',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-600/10 text-rose-600 dark:text-rose-400">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Reject Registration Request
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Decline enrollment for {user.name} ({user.email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              This will transition the user's status to <strong>REJECTED</strong>. Any future sign-in attempt by this user will be blocked with the explanation below.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Reason for Rejection (Displayed to User on Login)
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden text-slate-900 dark:text-white"
              placeholder="Specify the reason why this account request was declined..."
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Select Preset Standard Reason:
            </label>
            <div className="space-y-1.5">
              {presetReasons.map((pr, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReason(pr)}
                  className={`w-full text-left p-2 rounded-lg text-xs transition-colors border ${
                    reason === pr
                      ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-300 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {pr}
                </button>
              ))}
            </div>
          </div>

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
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md shadow-rose-500/20 flex items-center gap-1.5"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{loading ? 'Rejecting...' : 'Confirm Rejection'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
