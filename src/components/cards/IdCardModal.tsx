import React, { useRef } from 'react';
import { OfficialIdCard } from './OfficialIdCard';
import { Student, Teacher, Staff, SchoolSettings } from '../../types/erp';
import { Printer, Download, X, IdCard, CheckCircle2 } from 'lucide-react';

interface IdCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'student' | 'teacher' | 'faculty' | 'staff';
  data: Student | Teacher | Staff | null;
  settings?: SchoolSettings;
  schoolSettings?: SchoolSettings;
}

export const IdCardModal: React.FC<IdCardModalProps> = ({
  isOpen,
  onClose,
  type,
  data,
  settings: propSettings,
  schoolSettings,
}) => {
  const settings = schoolSettings || propSettings;
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const name =
    type === 'student'
      ? `${(data as Student).firstName} ${(data as Student).lastName}`
      : (data as Teacher).name || 'Faculty Member';

  const roleLabel = type === 'student' ? 'Student' : 'Faculty / Staff';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      {/* Container */}
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 no-print"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900">
              <IdCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                {name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official {roleLabel} Identity Card
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Display Stage */}
        <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-950/60 flex flex-col items-center justify-center border-b border-slate-100 dark:border-slate-800">
          <div className="transform transition-transform hover:scale-[1.01]">
            <OfficialIdCard
              type={type}
              data={data}
              settings={settings}
              cardId="printable-modal-id-card"
            />
          </div>
          <p className="text-xs text-slate-400 mt-4 text-center">
            Standard CR80 / PVC dimensions. Ready for high-definition color printing.
          </p>
        </div>

        {/* Action Controls */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Card</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Print-Only View */}
      <div className="hidden print:block fixed inset-0 bg-white p-0 m-0 z-[9999]">
        <div className="flex items-center justify-center min-h-screen">
          <OfficialIdCard
            type={type}
            data={data}
            settings={settings}
            cardId="print-isolated-badge"
          />
        </div>
      </div>
    </div>
  );
};
