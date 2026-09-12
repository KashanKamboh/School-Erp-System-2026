import React, { useState } from 'react';
import { useERPData } from '../../context/ERPDataContext';
import { FeeStructure } from '../../types/erp';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Settings,
  GraduationCap,
  Sparkles,
  Layers,
  Search,
  Filter,
} from 'lucide-react';

export const FeeStructureTab: React.FC = () => {
  const {
    feeStructures,
    classes,
    addFeeStructure,
    updateFeeStructure,
    deleteFeeStructure,
  } = useERPData();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FeeStructure | null>(null);
  const [studentTypeFilter, setStudentTypeFilter] = useState<'All' | 'Regular' | 'New'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [feeName, setFeeName] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [frequency, setFrequency] = useState<FeeStructure['frequency']>('Monthly');
  const [studentType, setStudentType] = useState<'All' | 'Regular' | 'New'>('Regular');
  const [targetClass, setTargetClass] = useState('All Classes');
  const [targetSection, setTargetSection] = useState('All');
  const [isActive, setIsActive] = useState(true);

  const openAddModal = (defaultType?: 'Regular' | 'New') => {
    setEditingItem(null);
    setFeeName('');
    setAmount(0);
    setFrequency('Monthly');
    setStudentType(defaultType || 'Regular');
    setTargetClass('All Classes');
    setTargetSection('All');
    setIsActive(true);
    setIsAddModalOpen(true);
  };

  const openEditModal = (item: FeeStructure) => {
    setEditingItem(item);
    setFeeName(item.feeName || item.name);
    setAmount(item.amount);
    setFrequency(item.frequency);
    setStudentType(item.studentType as any);
    setTargetClass(item.class || item.className || 'All Classes');
    setTargetSection(item.section || item.sectionName || 'All');
    setIsActive(item.isActive);
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeName.trim() || amount <= 0) return;

    if (editingItem) {
      updateFeeStructure(editingItem.id, {
        name: feeName.trim(),
        feeName: feeName.trim(),
        amount,
        frequency,
        studentType,
        class: targetClass,
        className: targetClass,
        section: targetSection,
        sectionName: targetSection,
        isActive,
      });
    } else {
      addFeeStructure({
        name: feeName.trim(),
        feeName: feeName.trim(),
        amount,
        frequency,
        studentType,
        class: targetClass,
        className: targetClass,
        section: targetSection,
        sectionName: targetSection,
        isActive,
        createdAt: new Date().toISOString().substring(0, 10),
      });
    }
    setIsAddModalOpen(false);
  };

  const filteredStructures = feeStructures.filter((item) => {
    if (studentTypeFilter !== 'All' && item.studentType !== 'All' && item.studentType !== studentTypeFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (item.feeName || item.name || '').toLowerCase();
      const cls = (item.class || item.className || '').toLowerCase();
      if (!name.includes(q) && !cls.includes(q)) return false;
    }
    return true;
  });

  const newStudentTotal = feeStructures
    .filter((f) => f.isActive && (f.studentType === 'New' || f.studentType === 'All'))
    .reduce((sum, f) => sum + f.amount, 0);

  const regularMonthlyTotal = feeStructures
    .filter((f) => f.isActive && (f.studentType === 'Regular' || f.studentType === 'All') && f.frequency === 'Monthly')
    .reduce((sum, f) => sum + f.amount, 0);

  return (
    <div id="fee-structure-tab" className="space-y-6">
      {/* Top Banner & Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Fee Rules
            </span>
            <span className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Settings className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {feeStructures.filter((f) => f.isActive).length}
            </span>
            <span className="text-xs text-slate-500">configured fees</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Rules apply automatically during Bulk Voucher Generation
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-xl p-4 shadow-xs bg-gradient-to-br from-white to-amber-50/40 dark:from-slate-900 dark:to-amber-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              New Student Package
            </span>
            <span className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              Rs. {newStudentTotal.toLocaleString()}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Admission + Tuition + School Fee + Card Fee
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 rounded-xl p-4 shadow-xs bg-gradient-to-br from-white to-blue-50/40 dark:from-slate-900 dark:to-blue-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
              Regular Monthly Fee
            </span>
            <span className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
              <GraduationCap className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              Rs. {regularMonthlyTotal.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">/ month</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Monthly Fee + Tuition Fee (+ Examination Fee per term)
          </p>
        </div>
      </div>

      {/* FILTER & ACTIONS BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        {/* Search & Filter */}
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="fee-structure-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fee rules..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
            <button
              type="button"
              id="filter-type-all"
              onClick={() => setStudentTypeFilter('All')}
              className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                studentTypeFilter === 'All'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              id="filter-type-regular"
              onClick={() => setStudentTypeFilter('Regular')}
              className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                studentTypeFilter === 'Regular'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Regular
            </button>
            <button
              type="button"
              id="filter-type-new"
              onClick={() => setStudentTypeFilter('New')}
              className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                studentTypeFilter === 'New'
                  ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              New Student
            </button>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            id="add-fee-rule-btn"
            onClick={() => openAddModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add Fee Rule</span>
          </button>
        </div>
      </div>

      {/* FEE STRUCTURE TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Configured Fee Schedule & Rates
          </h3>
          <span className="text-xs text-slate-500">
            Showing {filteredStructures.length} of {feeStructures.length} rules
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 uppercase text-[10.5px] font-bold">
                <th className="p-3.5 pl-6">Fee Name</th>
                <th className="p-3.5">Student Type</th>
                <th className="p-3.5">Class / Section</th>
                <th className="p-3.5">Frequency</th>
                <th className="p-3.5 text-right">Amount (PKR)</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredStructures.length > 0 ? (
                filteredStructures.map((fs) => (
                  <tr
                    key={fs.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3.5 pl-6">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {fs.feeName || fs.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {fs.description || 'Mandatory school fee charge'}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          fs.studentType === 'New'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            : fs.studentType === 'Regular'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                            : 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                        }`}
                      >
                        {fs.studentType === 'New' ? 'New Student' : fs.studentType === 'Regular' ? 'Regular Student' : 'All Students'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-sm font-semibold">
                        {fs.class || fs.className || 'All Classes'}
                        {(fs.section || fs.sectionName) && (fs.section !== 'All') ? ` (${fs.section})` : ''}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      {fs.frequency}
                    </td>
                    <td className="p-3.5 text-right font-mono font-black text-sm text-slate-900 dark:text-white">
                      Rs. {fs.amount.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => updateFeeStructure(fs.id, { isActive: !fs.isActive })}
                        className="inline-flex items-center gap-1 cursor-pointer"
                        title="Click to toggle status"
                      >
                        {fs.isActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full font-bold text-[11px]">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-medium text-[11px]">
                            <XCircle className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="p-3.5 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(fs)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer transition-colors"
                          title="Edit Fee Rule"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete fee rule "${fs.feeName || fs.name}"?`)) {
                              deleteFeeStructure(fs.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer transition-colors"
                          title="Delete Fee Rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No fee rules match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {isAddModalOpen && (
        <div
          id="fee-structure-modal-backdrop"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            id="fee-structure-modal-card"
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center justify-between px-5 py-4 bg-blue-950 text-white border-b border-blue-900">
              <h3 className="font-bold text-sm">
                {editingItem ? 'Edit Fee Rule' : 'Configure New Fee Rule'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-blue-200 hover:text-white rounded-md cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Fee Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={feeName}
                  onChange={(e) => setFeeName(e.target.value)}
                  placeholder="e.g. Tuition Fee, Admission Fee, Examination Fee"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Amount in PKR (Rs.) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">
                    Rs.
                  </span>
                  <input
                    type="number"
                    min={1}
                    required
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="e.g. 5000"
                    className="w-full pl-10 pr-3 py-2 font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Student Type
                  </label>
                  <select
                    value={studentType}
                    onChange={(e) => setStudentType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="Regular">Regular Student</option>
                    <option value="New">New Student</option>
                    <option value="All">All Students</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="One-Time">One-Time (Admission/Card)</option>
                    <option value="Per Term">Per Term (Exam/Activity)</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Applicable Class
                  </label>
                  <select
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="All Classes">All Classes</option>
                    {Array.from(new Set(classes.map((c) => c.name))).map((cName) => (
                      <option key={cName} value={cName}>
                        {cName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Applicable Section
                  </label>
                  <select
                    value={targetSection}
                    onChange={(e) => setTargetSection(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="All">All Sections</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rule-active-checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded-xs text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="rule-active-checkbox" className="font-semibold text-slate-700 dark:text-slate-300">
                  Active (Include in next bulk generation)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-amber-400 font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  {editingItem ? 'Save Changes' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
