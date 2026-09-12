import React, { useState, useEffect } from 'react';
import { FeeVoucher, FeePayment } from '../../types/erp';
import { useERPData } from '../../context/ERPDataContext';
import { X, CheckCircle, CreditCard, DollarSign, AlertCircle, ShieldAlert } from 'lucide-react';

interface PaymentCollectionModalProps {
  voucher: FeeVoucher | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (payment: FeePayment) => void;
}

export const PaymentCollectionModal: React.FC<PaymentCollectionModalProps> = ({
  voucher,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const { collectVoucherPayment } = useERPData();

  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank' | 'Cheque' | 'Online Transfer' | 'Other'>('Cash');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [receivedBy, setReceivedBy] = useState<string>('Accounts Officer');
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (voucher) {
      setAmount(voucher.remainingBalance || 0);
      setPaymentDate(new Date().toISOString().substring(0, 10));
      setPaymentMethod('Cash');
      setRemarks('');
      setErrorMsg(null);
    }
  }, [voucher]);

  if (!isOpen || !voucher) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (amount <= 0) {
      setErrorMsg('Payment amount must be greater than Rs. 0.');
      return;
    }

    if (amount > voucher.remainingBalance) {
      setErrorMsg(`Amount cannot exceed remaining balance of Rs. ${voucher.remainingBalance.toLocaleString()}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = collectVoucherPayment(
        voucher.id,
        amount,
        paymentMethod,
        paymentDate,
        receivedBy,
        remarks
      );

      if (result.success && result.payment) {
        onPaymentSuccess(result.payment);
      } else {
        setErrorMsg('Failed to process payment. Please verify input and try again.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error occurred while saving payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="payment-collection-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div
        id="payment-collection-modal-card"
        className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-blue-950 text-white border-b border-blue-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-blue-950 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-wide text-white">
                Collect Fee Payment
              </h2>
              <p className="text-[11px] text-blue-200 font-mono">
                {voucher.voucherNo} • {voucher.feeMonth}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-payment-collection-modal-btn"
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white hover:bg-blue-900 rounded-md cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voucher Info Summary Banner */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {voucher.studentName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Father: {voucher.fatherName || '—'} • Adm #: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{voucher.admissionNo}</span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300">
                  {voucher.class} - {voucher.section}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Due: {voucher.dueDate}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Status
              </span>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-xs text-xs font-bold uppercase ${
                  voucher.status === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : voucher.status === 'PARTIALLY PAID'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {voucher.status}
              </span>
            </div>
          </div>

          {/* Metric tiles */}
          <div className="grid grid-cols-3 gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/80 text-center">
            <div>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase block">Total Demanded</span>
              <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                Rs. {voucher.totalPayable.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase block">Already Paid</span>
              <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                Rs. {voucher.paidAmount.toLocaleString()}
              </span>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/40 rounded-sm p-0.5 border border-amber-200 dark:border-amber-800/60">
              <span className="text-[10px] font-bold text-amber-900 dark:text-amber-300 uppercase block">Balance Due</span>
              <span className="text-sm font-black font-mono text-red-600 dark:text-red-400">
                Rs. {voucher.remainingBalance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Collection Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Amount Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="collection-amount-input" className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Payment Amount (PKR / Rs.) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  id="pay-full-amount-btn"
                  onClick={() => setAmount(voucher.remainingBalance)}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                >
                  Pay Full (Rs. {voucher.remainingBalance.toLocaleString()})
                </button>
                {voucher.remainingBalance > 1000 && (
                  <>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      id="pay-half-amount-btn"
                      onClick={() => setAmount(Math.round(voucher.remainingBalance / 2))}
                      className="text-[11px] text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
                    >
                      Pay Half
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                Rs.
              </span>
              <input
                type="number"
                id="collection-amount-input"
                min={1}
                max={voucher.remainingBalance}
                step="any"
                required
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-10 pr-3 py-2 text-sm font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-900 dark:text-white"
                placeholder="Enter amount to receive"
              />
            </div>
          </div>

          {/* Method & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="collection-method-select" className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                id="collection-method-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-900 dark:text-white"
              >
                <option value="Cash">Cash at Counter</option>
                <option value="Bank">Bank Deposit (HBL)</option>
                <option value="Online Transfer">Online Transfer / 1Bill / Raast</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="collection-date-input" className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="collection-date-input"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Received By */}
          <div>
            <label htmlFor="collection-received-by-input" className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Received By / Cashier Name
            </label>
            <input
              type="text"
              id="collection-received-by-input"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-900 dark:text-white"
              placeholder="Officer Name"
            />
          </div>

          {/* Remarks / Transaction Reference */}
          <div>
            <label htmlFor="collection-remarks-input" className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Remarks / Transaction Reference
            </label>
            <input
              type="text"
              id="collection-remarks-input"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-900 dark:text-white"
              placeholder="e.g. Deposit Slip #89102 / Bank reference / Cash received at desk"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              id="cancel-collection-modal-btn"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-lg cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="confirm-payment-collection-btn"
              disabled={isSubmitting || amount <= 0}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording...' : `Record Payment (Rs. ${amount.toLocaleString()})`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
