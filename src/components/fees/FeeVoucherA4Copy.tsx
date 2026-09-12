import React from 'react';
import { FeeVoucher, SchoolSettings } from '../../types/erp';
import { Landmark, GraduationCap, Phone, Mail, MapPin } from 'lucide-react';

interface FeeVoucherA4CopyProps {
  voucher: FeeVoucher;
  schoolSettings: SchoolSettings;
  copyType: 'SCHOOL COPY' | "PARENTS' COPY";
  subTitle?: string;
  isCompact?: boolean;
}

export const FeeVoucherA4Copy: React.FC<FeeVoucherA4CopyProps> = ({
  voucher,
  schoolSettings,
  copyType,
  subTitle,
  isCompact = false,
}) => {
  const lateFeeAmount = schoolSettings.lateFeeAmount || 300;
  const payableAfterDueDate = (voucher.totalPayable || 0) + (voucher.fine > 0 ? 0 : lateFeeAmount);

  const statusColor =
    voucher.status === 'PAID'
      ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
      : voucher.status === 'PARTIALLY PAID'
      ? 'border-blue-600 text-blue-700 bg-blue-50/50'
      : voucher.status === 'OVERDUE'
      ? 'border-rose-600 text-rose-700 bg-rose-50/50'
      : 'border-amber-500 text-amber-700 bg-amber-50/50';

  return (
    <div
      id={`voucher-copy-${voucher.id}-${copyType.replace(/\s+/g, '-').toLowerCase()}`}
      className={`relative bg-white text-slate-900 border border-slate-300 rounded-sm flex flex-col justify-between overflow-hidden ${
        isCompact ? 'p-3 text-[11px] leading-tight' : 'p-4 text-[12px] leading-snug'
      }`}
      style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
    >
      {/* Official Status Stamp */}
      <div
        className={`absolute top-24 right-6 border-2 border-dashed px-3 py-1 font-black tracking-widest text-xs uppercase transform rotate-[-12deg] pointer-events-none select-none opacity-85 z-10 ${statusColor}`}
      >
        {voucher.status}
      </div>

      {/* TOP HEADER */}
      <div>
        <div className="border-b-2 border-blue-900 pb-2 mb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {schoolSettings.logoUrl ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-300 bg-white flex items-center justify-center p-0.5 shrink-0 shadow-xs">
                  <img src={schoolSettings.logoUrl} alt={schoolSettings.schoolName || 'School Logo'} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-900 text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
                  <GraduationCap className="w-6 h-6" />
                </div>
              )}
              <div>
                <h1 className="text-base font-black tracking-tight text-blue-950 uppercase leading-none">
                  {schoolSettings.schoolName || 'SCHOOL FEE VOUCHER'}
                </h1>
                <p className="text-[10px] font-semibold text-slate-600 tracking-wide mt-0.5">
                  {schoolSettings.tagline || (schoolSettings.city ? `${schoolSettings.city} Campus` : 'Academic Excellence')}
                </p>
                <div className="flex items-center gap-3 text-[9px] text-slate-500 mt-0.5">
                  {schoolSettings.affiliationNumber && (
                    <span>Affiliation: {schoolSettings.affiliationNumber}</span>
                  )}
                  {schoolSettings.registrationNumber && (
                    <span>Reg #: {schoolSettings.registrationNumber}</span>
                  )}
                </div>
              </div>
            </div>

            {/* COPY BADGE */}
            <div className="text-right shrink-0">
              <div className="bg-amber-400 text-slate-950 font-black px-2.5 py-1 text-[10px] uppercase rounded-sm border border-amber-500 shadow-xs tracking-wider">
                {copyType}
              </div>
              <p className="text-[8.5px] font-bold text-slate-500 uppercase mt-0.5">
                {subTitle || (copyType === 'SCHOOL COPY' ? 'FOR SCHOOL RECORD' : 'KEEP THIS VOUCHER')}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[8.5px] text-slate-500 mt-1.5 pt-1 border-t border-slate-200">
            <span className="flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5" />
              {schoolSettings.address || (schoolSettings.city ? `${schoolSettings.city}, ${schoolSettings.country || 'Pakistan'}` : 'Campus Address')}
            </span>
            {schoolSettings.phone ? (
              <span className="flex items-center gap-1">
                <Phone className="w-2.5 h-2.5" />
                {schoolSettings.phone}
              </span>
            ) : null}
          </div>
        </div>

        {/* VOUCHER KEY METRICS STRIP */}
        <div className="grid grid-cols-4 gap-1.5 bg-blue-900 text-white rounded-xs p-2 mb-2 shadow-xs">
          <div>
            <span className="block text-[8.5px] uppercase font-medium text-blue-200">Voucher No.</span>
            <span className="block text-xs font-mono font-black text-amber-300 tracking-wider">
              {voucher.voucherNo}
            </span>
          </div>
          <div>
            <span className="block text-[8.5px] uppercase font-medium text-blue-200">Fee Month</span>
            <span className="block text-xs font-bold text-white">
              {voucher.feeMonth}
            </span>
          </div>
          <div>
            <span className="block text-[8.5px] uppercase font-medium text-blue-200">Issue Date</span>
            <span className="block text-xs font-semibold text-blue-100">
              {voucher.issueDate}
            </span>
          </div>
          <div className="bg-red-950/70 border border-red-400/40 rounded-xs px-1.5 py-0.5">
            <span className="block text-[8.5px] uppercase font-bold text-amber-300">Due Date</span>
            <span className="block text-xs font-black text-white">
              {voucher.dueDate}
            </span>
          </div>
        </div>

        {/* STUDENT BIO INFORMATION CARD */}
        <div className="border border-slate-300 rounded-xs bg-slate-50/70 p-2 mb-2.5">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
            <div className="flex items-baseline">
              <span className="w-24 text-[10px] uppercase font-semibold text-slate-500 shrink-0">
                Student Name:
              </span>
              <span className="font-bold text-slate-900 truncate">{voucher.studentName}</span>
            </div>
            <div className="flex items-baseline">
              <span className="w-24 text-[10px] uppercase font-semibold text-slate-500 shrink-0">
                Father Name:
              </span>
              <span className="font-medium text-slate-800 truncate">{voucher.fatherName || '—'}</span>
            </div>
            <div className="flex items-baseline">
              <span className="w-24 text-[10px] uppercase font-semibold text-slate-500 shrink-0">
                Admission No:
              </span>
              <span className="font-mono font-bold text-blue-900">{voucher.admissionNo}</span>
            </div>
            <div className="flex items-baseline">
              <span className="w-24 text-[10px] uppercase font-semibold text-slate-500 shrink-0">
                Class / Section:
              </span>
              <span className="font-bold text-slate-900">
                {voucher.class} - {voucher.section}
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="w-24 text-[10px] uppercase font-semibold text-slate-500 shrink-0">
                Roll Number:
              </span>
              <span className="font-medium text-slate-800">{voucher.rollNumber || '—'}</span>
            </div>
            <div className="flex items-baseline">
              <span className="w-24 text-[10px] uppercase font-semibold text-slate-500 shrink-0">
                Student Category:
              </span>
              <span className="inline-flex items-center px-1.5 py-0.2 bg-blue-100 text-blue-900 rounded-xs text-[9.5px] font-bold">
                {voucher.studentType === 'New' ? 'New Admission' : 'Regular Student'}
              </span>
            </div>
          </div>
        </div>

        {/* FEE PARTICULARS TABLE */}
        <table className="w-full border-collapse border border-slate-300 mb-2">
          <thead>
            <tr className="bg-blue-900 text-white text-[10px] uppercase tracking-wider">
              <th className="border border-blue-950 px-2 py-1 w-10 text-center font-bold">Sr.</th>
              <th className="border border-blue-950 px-2 py-1 text-left font-bold">Fee Description</th>
              <th className="border border-blue-950 px-2 py-1 w-28 text-right font-bold">Amount (PKR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-[11px]">
            {voucher.items && voucher.items.length > 0 ? (
              voucher.items.map((item, idx) => (
                <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                  <td className="border border-slate-300 px-2 py-1 text-center font-mono text-[10px] text-slate-500">
                    {idx + 1}
                  </td>
                  <td className="border border-slate-300 px-2 py-1 font-medium text-slate-800">
                    {item.feeDescription}
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-right font-mono font-semibold text-slate-900">
                    Rs. {item.amount.toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="border border-slate-300 px-2 py-1 text-center font-mono text-slate-500">1</td>
                <td className="border border-slate-300 px-2 py-1 font-medium text-slate-800">Tuition & School Fee</td>
                <td className="border border-slate-300 px-2 py-1 text-right font-mono font-semibold text-slate-900">
                  Rs. {voucher.currentCharges.toLocaleString()}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* FINANCIAL SUMMARY RECONCILIATION */}
        <div className="border border-slate-300 rounded-xs bg-slate-50 mb-2 overflow-hidden">
          <div className="p-2 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-700">
              <span>Current Month Charges:</span>
              <span className="font-mono font-semibold">Rs. {voucher.currentCharges.toLocaleString()}</span>
            </div>

            {voucher.previousBalance > 0 && (
              <div className="flex justify-between text-amber-800 font-medium">
                <span>Previous Balance / Arrears:</span>
                <span className="font-mono font-bold">+ Rs. {voucher.previousBalance.toLocaleString()}</span>
              </div>
            )}

            {voucher.discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Fee Concession / Discount:</span>
                <span className="font-mono font-bold">- Rs. {voucher.discount.toLocaleString()}</span>
              </div>
            )}

            {voucher.fine > 0 && (
              <div className="flex justify-between text-rose-700 font-medium">
                <span>Late Fine / Surcharge:</span>
                <span className="font-mono font-bold">+ Rs. {voucher.fine.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* TOTAL PAYABLE HIGHLIGHT BANNER */}
          <div className="bg-amber-400 border-t border-b border-amber-500 px-2.5 py-1.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-950 block leading-tight">
                Net Payable (Within Due Date):
              </span>
              <span className="text-[9px] text-slate-800 font-medium">
                Due on or before {voucher.dueDate}
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-black font-mono text-slate-950">
                Rs. {voucher.totalPayable.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="p-2 bg-rose-50/70 border-b border-slate-300 text-[10.5px] flex items-center justify-between">
            <span className="text-rose-900 font-bold">
              Payable After Due Date (+ Rs. {lateFeeAmount} Fine):
            </span>
            <span className="font-mono font-black text-rose-900 text-xs">
              Rs. {payableAfterDueDate.toLocaleString()}
            </span>
          </div>

          {/* PAID & REMAINING ROW IF ANY PAYMENT RECEIVED */}
          {voucher.paidAmount > 0 && (
            <div className="p-2 bg-emerald-50/80 text-[11px] flex items-center justify-between border-b border-slate-300">
              <div className="text-emerald-900 font-semibold">
                Amount Paid: <span className="font-mono font-bold">Rs. {voucher.paidAmount.toLocaleString()}</span>
              </div>
              <div className="text-slate-900 font-bold">
                Remaining Balance: <span className="font-mono text-red-700">Rs. {voucher.remainingBalance.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* BANK ACCOUNT COLLECTION DETAILS */}
        <div className="border border-slate-300 rounded-xs p-2 bg-blue-50/40 text-[10px] mb-2">
          <div className="flex items-center gap-1.5 font-bold text-blue-950 mb-1">
            <Landmark className="w-3.5 h-3.5 text-blue-900" />
            <span>Bank & Payment Collection Details</span>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-slate-700">
            <div>
              <span className="font-medium text-slate-500">Bank: </span>
              <span className="font-bold text-slate-900">{schoolSettings.bankName || 'Official Fee Collection Bank'}</span>
            </div>
            <div>
              <span className="font-medium text-slate-500">Branch: </span>
              <span className="font-medium text-slate-900">{schoolSettings.bankBranch || 'Authorized Branch'}</span>
            </div>
            <div className="col-span-2">
              <span className="font-medium text-slate-500">A/C Title: </span>
              <span className="font-bold text-slate-900">{schoolSettings.accountTitle || (schoolSettings.schoolName ? `${schoolSettings.schoolName.toUpperCase()} COLLECTION A/C` : 'FEE COLLECTION A/C')}</span>
            </div>
            <div>
              <span className="font-medium text-slate-500">A/C No: </span>
              <span className="font-mono font-bold text-blue-900">{schoolSettings.accountNumber || 'Available at Accounts Desk'}</span>
            </div>
            <div>
              <span className="font-medium text-slate-500">IBAN: </span>
              <span className="font-mono text-[9px] font-semibold text-slate-800">{schoolSettings.iban || 'Provided on Voucher'}</span>
            </div>
          </div>
        </div>

        {/* INSTRUCTIONS & RULES */}
        <div className="text-[9px] text-slate-500 space-y-0.5 mb-3">
          <p>• Fee must be deposited in cash at school counter or credited to the school bank account on or before the due date.</p>
          <p>• Late fee surcharge of Rs. {lateFeeAmount} will be strictly applied after {voucher.dueDate}.</p>
          <p>• Retain this voucher copy securely. Duplicate voucher will be charged Rs. 100.</p>
        </div>
      </div>

      {/* FOOTER SIGNATURES & NOTICE */}
      <div className="pt-2 border-t border-slate-300">
        <div className="grid grid-cols-2 gap-4 mt-6 mb-2">
          <div className="text-center">
            <div className="border-t border-slate-400 w-3/4 mx-auto mb-1"></div>
            <span className="text-[9.5px] font-bold uppercase text-slate-700 block">
              Accounts Officer / Cashier
            </span>
          </div>
          <div className="text-center">
            <div className="border-t border-slate-400 w-3/4 mx-auto mb-1"></div>
            <span className="text-[9.5px] font-bold uppercase text-slate-700 block">
              Principal / Finance Incharge
            </span>
          </div>
        </div>

        <p className="text-[8px] text-center text-slate-400 italic">
          This is a computer-generated fee voucher issued by {schoolSettings.schoolName || 'School Management ERP'}. Valid without manual seal if payment verified.
        </p>
      </div>
    </div>
  );
};
