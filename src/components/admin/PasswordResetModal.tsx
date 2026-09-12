import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { KeyRound, Copy, Check, ShieldAlert } from 'lucide-react';
import { User } from '../../types/erp';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  tempPassword: string;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  isOpen,
  onClose,
  user,
  tempPassword,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Temporary Credentials Issued"
      subtitle={`Security passkey generated for ${user.name}`}
      maxWidth="md"
      footer={
        <div className="flex justify-end w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      }
    >
      <div className="space-y-4 text-xs sm:text-sm">
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-amber-800 dark:text-amber-300 text-xs">
            <p className="font-bold">One-Time Temporary Password</p>
            <p className="mt-0.5 text-amber-700/90 dark:text-amber-400/90">
              Provide this temporary passcode to <span className="font-semibold">{user.email}</span>. The user will be required to create a new password upon their next sign in.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Temporary Passkey
            </span>
            <span className="text-[11px] text-slate-400">Valid for 24 hours</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 font-mono text-base font-bold bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 tracking-wider">
              {tempPassword}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="p-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-1.5 transition-colors cursor-pointer text-xs font-semibold"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between">
            <span>User Account:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{user.name} ({user.role})</span>
          </div>
          <div className="flex justify-between">
            <span>Registered Email:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span>Security Action:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Session Invalidated & Password Reset</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
