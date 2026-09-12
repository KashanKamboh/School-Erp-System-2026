import React, { useState } from 'react';
import { FeeVoucher, SchoolSettings } from '../../types/erp';
import { FeeVoucherA4Copy } from './FeeVoucherA4Copy';
import { X, Printer, Download, ChevronLeft, ChevronRight, Scissors, Columns2, Rows2 } from 'lucide-react';

interface FeeVoucherPrintModalProps {
  vouchers: FeeVoucher[];
  initialIndex?: number;
  schoolSettings: SchoolSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const FeeVoucherPrintModal: React.FC<FeeVoucherPrintModalProps> = ({
  vouchers,
  initialIndex = 0,
  schoolSettings,
  isOpen,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [layoutMode, setLayoutMode] = useState<'landscape' | 'portrait'>('landscape');
  const [printAllMode, setPrintAllMode] = useState(false);

  if (!isOpen || vouchers.length === 0) return null;

  const currentVoucher = vouchers[currentIndex] || vouchers[0];

  const handlePrint = (all = false) => {
    setPrintAllMode(all);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div
      id="fee-voucher-print-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:overflow-visible"
    >
      {/* Container */}
      <div
        id="fee-voucher-modal-container"
        className="relative bg-slate-100 dark:bg-slate-900 w-full max-w-6xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:rounded-none print:bg-white print:w-full print:max-w-none"
      >
        {/* MODAL CONTROL HEADER (Hidden when printing) */}
        <div className="flex items-center justify-between px-4 py-3 bg-blue-950 text-white border-b border-blue-900 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="bg-amber-400 text-blue-950 font-black px-2 py-0.5 text-xs uppercase rounded-xs">
              Fee Voucher
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-wide text-white flex items-center gap-2">
                <span>{currentVoucher.voucherNo}</span>
                <span className="text-blue-300 font-normal">— {currentVoucher.studentName} ({currentVoucher.class}-{currentVoucher.section})</span>
              </h2>
              <p className="text-[11px] text-blue-200">
                Pakistani Dual-Copy Official Fee Voucher (School & Parents' Record)
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Multi-voucher pagination if more than 1 */}
            {vouchers.length > 1 && (
              <div className="flex items-center bg-blue-900 rounded-md px-2 py-1 text-xs text-blue-100 gap-1 border border-blue-800">
                <button
                  type="button"
                  id="voucher-nav-prev-btn"
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="p-1 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Previous Voucher"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-xs px-1">
                  {currentIndex + 1} of {vouchers.length}
                </span>
                <button
                  type="button"
                  id="voucher-nav-next-btn"
                  onClick={() => setCurrentIndex((prev) => Math.min(vouchers.length - 1, prev + 1))}
                  disabled={currentIndex === vouchers.length - 1}
                  className="p-1 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Next Voucher"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Layout Toggle */}
            <div className="hidden sm:flex items-center bg-blue-900 rounded-md p-0.5 border border-blue-800">
              <button
                type="button"
                id="voucher-layout-landscape-btn"
                onClick={() => setLayoutMode('landscape')}
                className={`flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-medium cursor-pointer transition-colors ${
                  layoutMode === 'landscape' ? 'bg-blue-800 text-amber-300' : 'text-blue-200 hover:text-white'
                }`}
                title="A4 Landscape (Side-by-Side)"
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>Side-by-Side</span>
              </button>
              <button
                type="button"
                id="voucher-layout-portrait-btn"
                onClick={() => setLayoutMode('portrait')}
                className={`flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-medium cursor-pointer transition-colors ${
                  layoutMode === 'portrait' ? 'bg-blue-800 text-amber-300' : 'text-blue-200 hover:text-white'
                }`}
                title="A4 Portrait (Stacked)"
              >
                <Rows2 className="w-3.5 h-3.5" />
                <span>Stacked</span>
              </button>
            </div>

            {/* Print Current */}
            <button
              type="button"
              id="print-single-voucher-btn"
              onClick={() => handlePrint(false)}
              className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-blue-950 font-bold px-3 py-1.5 rounded-md text-xs cursor-pointer shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Voucher</span>
            </button>

            {/* Print All if multiple */}
            {vouchers.length > 1 && (
              <button
                type="button"
                id="print-all-vouchers-btn"
                onClick={() => handlePrint(true)}
                className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-600 text-white font-medium px-3 py-1.5 rounded-md text-xs cursor-pointer shadow-xs transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print All ({vouchers.length})</span>
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              id="close-voucher-print-modal-btn"
              onClick={onClose}
              className="p-1.5 text-blue-200 hover:text-white hover:bg-blue-900 rounded-md cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE CANVAS AREA */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-200/80 dark:bg-slate-950 print:p-0 print:bg-white print:overflow-visible">
          {/* If printAllMode is false, print only current voucher */}
          {!printAllMode ? (
            <div className="max-w-[280mm] mx-auto bg-white p-3 sm:p-4 rounded-sm shadow-md print:shadow-none print:p-0 print:max-w-none print:w-full">
              {layoutMode === 'landscape' ? (
                /* 2-COLUMN SIDE-BY-SIDE (LANDSCAPE A4) */
                <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4 items-stretch relative">
                  {/* Vertical Cutting Line */}
                  <div className="hidden md:flex print:flex absolute inset-y-0 left-1/2 -translate-x-1/2 flex-col items-center justify-between py-4 pointer-events-none z-20">
                    <Scissors className="w-4 h-4 text-slate-400 rotate-90" />
                    <div className="flex-1 w-px border-l-2 border-dashed border-slate-300 my-2"></div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest py-1 rotate-90 select-none">
                      CUT HERE
                    </span>
                    <div className="flex-1 w-px border-l-2 border-dashed border-slate-300 my-2"></div>
                    <Scissors className="w-4 h-4 text-slate-400 rotate-90" />
                  </div>

                  {/* LEFT: SCHOOL COPY */}
                  <div className="pr-0 md:pr-3 print:pr-3">
                    <FeeVoucherA4Copy
                      voucher={currentVoucher}
                      schoolSettings={schoolSettings}
                      copyType="SCHOOL COPY"
                      subTitle="FOR SCHOOL RECORD"
                      isCompact
                    />
                  </div>

                  {/* RIGHT: PARENTS' COPY */}
                  <div className="pl-0 md:pl-3 print:pl-3">
                    <FeeVoucherA4Copy
                      voucher={currentVoucher}
                      schoolSettings={schoolSettings}
                      copyType="PARENTS' COPY"
                      subTitle="KEEP THIS VOUCHER FOR YOUR RECORD"
                      isCompact
                    />
                  </div>
                </div>
              ) : (
                /* STACKED TOP-AND-BOTTOM (PORTRAIT A4) */
                <div className="flex flex-col gap-4">
                  {/* TOP: SCHOOL COPY */}
                  <div>
                    <FeeVoucherA4Copy
                      voucher={currentVoucher}
                      schoolSettings={schoolSettings}
                      copyType="SCHOOL COPY"
                      subTitle="FOR SCHOOL RECORD"
                    />
                  </div>

                  {/* Horizontal Cutting Line */}
                  <div className="flex items-center gap-3 py-1 text-slate-400">
                    <Scissors className="w-4 h-4 text-slate-400" />
                    <div className="flex-1 border-t-2 border-dashed border-slate-300"></div>
                    <span className="text-[9.5px] font-bold uppercase tracking-widest select-none">
                      CUT HERE — DETACH BEFORE DEPOSIT
                    </span>
                    <div className="flex-1 border-t-2 border-dashed border-slate-300"></div>
                    <Scissors className="w-4 h-4 text-slate-400 -scale-x-100" />
                  </div>

                  {/* BOTTOM: PARENTS' COPY */}
                  <div>
                    <FeeVoucherA4Copy
                      voucher={currentVoucher}
                      schoolSettings={schoolSettings}
                      copyType="PARENTS' COPY"
                      subTitle="KEEP THIS VOUCHER FOR YOUR RECORD"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* BULK PRINT ALL VOUCHERS */
            <div className="space-y-8 print:space-y-0">
              {vouchers.map((v, vIdx) => (
                <div
                  key={v.id || vIdx}
                  className="max-w-[280mm] mx-auto bg-white p-4 rounded-sm shadow-md print:shadow-none print:p-0 print:w-full print:break-after-page"
                  style={{ pageBreakAfter: 'always' }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4 items-stretch relative">
                    <div className="hidden md:flex print:flex absolute inset-y-0 left-1/2 -translate-x-1/2 flex-col items-center justify-between py-4 pointer-events-none z-20">
                      <Scissors className="w-4 h-4 text-slate-400 rotate-90" />
                      <div className="flex-1 w-px border-l-2 border-dashed border-slate-300 my-2"></div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest py-1 rotate-90 select-none">
                        CUT HERE
                      </span>
                      <div className="flex-1 w-px border-l-2 border-dashed border-slate-300 my-2"></div>
                      <Scissors className="w-4 h-4 text-slate-400 rotate-90" />
                    </div>

                    <div className="pr-0 md:pr-3 print:pr-3">
                      <FeeVoucherA4Copy
                        voucher={v}
                        schoolSettings={schoolSettings}
                        copyType="SCHOOL COPY"
                        subTitle="FOR SCHOOL RECORD"
                        isCompact
                      />
                    </div>

                    <div className="pl-0 md:pl-3 print:pl-3">
                      <FeeVoucherA4Copy
                        voucher={v}
                        schoolSettings={schoolSettings}
                        copyType="PARENTS' COPY"
                        subTitle="KEEP THIS VOUCHER FOR YOUR RECORD"
                        isCompact
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODAL FOOTER HELP (Hidden when printing) */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 print:hidden">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Printer optimization ready: A4 landscape side-by-side or portrait stacked supported.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="modal-close-bottom-btn"
              onClick={onClose}
              className="px-3 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium rounded-md cursor-pointer transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              id="modal-print-bottom-btn"
              onClick={() => handlePrint(false)}
              className="px-4 py-1 bg-blue-900 hover:bg-blue-800 text-amber-400 font-bold rounded-md cursor-pointer transition-colors flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
