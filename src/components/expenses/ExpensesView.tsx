import React, { useState } from 'react';
import { useERPData } from '../../context/ERPDataContext';
import { useAuth } from '../../context/AuthContext';
import { ExpenseRecord } from '../../types/erp';
import { PageHeader } from '../common/PageHeader';
import { DataTable, Column } from '../common/DataTable';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  Receipt,
  Plus,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Tag,
  Building,
} from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { expenses, addExpense, showToast } = useERPData();
  const { hasModulePermission } = useAuth();
  const canCreateExpense = hasModulePermission('expenses', 'create');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<ExpenseRecord>>({
    title: '',
    category: 'Electricity',
    amount: 500,
    date: new Date().toISOString().split('T')[0],
    paidTo: '',
    invoiceNo: 'INV-EXP-001',
    paymentMethod: 'Bank Transfer',
    approvedBy: 'Principal Office',
    notes: '',
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) {
      showToast('Validation Error', 'Title and amount are required.', 'error');
      return;
    }

    addExpense({
      title: formData.title || 'Expense',
      category: (formData.category as any) || 'Maintenance',
      amount: Number(formData.amount) || 0,
      date: formData.date || new Date().toISOString().split('T')[0],
      invoiceNo: formData.invoiceNo || `EXP-${Date.now().toString().slice(-4)}`,
      paymentMethod: formData.paymentMethod || 'Bank Transfer',
      paidTo: formData.paidTo || 'Vendor',
      approvedBy: formData.approvedBy || 'Dr. Arthur Pendelton',
      notes: formData.notes,
    });
    showToast('Voucher Created', `Recorded expense voucher of $${formData.amount}.`);
    setIsModalOpen(false);
  };

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const columns: Column<ExpenseRecord>[] = [
    {
      key: 'title',
      header: 'Expense Voucher',
      accessor: (e) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{e.title}</p>
          <p className="text-xs text-slate-400">{e.paidTo} • #{e.invoiceNo}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      accessor: (e) => (
        <Badge variant="neutral" size="sm">
          {e.category}
        </Badge>
      ),
    },
    {
      key: 'date',
      header: 'Voucher Date',
      accessor: (e) => (
        <span className="text-xs text-slate-500 font-medium">{e.date}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount (PKR)',
      accessor: (e) => (
        <span className="font-bold text-slate-900 dark:text-white">
          Rs. {e.amount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Method',
      accessor: (e) => (
        <Badge variant="primary" size="sm">
          {e.paymentMethod}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operational Expense & Voucher Management"
        subtitle="Track school procurement, infrastructure utility bills, maintenance, and audit trails"
        badge={<Badge variant="primary">${totalSpent.toLocaleString()} Total Spent</Badge>}
        actions={
          canCreateExpense ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Expense Voucher</span>
            </button>
          ) : undefined
        }
      />

      {/* Main DataTable */}
      <DataTable
        title="Expense Voucher Register"
        subtitle="Procurement and operational expenditures audit"
        data={expenses}
        columns={columns}
        keyExtractor={(e) => e.id}
        searchPlaceholder="Search expense title, category, vendor..."
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Expense Voucher"
        subtitle="Log operational invoice, select budget head, and vendor"
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            >
              Authorize Voucher
            </button>
          </>
        }
      >
        <form onSubmit={handleAdd} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Expense Item Title *
            </label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Science Lab Chemical Refill"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category Head
              </label>
              <select
                value={formData.category || 'Utilities'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Utilities">Utilities & Electricity</option>
                <option value="Laboratory">Lab Equipment & Chemicals</option>
                <option value="Maintenance">Campus Maintenance</option>
                <option value="Events & Sports">Events & Sports</option>
                <option value="IT Infrastructure">IT & Software Licenses</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Amount (PKR) *
              </label>
              <input
                type="number"
                required
                placeholder="Enter amount in Rs."
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value === '' ? 0 : Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Paid To / Vendor
              </label>
              <input
                type="text"
                value={formData.paidTo || ''}
                onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })}
                placeholder="e.g. Apex Scientific Supplies"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Voucher Date
              </label>
              <input
                type="date"
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
