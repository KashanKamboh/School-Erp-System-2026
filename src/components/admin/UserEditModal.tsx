import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { User, UserRole, RoleDefinition } from '../../types/erp';
import { erpModulesList } from '../../data/rbacData';
import {
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Building2,
  Lock,
  CheckCircle2,
  SlidersHorizontal,
  Upload,
  Trash2,
} from 'lucide-react';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Partial<User>) => void;
  userToEdit: User | null;
  roleDefinitions: RoleDefinition[];
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  userToEdit,
  roleDefinitions,
}) => {
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    phone: '',
    role: 'Teacher',
    department: 'Academics',
    status: 'Active',
    twoFactorEnabled: false,
    avatar: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'permissions'>('profile');
  const [customOverrides, setCustomOverrides] = useState<Record<string, any>>({});

  useEffect(() => {
    if (isOpen) {
      if (userToEdit) {
        setFormData({
          name: userToEdit.name,
          email: userToEdit.email,
          phone: userToEdit.phone || '',
          role: userToEdit.role,
          department: userToEdit.department || 'Academics',
          status: userToEdit.status,
          twoFactorEnabled: userToEdit.twoFactorEnabled ?? false,
          avatar: userToEdit.avatar || '',
        });
        setCustomOverrides(userToEdit.customModulePermissions || {});
      } else {
        setFormData({
          name: '',
          email: '',
          phone: '',
          role: 'Teacher',
          department: 'Academics',
          status: 'Active',
          twoFactorEnabled: false,
          avatar: '',
        });
        setCustomOverrides({});
      }
      setActiveTab('profile');
    }
  }, [isOpen, userToEdit]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData((prev) => ({ ...prev, avatar: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.email?.trim()) return;

    onSave({
      ...formData,
      name: formData.name.trim(),
      email: formData.email.trim(),
      customModulePermissions: Object.keys(customOverrides).length > 0 ? customOverrides : undefined,
    });
  };

  const handleToggleCustomPerm = (moduleId: string, permKey: string) => {
    setCustomOverrides((prev) => {
      const currentMod = prev[moduleId] || {
        view: false,
        create: false,
        edit: false,
        delete: false,
        export: false,
        print: false,
        approve: false,
      };
      return {
        ...prev,
        [moduleId]: {
          ...currentMod,
          [permKey]: !currentMod[permKey],
        },
      };
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={userToEdit ? 'Edit User Credentials & Access' : 'Provision New System User'}
      subtitle="Configure identity, institutional role, 2FA status, and permission overrides"
      maxWidth="2xl"
      footer={
        <div className="flex justify-between items-center w-full">
          <div className="text-xs text-slate-400">
            {activeTab === 'permissions' ? 'Custom user-level overrides apply on top of base role.' : ''}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="user-edit-form"
              className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
            >
              {userToEdit ? 'Save Changes' : 'Create Account'}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Sub-tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-2 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'profile'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Profile & Account</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('permissions')}
            className={`pb-2 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'permissions'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Custom Permissions Override</span>
          </button>
        </div>

        <form id="user-edit-form" onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Profile Picture Upload */}
              <div className="sm:col-span-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-600 shrink-0">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 space-y-1 text-center sm:text-left">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Profile Picture</p>
                  <p className="text-[11px] text-slate-400">Select an image file from your device (JPG, PNG)</p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{formData.avatar ? 'Change Picture' : 'Upload Picture'}</span>
                    </button>
                    {formData.avatar && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, avatar: '' }))}
                        className="px-3 py-1.5 border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dr. Arthur Pendelton"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Official Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="principal@greenwood.edu"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 019-2831"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Department / Wing
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Senior Faculty / Finance"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned ERP Role *
                </label>
                <div className="relative">
                  <Shield className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={formData.role || 'Teacher'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    {roleDefinitions.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name} {r.isSystem ? '(System)' : '(Custom)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Account Status
                </label>
                <select
                  value={formData.status || 'Active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="Active">Active (Unlocked)</option>
                  <option value="Inactive">Inactive (Disabled)</option>
                  <option value="Suspended">Suspended (Security Lock)</option>
                </select>
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.twoFactorEnabled ?? false}
                    onChange={(e) => setFormData({ ...formData, twoFactorEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-xs">
                      Enforce Multi-Factor Authentication (2FA)
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Requires TOTP authenticator app or SMS code verification on next sign in
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-3">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-xs text-indigo-800 dark:text-indigo-300">
                Custom overrides set on this screen will supersede the base permissions defined for the <span className="font-bold">{formData.role}</span> role.
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {erpModulesList.map((mod) => {
                  const perms = customOverrides[mod.id] || {
                    view: false,
                    create: false,
                    edit: false,
                    delete: false,
                    export: false,
                    approve: false,
                  };
                  return (
                    <div
                      key={mod.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <p className="font-bold text-xs text-slate-900 dark:text-white">{mod.name}</p>
                        <p className="text-[11px] text-slate-400">{mod.category}</p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(['view', 'create', 'edit', 'delete', 'export', 'approve'] as const).map((action) => {
                          const isActive = perms[action];
                          return (
                            <button
                              key={action}
                              type="button"
                              onClick={() => handleToggleCustomPerm(mod.id, action)}
                              className={`px-2 py-1 text-[11px] font-semibold rounded-md border transition-colors cursor-pointer capitalize ${
                                isActive
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                              }`}
                            >
                              {action}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </form>
      </div>
    </Modal>
  );
};
