import React, { useState, useEffect, useRef } from 'react';
import { useERPData } from '../../context/ERPDataContext';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../common/PageHeader';
import { Badge } from '../common/Badge';
import { Tabs } from '../common/Tabs';
import { erpModulesList } from '../../data/rbacData';
import { api } from '../../services/apiClient';
import {
  Settings,
  Building,
  ShieldCheck,
  Bell,
  Save,
  GraduationCap,
  Mail,
  CheckCircle2,
  Lock,
  Upload,
  Trash2,
  School,
  Image as ImageIcon,
  AlertTriangle,
  RotateCcw,
  Loader2,
  DownloadCloud,
  RefreshCw,
  Sparkles,
  WifiOff,
  PackageCheck,
} from 'lucide-react';
import {
  checkForSoftwareUpdates,
  downloadSoftwareUpdate,
  installSoftwareUpdate,
  getSoftwareUpdateStatus,
  onSoftwareUpdateStatusChange,
  isElectronApp,
} from '../../services/electronBridge';
import { UpdateStatusInfo } from '../../types/electron';

export const SettingsView: React.FC = () => {
  const { showToast, schoolSettings, updateSchoolSettings } = useERPData();
  const { roleDefinitions, updateRolePermission, currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'academic' | 'rbac' | 'notifications' | 'maintenance'>('general');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // Factory Reset state
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const isSuperAdmin = currentUser?.role === 'Super Admin';
  const isDesktop = isElectronApp();

  // Auto-Updater State
  const [updateStatus, setUpdateStatus] = useState<UpdateStatusInfo>({
    status: 'idle',
    currentVersion: '1.0.0',
  });
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  useEffect(() => {
    getSoftwareUpdateStatus().then((status) => {
      if (status) setUpdateStatus(status);
    });

    const cleanup = onSoftwareUpdateStatusChange((status) => {
      setUpdateStatus(status);
      if (status.status !== 'checking') {
        setIsCheckingUpdate(false);
      }
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  const handleManualCheckUpdates = async () => {
    setIsCheckingUpdate(true);
    try {
      const res = await checkForSoftwareUpdates();
      if (!res.success) {
        showToast('Update Check', res.error || 'Offline: System operating locally without updates.', 'info');
      } else if (res.status === 'not-available') {
        showToast('Up to Date', `EduPulse ERP v${updateStatus.currentVersion} is running the latest available build.`, 'success');
      }
    } catch (err: any) {
      showToast('Update Notice', 'Local mode active. Could not reach update server.', 'info');
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleTriggerDownload = async () => {
    try {
      const res = await downloadSoftwareUpdate();
      if (!res.success) {
        showToast('Download Error', res.error || 'Failed to download update.', 'error');
      } else {
        showToast('Download Started', 'Downloading application update in background...', 'info');
      }
    } catch (err: any) {
      showToast('Download Error', err.message || 'Failed to download update.', 'error');
    }
  };

  const handleTriggerInstall = async () => {
    showToast('Applying Update', 'Saving database snapshot and restarting application...', 'info');
    setTimeout(() => {
      installSoftwareUpdate();
    }, 800);
  };

  const handleExecuteFactoryReset = async () => {
    if (resetConfirmation !== 'RESET SCHOOL DATA') {
      showToast('Confirmation Error', 'You must type "RESET SCHOOL DATA" exactly to proceed.', 'error');
      return;
    }

    setIsResetting(true);
    try {
      const res = await api.post('/setup/reset', { confirmation: resetConfirmation });
      if (res && res.success) {
        showToast('Factory Reset Complete', 'All school records wiped. Returning to setup wizard...', 'info');
        localStorage.clear();
        sessionStorage.clear();
        setTimeout(() => {
          window.location.href = '/';
        }, 800);
      } else {
        showToast('Reset Failed', res.error || 'Server rejected factory reset request.', 'error');
        setIsResetting(false);
      }
    } catch (err: any) {
      showToast('Reset Error', err.message || 'An error occurred during factory reset.', 'error');
      setIsResetting(false);
    }
  };

  const [generalSettings, setGeneralSettings] = useState({
    schoolName: schoolSettings.schoolName || schoolSettings.name || '',
    affiliationNo: schoolSettings.affiliationNumber || schoolSettings.schoolCode || '',
    principalName: schoolSettings.principalName || '',
    phone: schoolSettings.phone || '',
    email: schoolSettings.email || '',
    address: schoolSettings.address || '',
    city: schoolSettings.city || '',
    country: schoolSettings.country || 'Pakistan',
    website: schoolSettings.website || '',
    currentSession: schoolSettings.currentSession || '',
    currency: 'PKR (Rs.)',
    timezone: 'Asia/Karachi (GMT+5)',
    logoUrl: schoolSettings.logoUrl || '',
    principalSignatureUrl: schoolSettings.principalSignatureUrl || '',
  });

  // Keep form in exact sync with canonical database school settings
  useEffect(() => {
    setGeneralSettings({
      schoolName: schoolSettings.schoolName || schoolSettings.name || '',
      affiliationNo: schoolSettings.affiliationNumber || schoolSettings.schoolCode || '',
      principalName: schoolSettings.principalName || '',
      phone: schoolSettings.phone || '',
      email: schoolSettings.email || '',
      address: schoolSettings.address || '',
      city: schoolSettings.city || '',
      country: schoolSettings.country || 'Pakistan',
      website: schoolSettings.website || '',
      currentSession: schoolSettings.currentSession || '',
      currency: 'PKR (Rs.)',
      timezone: 'Asia/Karachi (GMT+5)',
      logoUrl: schoolSettings.logoUrl || '',
      principalSignatureUrl: schoolSettings.principalSignatureUrl || '',
    });
  }, [schoolSettings]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('File Too Large', 'Please upload a school logo smaller than 2MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setGeneralSettings((prev) => ({ ...prev, logoUrl: base64 }));
        showToast('Logo Selected', 'School logo preview updated. Click "Save Profile" to apply.', 'info');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setGeneralSettings((prev) => ({ ...prev, logoUrl: '' }));
    if (logoInputRef.current) logoInputRef.current.value = '';
    showToast('Logo Cleared', 'School logo removed. Save profile to confirm.', 'info');
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('File Too Large', 'Please upload a signature image smaller than 2MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setGeneralSettings((prev) => ({ ...prev, principalSignatureUrl: base64 }));
        showToast('Signature Uploaded', 'Principal signature preview updated. Click "Save Profile" to apply.', 'info');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSignature = () => {
    setGeneralSettings((prev) => ({ ...prev, principalSignatureUrl: '' }));
    if (signatureInputRef.current) signatureInputRef.current.value = '';
    showToast('Signature Removed', 'Principal signature cleared. Save profile to confirm.', 'info');
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSchoolSettings({
      schoolName: generalSettings.schoolName.trim(),
      name: generalSettings.schoolName.trim(),
      affiliationNumber: generalSettings.affiliationNo.trim(),
      schoolCode: generalSettings.affiliationNo.trim(),
      principalName: generalSettings.principalName.trim(),
      phone: generalSettings.phone.trim(),
      email: generalSettings.email.trim(),
      address: generalSettings.address.trim(),
      city: generalSettings.city.trim(),
      country: generalSettings.country.trim(),
      website: generalSettings.website.trim(),
      currentSession: generalSettings.currentSession.trim(),
      currency: 'PKR',
      currencySymbol: 'Rs.',
      logoUrl: generalSettings.logoUrl,
      principalSignatureUrl: generalSettings.principalSignatureUrl,
    });
    showToast('Settings Saved', 'Institutional profile and Principal signature updated successfully.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Administration & Settings"
        subtitle="Configure institutional profile, academic terms, grading systems, and role permissions"
        badge={<Badge variant="primary">v2.4.0 Production</Badge>}
      />

      <Tabs
        tabs={[
          { id: 'general', label: 'School Profile & Contact', icon: Building },
          { id: 'academic', label: 'Academic Terms & Grading', icon: GraduationCap },
          { id: 'rbac', label: 'Role-Based Access (RBAC)', icon: ShieldCheck },
          { id: 'notifications', label: 'Email & SMS Gateways', icon: Bell },
          ...(isSuperAdmin
            ? [{ id: 'maintenance', label: 'Factory Reset & Data', icon: AlertTriangle }]
            : []),
        ]}
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as any)}
      />

      {/* General Settings */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveGeneral} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Institutional Identification
              </h3>
              <p className="text-xs text-slate-400">School header details and emblem used across transcripts and ID cards</p>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile</span>
            </button>
          </div>

          {/* School Logo Section */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="relative shrink-0">
                {generalSettings.logoUrl ? (
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-md bg-white flex items-center justify-center p-1">
                    <img
                      src={generalSettings.logoUrl}
                      alt="School Logo Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border-2 border-dashed border-indigo-300 dark:border-indigo-700 flex flex-col items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <School className="w-8 h-8" />
                    <span className="text-[10px] font-bold mt-1 uppercase">No Logo</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Official School Logo / Emblem
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Upload the official school monogram or emblem (PNG, JPG, SVG up to 2MB). This logo will automatically appear on <strong>Student & Faculty ID Cards</strong>, <strong>Official Result / Report Cards</strong>, <strong>Fee Invoices</strong>, and the <strong>Application Sidebar</strong>.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <input
                    type="file"
                    ref={logoInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{generalSettings.logoUrl ? 'Change School Logo' : 'Upload School Logo'}</span>
                  </button>

                  {generalSettings.logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-3.5 py-2 border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove Logo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Principal Signature Section */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="relative shrink-0">
                {generalSettings.principalSignatureUrl ? (
                  <div className="w-32 h-16 rounded-xl overflow-hidden border-2 border-indigo-500 shadow-md bg-white flex items-center justify-center p-1.5">
                    <img
                      src={generalSettings.principalSignatureUrl}
                      alt="Principal Signature Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-16 rounded-xl bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-500">
                    <span className="font-serif italic font-bold text-sm text-slate-700 dark:text-slate-300">
                      {generalSettings.principalName || 'Principal'}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Text Signature</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Official Principal Signature / Stamp Image
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Upload an image of the Principal&apos;s official signature (PNG with transparent background or JPG). This signature will automatically be printed on <strong>Student Progress Result Cards</strong>, <strong>Character & Academic Certificates</strong>, and <strong>ID Badges</strong>.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <input
                    type="file"
                    ref={signatureInputRef}
                    onChange={handleSignatureUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => signatureInputRef.current?.click()}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{generalSettings.principalSignatureUrl ? 'Change Signature' : 'Upload Signature Image'}</span>
                  </button>

                  {generalSettings.principalSignatureUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveSignature}
                      className="px-3.5 py-2 border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove Signature</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Official School Name
              </label>
              <input
                type="text"
                value={generalSettings.schoolName}
                onChange={(e) => setGeneralSettings({ ...generalSettings, schoolName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Affiliation Code / Registration ID
              </label>
              <input
                type="text"
                value={generalSettings.affiliationNo}
                onChange={(e) => setGeneralSettings({ ...generalSettings, affiliationNo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Principal / Headmaster Name
              </label>
              <input
                type="text"
                value={generalSettings.principalName}
                onChange={(e) => setGeneralSettings({ ...generalSettings, principalName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Primary Contact Telephone
              </label>
              <input
                type="text"
                value={generalSettings.phone}
                onChange={(e) => setGeneralSettings({ ...generalSettings, phone: e.target.value })}
                placeholder="e.g., +92 300 1234567"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Official School Email
              </label>
              <input
                type="email"
                value={generalSettings.email}
                onChange={(e) => setGeneralSettings({ ...generalSettings, email: e.target.value })}
                placeholder="e.g., info@school.edu.pk"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                City
              </label>
              <input
                type="text"
                value={generalSettings.city}
                onChange={(e) => setGeneralSettings({ ...generalSettings, city: e.target.value })}
                placeholder="e.g., Islamabad, Lahore, Karachi"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Country
              </label>
              <input
                type="text"
                value={generalSettings.country}
                onChange={(e) => setGeneralSettings({ ...generalSettings, country: e.target.value })}
                placeholder="e.g., Pakistan"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                School Website URL
              </label>
              <input
                type="text"
                value={generalSettings.website}
                onChange={(e) => setGeneralSettings({ ...generalSettings, website: e.target.value })}
                placeholder="e.g., https://school.edu.pk"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Current Academic Session
              </label>
              <input
                type="text"
                value={generalSettings.currentSession}
                onChange={(e) => setGeneralSettings({ ...generalSettings, currentSession: e.target.value })}
                placeholder="e.g., 2025-2026"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Campus Physical Address
              </label>
              <input
                type="text"
                value={generalSettings.address}
                onChange={(e) => setGeneralSettings({ ...generalSettings, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </form>
      )}

      {/* RBAC Matrix */}
      {activeTab === 'rbac' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Role-Based Access Control (RBAC) Matrix
              </h3>
              <p className="text-xs text-slate-400">Manage institutional read/write permissions across key ERP modules</p>
            </div>
            <Badge variant="success">Enforced</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">ERP Role</th>
                  <th className="px-4 py-3 text-center">Students</th>
                  <th className="px-4 py-3 text-center">Faculty</th>
                  <th className="px-4 py-3 text-center">Finance & Fees</th>
                  <th className="px-4 py-3 text-center">Exams & Marks</th>
                  <th className="px-4 py-3 text-center">Payroll</th>
                  <th className="px-4 py-3 text-center">Transport</th>
                  <th className="px-4 py-3 text-center">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {roleDefinitions.map((role) => (
                  <tr key={role.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{role.name}</span>
                      {!role.isSystem && (
                        <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-normal">
                          Custom
                        </span>
                      )}
                    </td>
                    {[
                      { id: 'students', label: 'Students' },
                      { id: 'teachers', label: 'Faculty' },
                      { id: 'fees', label: 'Finance & Fees' },
                      { id: 'exams', label: 'Exams & Marks' },
                      { id: 'payroll', label: 'Payroll' },
                      { id: 'transport', label: 'Transport' },
                      { id: 'users', label: 'Settings' },
                    ].map((mod) => {
                      const isAllowed = role.permissions[mod.id]?.view ?? false;
                      return (
                        <td key={mod.id} className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isAllowed}
                            onChange={(e) => {
                              updateRolePermission(role.id, mod.id, 'view', e.target.checked);
                              showToast('Permission Updated', `Updated ${mod.label} access for ${role.name}.`, 'info');
                            }}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Academic Terms */}
      {activeTab === 'academic' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Grading Scale & GPA Thresholds
          </h3>
          <p className="text-xs text-slate-400">Letter grade mapping to 4.0 GPA scale</p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="font-bold text-base text-emerald-600">A+ (4.0)</p>
              <p className="text-slate-400 mt-1">90% - 100%</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="font-bold text-base text-blue-600">A (3.7)</p>
              <p className="text-slate-400 mt-1">80% - 89%</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="font-bold text-base text-sky-600">B (3.0)</p>
              <p className="text-slate-400 mt-1">70% - 79%</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="font-bold text-base text-amber-600">C (2.0)</p>
              <p className="text-slate-400 mt-1">60% - 69%</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="font-bold text-base text-rose-600">D / F (0.0)</p>
              <p className="text-slate-400 mt-1">&lt; 50% Fail</p>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {activeTab === 'notifications' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            SMS & Email Broadcast Gateway
          </h3>
          <p className="text-xs text-slate-400">Configure automated parent alerts for absence, fee dues, and grades</p>

          <div className="space-y-3 pt-2 text-xs sm:text-sm">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Daily Unexcused Absence SMS Alert</p>
                <p className="text-xs text-slate-400">Sends instant SMS to parent phone at 09:30 AM if student is marked Absent</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-blue-600" />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Fee Due Date Email Reminders</p>
                <p className="text-xs text-slate-400">Sends invoice notice 5 days before payment deadline</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-blue-600" />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Exam Report Card Published Notification</p>
                <p className="text-xs text-slate-400">Dispatches parent portal link when grades are signed off</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-blue-600" />
            </div>
          </div>
        </div>
      )}
      {/* Maintenance & Factory Reset (Super Admin Only) */}
      {activeTab === 'maintenance' && isSuperAdmin && (
        <div className="space-y-6">
          {/* Software Updates & Versioning Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Software Version & Auto-Updates</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automatic releases provided via GitHub. All school databases and user records remain completely local and untouched during updates.
                </p>
              </div>

              {isDesktop && (
                <button
                  type="button"
                  onClick={handleManualCheckUpdates}
                  disabled={isCheckingUpdate || updateStatus.status === 'downloading'}
                  className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer border border-indigo-200/80 dark:border-indigo-800/60 shrink-0 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                  <span>{isCheckingUpdate ? 'Checking GitHub...' : 'Check for Updates'}</span>
                </button>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Installed Version: </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white px-2 py-0.5 bg-slate-200/70 dark:bg-slate-700 rounded-md">
                    v{updateStatus.currentVersion || '1.0.0'}
                  </span>
                </div>

                <div>
                  {updateStatus.status === 'available' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 font-bold text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>New Release v{updateStatus.version} Available</span>
                    </span>
                  )}

                  {updateStatus.status === 'downloading' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-bold text-[11px]">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                      <span>Downloading Update ({updateStatus.progress?.percent || 0}%)</span>
                    </span>
                  )}

                  {updateStatus.status === 'downloaded' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-bold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Update Ready to Install</span>
                    </span>
                  )}

                  {(updateStatus.status === 'idle' || updateStatus.status === 'not-available') && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-medium text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Application is up to date</span>
                    </span>
                  )}

                  {updateStatus.status === 'error' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-300 font-medium text-[11px]">
                      <WifiOff className="w-3.5 h-3.5 text-slate-500" />
                      <span>Offline Mode: Operating normally</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Download Progress Bar */}
              {updateStatus.status === 'downloading' && (
                <div className="space-y-1.5 pt-1">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${updateStatus.progress?.percent || 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Downloading setup packages from GitHub...</span>
                    <span>{updateStatus.progress?.percent || 0}%</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {updateStatus.status === 'available' && (
                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleTriggerDownload}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm"
                  >
                    <DownloadCloud className="w-4 h-4" />
                    <span>Download Update (v{updateStatus.version})</span>
                  </button>
                </div>
              )}

              {updateStatus.status === 'downloaded' && (
                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleTriggerInstall}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm shadow-emerald-600/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Restart & Update Now</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <School className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>System & Database Status</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-slate-400 font-medium">Institution Status</p>
                <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-1">Configured & Active</p>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-slate-400 font-medium">Database Persistence</p>
                <p className="font-bold text-sm text-blue-600 dark:text-blue-400 mt-1">SQLite 3 WAL Engine</p>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-slate-400 font-medium">Demo Data State</p>
                <p className="font-bold text-sm text-indigo-600 dark:text-indigo-400 mt-1">Zero Demo Records</p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl p-6 border border-rose-200 dark:border-rose-900/60 shadow-sm space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-rose-950 dark:text-rose-200">
                  Institutional Factory Reset & Data Purge
                </h3>
                <p className="text-xs text-rose-700 dark:text-rose-400/90 mt-1 leading-relaxed">
                  Executing a factory reset will permanently erase all student rosters, staff accounts, fee vouchers,
                  examination results, and attendance records. The application will immediately return to the first-run
                  <strong> "Set Up Your School" </strong> onboarding wizard. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-rose-200/80 dark:border-rose-900/60 space-y-3">
              <label className="block text-xs font-semibold text-rose-900 dark:text-rose-300">
                To confirm this destructive action, type <code className="bg-rose-100 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 px-1.5 py-0.5 rounded font-mono font-bold">RESET SCHOOL DATA</code> below:
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={resetConfirmation}
                  onChange={(e) => setResetConfirmation(e.target.value)}
                  placeholder="RESET SCHOOL DATA"
                  className="flex-1 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 focus:border-rose-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white font-mono placeholder-slate-400 outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleExecuteFactoryReset}
                  disabled={resetConfirmation !== 'RESET SCHOOL DATA' || isResetting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-rose-600/20 shrink-0"
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Wiping System...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>Execute Factory Reset</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
