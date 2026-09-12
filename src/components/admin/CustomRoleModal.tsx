import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { RoleDefinition, RolePermissions } from '../../types/erp';
import { erpModulesList } from '../../data/rbacData';
import { Shield, Sparkles, Check } from 'lucide-react';

interface CustomRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (roleData: Omit<RoleDefinition, 'id' | 'isSystem'>) => void;
  existingRoles: RoleDefinition[];
}

export const CustomRoleModal: React.FC<CustomRoleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingRoles,
}) => {
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('indigo');
  const [templateRole, setTemplateRole] = useState('Teacher');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;

    // Clone permissions from selected template role
    const matchedTemplate = existingRoles.find((r) => r.name === templateRole);
    const initialPerms = matchedTemplate
      ? JSON.parse(JSON.stringify(matchedTemplate.permissions))
      : erpModulesList.reduce((acc, mod) => {
          acc[mod.id] = { view: true, create: false, edit: false, delete: false, export: false, approve: false };
          return acc;
        }, {} as Record<string, RolePermissions>);

    onSave({
      name: roleName.trim(),
      description: description.trim() || `Custom institutional role for ${roleName.trim()}`,
      color,
      permissions: initialPerms,
    });

    setRoleName('');
    setDescription('');
    onClose();
  };

  const roleColors = [
    { label: 'Indigo', value: 'indigo', bg: 'bg-indigo-500' },
    { label: 'Blue', value: 'blue', bg: 'bg-blue-500' },
    { label: 'Purple', value: 'purple', bg: 'bg-purple-500' },
    { label: 'Emerald', value: 'emerald', bg: 'bg-emerald-500' },
    { label: 'Amber', value: 'amber', bg: 'bg-amber-500' },
    { label: 'Rose', value: 'rose', bg: 'bg-rose-500' },
    { label: 'Cyan', value: 'cyan', bg: 'bg-cyan-500' },
    { label: 'Teal', value: 'teal', bg: 'bg-teal-500' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Custom Institutional Role"
      subtitle="Define a specialized persona with inherited permissions and access policies"
      maxWidth="lg"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="custom-role-form"
            className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Shield className="w-4 h-4" />
            <span>Create Role</span>
          </button>
        </div>
      }
    >
      <form id="custom-role-form" onSubmit={handleCreate} className="space-y-4 text-xs sm:text-sm">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Role Title *
          </label>
          <input
            type="text"
            required
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="e.g. Exam Coordinator / Admissions Officer"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Role Responsibility Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Oversees student admissions, documentation checks, and entrance exams..."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Base Permission Template (Inheritance)
          </label>
          <select
            value={templateRole}
            onChange={(e) => setTemplateRole(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          >
            {existingRoles.map((r) => (
              <option key={r.id} value={r.name}>
                Clone from {r.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 mt-1">
            The new role will inherit all module permissions from this template as a starting point.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            Badge Accent Color
          </label>
          <div className="flex items-center gap-3">
            {roleColors.map((rc) => (
              <button
                key={rc.value}
                type="button"
                onClick={() => setColor(rc.value)}
                className={`w-7 h-7 rounded-full ${rc.bg} flex items-center justify-center transition-transform cursor-pointer ${
                  color === rc.value ? 'ring-3 ring-indigo-500/50 scale-110' : 'opacity-70 hover:opacity-100'
                }`}
                title={rc.label}
              >
                {color === rc.value && <Check className="w-4 h-4 text-white" />}
              </button>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};
