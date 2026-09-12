import React from 'react';
import { FeePayment, SchoolSettings } from '../../types/erp';
import { X, Printer, CheckCircle, GraduationCap, Landmark, ShieldCheck } from 'lucide-react';

interface PaymentReceiptModalProps {
  payment: FeePayment | null;
  schoolSettings: SchoolSettings;
  isOpen: boolean;
  onClose: () => void;
}

// Convert numbers to Words in PKR (Pakistani Rupees)
function numberToWordsPKR(num: number): string {
  if (!num || isNaN(num) || num <= 0) return 'Zero Rupees Only';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertGroup(n: number): string {
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += ones[n] + ' ';
    }
    return str;
  }

  let result = '';
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const remainder = Math.floor(num);

  if (crore > 0) result += convertGroup(crore) + 'Crore ';
  if (lakh > 0) result += convertGroup(lakh) + 'Lakh ';
  if (thousand > 0) result += convertGroup(thousand) + 'Thousand ';
  if (remainder > 0) result += convertGroup(remainder);

  return (result.trim() + ' Rupees Only');
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  payment,
  schoolSettings,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="payment-receipt-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static print:overflow-visible"
    >
      <div
        id="payment-receipt-modal-card"
        className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col print:shadow-none print:w-full print:max-w-none"
      >
        {/* MODAL HEADER (Hidden during print) */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-blue-950 text-white border-b border-blue-900 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-wide text-white">
                Official Fee Payment Receipt
              </h2>
              <p className="text-[11px] text-blue-200">
                Receipt #{payment.receiptNo} • {payment.studentName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="receipt-print-btn"
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-blue-950 font-bold px-3 py-1.5 rounded-md text-xs cursor-pointer shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
            <button
              type="button"
              id="receipt-close-btn"
              onClick={onClose}
              className="p-1.5 text-blue-200 hover:text-white hover:bg-blue-900 rounded-md cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTENT */}
        <div className="p-6 bg-white text-slate-900 border-8 border-double border-slate-200 m-2 rounded-sm print:m-0 print:border-none">
          {/* Top School Header */}
          <div className="text-center border-b-2 border-blue-900 pb-3 mb-3">
            <div className="flex items-center justify-center gap-2 mb-1">
              {schoolSettings.logoUrl ? (
                <div className="w-8 h-8 rounded-md overflow-hidden border border-slate-300 bg-white flex items-center justify-center p-0.5 shrink-0">
                  <img src={schoolSettings.logoUrl} alt={schoolSettings.schoolName || 'School Logo'} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-900 text-amber-400 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
              )}
              <h1 className="text-lg font-black uppercase text-blue-950 tracking-tight">
                {schoolSettings.schoolName || 'OFFICIAL FEE RECEIPT'}
              </h1>
            </div>
            <p className="text-[10px] font-semibold text-slate-600 tracking-wide">
              {schoolSettings.address || (schoolSettings.city ? `${schoolSettings.city}, ${schoolSettings.country || 'Pakistan'}` : '')} {schoolSettings.phone ? `• Phone: ${schoolSettings.phone}` : ''}
            </p>
            <div className="mt-1.5 inline-block bg-blue-900 text-white font-black text-[10px] uppercase px-3 py-0.5 rounded-xs tracking-wider">
              FEE PAYMENT RECEIPT (OFFICIAL ACCOUNTS COPY)
            </div>
          </div>

          {/* Receipt & Voucher Meta */}
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xs border border-slate-200 text-xs mb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Receipt Number:</span>
              <span className="font-mono font-black text-blue-900 text-sm">{payment.receiptNo}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Payment Date:</span>
              <span className="font-semibold text-slate-900">{payment.paymentDate}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Voucher Ref:</span>
              <span className="font-mono font-bold text-slate-800">{payment.voucherNo}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Payment Method:</span>
              <span className="inline-flex items-center gap-1 font-bold text-slate-900 bg-white px-2 py-0.5 rounded-xs border border-slate-200">
                <Landmark className="w-3 h-3 text-blue-800" />
                {payment.paymentMethod}
              </span>
            </div>
          </div>

          {/* Student Particulars */}
          <div className="border border-slate-200 rounded-xs p-3 text-xs mb-4">
            <div className="grid grid-cols-2 gap-y-1.5">
              <div>
                <span className="text-slate-500 font-medium">Student Name: </span>
                <span className="font-bold text-slate-900">{payment.studentName}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Father Name: </span>
                <span className="font-semibold text-slate-800">{payment.fatherName || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Admission No: </span>
                <span className="font-mono font-bold text-blue-900">{payment.admissionNo || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Class & Section: </span>
                <span className="font-bold text-slate-900">{payment.class} - {payment.section}</span>
              </div>
            </div>
          </div>

          {/* Amount Box */}
          <div className="bg-amber-50 border-2 border-amber-400 rounded-xs p-3.5 mb-3 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block mb-0.5">
              AMOUNT RECEIVED
            </span>
            <div className="text-2xl font-black font-mono text-blue-950">
              Rs. {payment.amountPaid.toLocaleString()}
            </div>
            <p className="text-[11px] font-medium text-slate-700 italic mt-1">
              ({numberToWordsPKR(payment.amountPaid)})
            </p>
          </div>

          {/* Financial Breakdown */}
          <div className="grid grid-cols-2 gap-2 text-xs border border-slate-200 p-2.5 rounded-xs bg-slate-50/50 mb-4">
            <div>
              <span className="text-slate-500">Status After Payment: </span>
              <span className="font-bold text-emerald-700 uppercase">{payment.status}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500">Remaining Balance: </span>
              <span className={`font-mono font-bold ${payment.remainingBalance > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                Rs. {payment.remainingBalance.toLocaleString()}
              </span>
            </div>
            {payment.remarks && (
              <div className="col-span-2 pt-1 border-t border-slate-200 text-slate-600">
                <span className="font-medium text-slate-500">Remarks: </span>
                <span>{payment.remarks}</span>
              </div>
            )}
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 mt-4 border-t border-slate-200">
            <div className="text-center">
              <div className="border-t border-slate-400 w-32 mx-auto mb-1"></div>
              <span className="text-[10px] font-bold uppercase text-slate-700 block">
                Cashier / Accountant
              </span>
              <span className="text-[9px] text-slate-500">({payment.receivedBy || 'Marcus Vance'})</span>
            </div>
            <div className="text-center">
              <div className="border-t border-slate-400 w-32 mx-auto mb-1"></div>
              <span className="text-[10px] font-bold uppercase text-slate-700 block">
                Authorized School Stamp
              </span>
              <span className="text-[9px] text-slate-500 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Verified & Recorded
              </span>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2 print:hidden">
          <button
            type="button"
            id="receipt-modal-done-btn"
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-md cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
