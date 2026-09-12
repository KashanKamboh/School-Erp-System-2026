import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { Lock, ArrowRight, ShieldAlert } from 'lucide-react';

interface LockScreenModalProps {
  isOpen?: boolean;
}

export const LockScreenModal: React.FC<LockScreenModalProps> = ({ isOpen: controlledIsOpen }) => {
  const { isLocked: contextIsLocked, currentUser, unlockScreen, logout } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const isLocked = controlledIsOpen !== undefined ? controlledIsOpen : contextIsLocked;

  if (!isLocked) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = unlockScreen(pin);
    if (!success) {
      setError(true);
    } else {
      setError(false);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/85 flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl text-center animate-in zoom-in-95">
        <div className="relative inline-block mb-4">
          <Avatar name={currentUser.name} src={currentUser.avatar} size="xl" />
          <div className="absolute -bottom-1 -right-1 p-1.5 bg-amber-500 text-white rounded-full ring-4 ring-white dark:ring-slate-900">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Session Locked
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {currentUser.name} ({currentUser.role})
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <input
              type="password"
              autoFocus
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(false);
              }}
              placeholder="Enter PIN or password"
              className="w-full text-center tracking-widest text-sm py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-900 dark:text-white"
            />
            {error && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 flex items-center justify-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Invalid PIN or passcode (min 4 characters)
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <span>Unlock Session</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <button
          onClick={logout}
          className="mt-6 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium"
        >
          Sign in as a different user
        </button>
      </div>
    </div>
  );
};
