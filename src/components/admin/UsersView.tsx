import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useERPData } from '../../context/ERPDataContext';
import { PageHeader } from '../common/PageHeader';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { UserEditModal } from './UserEditModal';
import { CustomRoleModal } from './CustomRoleModal';
import { PasswordResetModal } from './PasswordResetModal';
import { RoleComparisonModal } from './RoleComparisonModal';
import { RejectUserModal } from './RejectUserModal';
import { erpModulesList } from '../../data/rbacData';
import {
  Shield,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Sliders,
  Sparkles,
  ArrowRightLeft,
  Smartphone,
  Download,
  MoreVertical,
  Edit2,
  Trash2,
  RotateCcw,
  Check,
  X,
  FileSpreadsheet,
  Layers,
  Save,
  Globe,
  Clock,
  Fingerprint,
  Activity,
  ChevronDown,
  Building2,
  Info,
  LayoutGrid,
  List,
  AlertTriangle,
  XCircle,
  CheckCircle,
  FileText,
  UserX,
  Send,
  UserCheck2,
} from 'lucide-react';
import { User, UserRole, RoleDefinition, SecurityPolicy, RolePermissions } from '../../types/erp';

export const UsersView: React.FC = () => {
  const {
    currentUser,
    hasModulePermission,
    users,
    roleDefinitions,
    securityPolicy,
    switchRole,
    impersonateUser,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    resetUserPassword,
    updateRolePermission,
    addCustomRole,
    deleteCustomRole,
    updateSecurityPolicy,
    approveUser,
    rejectUser,
  } = useAuth();

  const { showToast, addAuditLog } = useERPData();

  const canCreateUser = hasModulePermission('users', 'create');
  const canEditUser = hasModulePermission('users', 'edit');
  const canDeleteUser = hasModulePermission('users', 'delete');
  const canExportUsers = hasModulePermission('users', 'export');
  const canApproveUsers = hasModulePermission('users', 'approve');
  const canManageRBAC = hasModulePermission('settings', 'edit') || currentUser.role === 'Super Admin' || currentUser.role === 'School Admin';
  const canManageSecurity = hasModulePermission('settings', 'edit') || currentUser.role === 'Super Admin';

  // Active Main Tab
  const [activeMainTab, setActiveMainTab] = useState<'users' | 'pending' | 'rbac' | 'security'>('users');

  // Search & Filter state for Users tab
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // RBAC Tab State
  const [selectedRoleName, setSelectedRoleName] = useState<string>('Super Admin');
  const [moduleCategoryFilter, setModuleCategoryFilter] = useState<string>('All');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const [isCustomRoleModalOpen, setIsCustomRoleModalOpen] = useState(false);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [tempPassword, setTempPassword] = useState('');

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Reject Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [userToReject, setUserToReject] = useState<User | null>(null);

  // Security Policy Local Form State
  const [localPolicy, setLocalPolicy] = useState<SecurityPolicy>(securityPolicy);

  // Pending Registrations
  const pendingUsers = useMemo(() => {
    return users.filter((u) => u.status === 'Pending');
  }, [users]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === 'All' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'All' || u.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Selected Role Definition
  const currentRoleDef = useMemo(() => {
    return (
      roleDefinitions.find((r) => r.name.toLowerCase() === selectedRoleName.toLowerCase()) ||
      roleDefinitions[0]
    );
  }, [roleDefinitions, selectedRoleName]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === 'Active').length;
    const pending = users.filter((u) => u.status === 'Pending').length;
    const rejected = users.filter((u) => u.status === 'Rejected').length;
    const twoFaCount = users.filter((u) => u.twoFactorEnabled).length;
    const adminCount = users.filter((u) =>
      ['Super Admin', 'School Admin', 'Principal'].includes(u.role)
    ).length;
    const twoFaPercent = total > 0 ? Math.round((twoFaCount / total) * 100) : 0;
    return { total, active, pending, rejected, twoFaCount, twoFaPercent, adminCount };
  }, [users]);

  // Actions Handlers
  const handleOpenAddUser = () => {
    setUserToEdit(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEditUser = (user: User) => {
    setUserToEdit(user);
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async (userData: Partial<User>) => {
    if (userToEdit) {
      await updateUser(userToEdit.id, userData);
      addAuditLog(
        'UPDATE',
        'Users',
        `Updated credentials and permissions for user ${userData.name || userToEdit.name}`,
        'Success'
      );
      showToast('User Updated', `Account credentials for ${userData.name || userToEdit.name} updated.`, 'success');
    } else {
      const created = await addUser({
        name: userData.name || 'New Staff',
        email: userData.email || 'user@greenwood.edu',
        role: userData.role || 'Teacher',
        phone: userData.phone,
        department: userData.department || 'Academics',
        status: userData.status || 'Active',
        twoFactorEnabled: userData.twoFactorEnabled ?? false,
        avatar: userData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        permissions: userData.permissions,
        customModulePermissions: userData.customModulePermissions,
      });
      addAuditLog(
        'CREATE',
        'Users',
        `Provisioned new user ${created.name} (${created.role})`,
        'Success'
      );
      showToast('User Provisioned', `New user account ${created.name} created successfully.`, 'success');
    }
    setIsEditModalOpen(false);
  };

  // Direct Approval Handler
  const handleApproveUser = async (user: User) => {
    const res = await approveUser(user.id);
    if (res.success) {
      addAuditLog(
        'UPDATE',
        'Users',
        `Approved and activated registration request for ${user.name} (${user.email}) as ${user.role}`,
        'Success'
      );
      showToast('Registration Approved', `${user.name} is now ACTIVE and can log in to the ERP.`, 'success');
    } else {
      showToast('Approval Failed', res.error || 'Could not approve user.', 'error');
    }
  };

  // Direct Reject Modal Opener
  const handleOpenRejectModal = (user: User) => {
    setUserToReject(user);
    setIsRejectModalOpen(true);
  };

  // Confirm Rejection Handler
  const handleConfirmReject = async (reason: string) => {
    if (!userToReject) return;
    const res = await rejectUser(userToReject.id, reason);
    if (res.success) {
      addAuditLog(
        'UPDATE',
        'Users',
        `Rejected registration for ${userToReject.name} (${userToReject.email}). Reason: ${reason}`,
        'Success'
      );
      showToast('Registration Rejected', `Registration for ${userToReject.name} was rejected.`, 'info');
    } else {
      showToast('Rejection Failed', res.error || 'Could not reject user.', 'error');
    }
    setUserToReject(null);
  };

  const handleResetPassword = async (user: User) => {
    const generated = await resetUserPassword(user.id);
    setResetTargetUser(user);
    setTempPassword(generated);
    setIsResetModalOpen(true);
    addAuditLog(
      'UPDATE',
      'Users',
      `Generated temporary security passkey for ${user.email}`,
      'Success'
    );
  };

  const handleToggleStatus = (user: User) => {
    toggleUserStatus(user.id);
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    showToast('Status Updated', `User ${user.name} is now ${newStatus}.`, 'info');
    addAuditLog(
      'UPDATE',
      'Users',
      `Changed account status of ${user.name} to ${newStatus}`,
      'Success'
    );
  };

  const handleDeleteUser = () => {
    if (!userToDelete) return;
    deleteUser(userToDelete.id);
    showToast('User Removed', `Account ${userToDelete.name} was removed from the directory.`, 'info');
    addAuditLog(
      'DELETE',
      'Users',
      `Deleted user account ${userToDelete.name} (${userToDelete.email})`,
      'Success'
    );
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleExportUsers = () => {
    const headers = ['ID', 'Name', 'Email', 'Role', 'Department', 'Status', '2FA Enabled', 'Last Login'];
    const rows = filteredUsers.map((u) => [
      u.id,
      `"${u.name}"`,
      u.email,
      u.role,
      `"${u.department || 'Academics'}"`,
      u.status,
      u.twoFactorEnabled ? 'Yes' : 'No',
      `"${u.lastLogin || 'Never'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `EduPulse_Users_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Directory Exported', 'User directory exported to CSV successfully.', 'info');
  };

  // RBAC Permission Toggle
  const handleToggleRolePermission = (moduleId: string, permKey: keyof RolePermissions) => {
    if (currentRoleDef.isSystem && currentRoleDef.name === 'Super Admin') {
      showToast('System Protected', 'Super Admin root permissions cannot be altered.', 'warning');
      return;
    }

    const currentVal =
      currentRoleDef.permissions[moduleId]?.[permKey] ?? false;

    updateRolePermission(currentRoleDef.id, moduleId, permKey, !currentVal);
    addAuditLog(
      'UPDATE',
      'RBAC',
      `Modified ${permKey.toUpperCase()} permission on ${moduleId} for role ${currentRoleDef.name}`,
      'Success'
    );
  };

  const handleToggleAllPermissionsForModule = (moduleId: string, enableAll: boolean) => {
    if (currentRoleDef.isSystem && currentRoleDef.name === 'Super Admin') return;

    (['view', 'create', 'edit', 'delete', 'export', 'approve'] as (keyof RolePermissions)[]).forEach(
      (perm) => {
        updateRolePermission(currentRoleDef.id, moduleId, perm, enableAll);
      }
    );
    showToast('Module Updated', `${enableAll ? 'Granted all' : 'Revoked all'} permissions for ${moduleId}.`, 'info');
  };

  const handleGrantAllForRole = (grantAll: boolean) => {
    if (currentRoleDef.isSystem && currentRoleDef.name === 'Super Admin') return;

    erpModulesList.forEach((mod) => {
      (['view', 'create', 'edit', 'delete', 'export', 'approve'] as (keyof RolePermissions)[]).forEach((perm) => {
        updateRolePermission(currentRoleDef.id, mod.id, perm, grantAll);
      });
    });
    showToast('Permissions Updated', `${grantAll ? 'Granted all' : 'Cleared all'} permissions for ${currentRoleDef.name}.`, 'info');
  };

  const handleSaveSecurityPolicy = (e: React.FormEvent) => {
    e.preventDefault();
    updateSecurityPolicy(localPolicy);
    addAuditLog(
      'UPDATE',
      'Settings',
      'Updated institutional security and authentication policies',
      'Success'
    );
    showToast('Security Policy Enforced', 'Authentication, 2FA, and password rules updated.', 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Access Control (RBAC)"
        subtitle="Manage institutional personas, credential authentication, self-registration requests, and security policies"
        actions={
          (canExportUsers || canCreateUser) ? (
            <div className="flex items-center gap-2">
              {canExportUsers && (
                <button
                  onClick={handleExportUsers}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
              )}
              {canCreateUser && (
                <button
                  onClick={handleOpenAddUser}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add New User</span>
                </button>
              )}
            </div>
          ) : undefined
        }
      />

      {/* Top Security & RBAC Status Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Accounts</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white">{stats.total}</span>
              <span className="text-xs text-emerald-600 font-semibold">{stats.active} Active</span>
            </div>
          </div>
        </div>

        {/* Pending Registration Counter Card */}
        {canApproveUsers ? (
          <button
            onClick={() => setActiveMainTab('pending')}
            className="text-left bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-2xs flex items-center gap-3.5 hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer group"
          >
            <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                Pending Approvals
                {stats.pending > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-bold text-slate-900 dark:text-white">{stats.pending}</span>
                <span className="text-xs text-amber-600 font-semibold">Requires Action</span>
              </div>
            </div>
          </button>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-2xs flex items-center gap-3.5">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Approvals</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-bold text-slate-900 dark:text-white">{stats.pending}</span>
                <span className="text-xs text-amber-600 font-semibold">In Queue</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">2FA Compliance</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white">{stats.twoFaPercent}%</span>
              <span className="text-xs text-slate-500">{stats.twoFaCount} users</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/60 rounded-xl text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Defined Roles</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white">{roleDefinitions.length}</span>
              <span className="text-xs text-indigo-600 font-semibold">
                {roleDefinitions.filter((r) => !r.isSystem).length} Custom
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveMainTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeMainTab === 'users'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>User Directory ({users.length})</span>
        </button>

        {canApproveUsers && (
          <button
            onClick={() => setActiveMainTab('pending')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeMainTab === 'pending'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Pending Registrations</span>
            {stats.pending > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-extrabold">
                {stats.pending}
              </span>
            )}
          </button>
        )}

        {canManageRBAC && (
          <button
            onClick={() => setActiveMainTab('rbac')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeMainTab === 'rbac'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>RBAC Matrix & Permissions</span>
          </button>
        )}

        {canManageSecurity && (
          <button
            onClick={() => setActiveMainTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeMainTab === 'security'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Fingerprint className="w-4 h-4" />
            <span>Security & Authentication Policies</span>
          </button>
        )}
      </div>

      {/* ======================= TAB: PENDING REGISTRATIONS ======================= */}
      {activeMainTab === 'pending' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Workflow Diagram Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-sm text-slate-900 dark:text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Institutional Approval Gate
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Super Admin Self-Registration Authorization Workflow
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Public self-registered users enter the system with <span className="text-amber-300 font-semibold">Status: PENDING</span>. You must review their credentials and explicitly <span className="text-emerald-400 font-semibold">APPROVE</span> (to activate login) or <span className="text-rose-400 font-semibold">REJECT</span> (to block access).
                </p>
              </div>

              {/* Graphical Workflow Steps */}
              <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl text-[11px] shrink-0 font-medium space-y-1.5">
                <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  Registration Flow
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-200">
                  <span className="bg-blue-900/60 text-blue-300 px-1.5 py-0.5 rounded">1. Signup</span>
                  <span>➔</span>
                  <span className="bg-amber-900/60 text-amber-300 px-1.5 py-0.5 rounded font-bold">2. PENDING</span>
                  <span>➔</span>
                  <span className="bg-purple-900/60 text-purple-300 px-1.5 py-0.5 rounded">3. Super Admin</span>
                  <span>➔</span>
                  <span className="bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded font-bold">4. ACTIVE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Users List */}
          {pendingUsers.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                No Pending Registration Requests
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                All submitted self-registration requests have been processed. New user signups will appear here in real-time awaiting clearance.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Awaiting Super Admin Decision ({pendingUsers.length})</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingUsers.map((u) => (
                  <div
                    key={u.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-amber-200 dark:border-amber-900/60 p-5 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} src={u.avatar} size="md" />
                          <div>
                            <p className="font-bold text-sm text-slate-900 dark:text-white">
                              {u.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {u.email}
                            </p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                          <Clock className="w-3.5 h-3.5" />
                          PENDING
                        </span>
                      </div>

                      {/* Request Details Card */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Requested Role
                            </span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              {u.requestedRole || u.role}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Department / Class
                            </span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {u.department || 'Academics'}
                            </span>
                          </div>
                        </div>

                        {u.registrationReason && (
                          <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Verification / Identification Note:
                            </span>
                            <p className="text-slate-700 dark:text-slate-300 font-medium italic mt-0.5">
                              "{u.registrationReason}"
                            </p>
                          </div>
                        )}

                        {u.submittedAt && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 pt-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Submitted: {u.submittedAt}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => handleApproveUser(u)}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>APPROVE (Activate)</span>
                      </button>

                      <button
                        onClick={() => handleOpenRejectModal(u)}
                        className="flex-1 py-2 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>REJECT</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 1: USERS DIRECTORY ======================= */}
      {activeMainTab === 'users' && (
        <div className="space-y-4">
          {/* Pending Notification Banner inside Users directory */}
          {stats.pending > 0 && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  <strong>Action Required:</strong> You have <strong>{stats.pending}</strong> pending user registration request(s) awaiting approval.
                </span>
              </div>
              <button
                onClick={() => setActiveMainTab('pending')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-2xs flex items-center gap-1"
              >
                <span>Review Requests ({stats.pending})</span>
                <Clock className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Active User Impersonation Notice */}
          <div className="bg-gradient-to-r from-indigo-900/30 via-slate-900 to-slate-900 border border-indigo-500/20 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar name={currentUser.name} src={currentUser.avatar} size="md" />
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{currentUser.name}</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    {currentUser.role}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Currently active authentication session with logged identity
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 border border-slate-700/80 text-emerald-400 rounded-xl text-xs font-semibold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Authenticated Session
              </span>
            </div>
          </div>

          {/* Search, Filters, and View Toggle */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, department, or role..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="text-xs py-2 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
                >
                  <option value="All">All Roles</option>
                  {roleDefinitions.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs py-2 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending Approval</option>
                <option value="Rejected">Rejected</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>

              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 transition-colors cursor-pointer ${
                    viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors cursor-pointer ${
                    viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Grid Cards View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* User List: Table View */}
          {viewMode === 'table' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">User & Department</th>
                      <th className="py-3 px-4">Role & Access</th>
                      <th className="py-3 px-4">2FA Security</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Last Activity</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.name} src={u.avatar} size="sm" />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                {u.name}
                                {u.id === currentUser.id && (
                                  <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded font-bold">
                                    You
                                  </span>
                                )}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                <span>{u.email}</span>
                                {u.department && (
                                  <>
                                    <span>•</span>
                                    <span>{u.department}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-col items-start gap-1">
                            <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                              {u.role}
                            </span>
                            {u.customModulePermissions && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                Has custom overrides
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {u.twoFactorEnabled ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              2FA Enabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                              Not Configured
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {u.status === 'Pending' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60">
                              <Clock className="w-3 h-3" />
                              Pending Approval
                            </span>
                          ) : u.status === 'Rejected' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800/60">
                              <XCircle className="w-3 h-3" />
                              Rejected
                            </span>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className="cursor-pointer"
                              title="Click to toggle status"
                            >
                              {u.status === 'Active' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Active
                                </span>
                              ) : u.status === 'Suspended' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                                  <Lock className="w-3 h-3" />
                                  Suspended
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                                  Inactive
                                </span>
                              )}
                            </button>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs">
                          <div>{u.lastLogin || 'Never'}</div>
                          {u.lastIp && <div className="text-[10px] text-slate-400 font-mono">IP: {u.lastIp}</div>}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Special Quick Actions for Pending Users */}
                            {u.status === 'Pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveUser(u)}
                                  className="px-2 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                  title="Approve and activate user"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleOpenRejectModal(u)}
                                  className="px-2 py-1 text-xs font-bold rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950 dark:text-rose-300 transition-colors cursor-pointer flex items-center gap-1"
                                  title="Reject registration"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}

                            {u.status === 'Active' && (
                              <button
                                onClick={() => {
                                  impersonateUser(u);
                                  showToast('Impersonating User', `Switched active session to ${u.name} (${u.role}).`, 'info');
                                }}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 transition-colors cursor-pointer"
                                title="Assume identity"
                              >
                                Assume
                              </button>
                            )}

                            <button
                              onClick={() => handleResetPassword(u)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                              title="Reset Password"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                              title="Edit User & Permissions"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {u.id !== currentUser.id && (
                              <button
                                onClick={() => {
                                  setUserToDelete(u);
                                  setIsDeleteDialogOpen(true);
                                }}
                                className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* User List: Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} src={u.avatar} size="md" />
                        <div>
                          <p className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                            {u.name}
                            {u.id === currentUser.id && (
                              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded font-bold">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 text-[11px] font-bold rounded-full border ${
                          u.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/60'
                            : u.status === 'Pending'
                            ? 'bg-amber-50 text-amber-600 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800/60'
                            : u.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800/60'
                            : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                        }`}
                      >
                        {u.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Role</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{u.role}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Department</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {u.department || 'Academics'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">2FA Security</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {u.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Last Active</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{u.lastLogin || 'Never'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    {u.status === 'Pending' ? (
                      <div className="flex items-center gap-1.5 w-full">
                        <button
                          onClick={() => handleApproveUser(u)}
                          className="flex-1 py-1.5 px-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleOpenRejectModal(u)}
                          className="flex-1 py-1.5 px-2.5 text-xs font-bold rounded-xl bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 flex items-center justify-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            impersonateUser(u);
                            showToast('Impersonating User', `Switched active session to ${u.name}.`, 'info');
                          }}
                          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                        >
                          Assume Persona
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleResetPassword(u)}
                            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                            title="Reset Passkey"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditUser(u)}
                            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 2: RBAC PERMISSIONS MATRIX ======================= */}
      {activeMainTab === 'rbac' && (
        <div className="space-y-5">
          {/* Header Controls for RBAC */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Granular Permission Matrix & Role Customizer</span>
              </h3>
              <p className="text-xs text-slate-400">
                Configure View, Create, Edit, Delete, Export, and Approval privileges per module
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsComparisonModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Compare Roles</span>
              </button>

              <button
                onClick={() => setIsCustomRoleModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Create Custom Role</span>
              </button>
            </div>
          </div>

          {/* Role Selector Ribbon */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {roleDefinitions.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRoleName(role.name)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  selectedRoleName.toLowerCase() === role.name.toLowerCase()
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-500/40'
                }`}
              >
                <span>{role.name}</span>
                {role.isSystem ? (
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-black/20 text-white font-extrabold">
                    System
                  </span>
                ) : (
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-200 font-extrabold">
                    Custom
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Current Role Details & Mass Actions */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {currentRoleDef.name} Permission Map
                </h4>
                <Badge variant={currentRoleDef.isSystem ? 'primary' : 'warning'}>
                  {currentRoleDef.isSystem ? 'Institutional System Role' : 'User-Defined Custom Role'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{currentRoleDef.description}</p>
            </div>

            {!currentRoleDef.isSystem && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGrantAllForRole(true)}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Grant All
                </button>
                <button
                  onClick={() => handleGrantAllForRole(false)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Clear All
                </button>
                <button
                  onClick={() => {
                    deleteCustomRole(currentRoleDef.id);
                    setSelectedRoleName('Teacher');
                    showToast('Role Deleted', `Custom role ${currentRoleDef.name} was removed.`, 'info');
                  }}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 rounded-lg transition-colors cursor-pointer"
                  title="Delete Custom Role"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Granular Permission Matrix Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Module & Scope</th>
                    <th className="py-3 px-3 text-center">View</th>
                    <th className="py-3 px-3 text-center">Create</th>
                    <th className="py-3 px-3 text-center">Edit</th>
                    <th className="py-3 px-3 text-center">Delete</th>
                    <th className="py-3 px-3 text-center">Export</th>
                    <th className="py-3 px-3 text-center">Approve</th>
                    <th className="py-3 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                  {erpModulesList.map((mod) => {
                    const modPerms = currentRoleDef.permissions[mod.id] || {
                      view: false,
                      create: false,
                      edit: false,
                      delete: false,
                      export: false,
                      approve: false,
                    };

                    const isRootSuperAdmin =
                      currentRoleDef.isSystem && currentRoleDef.name === 'Super Admin';

                    return (
                      <tr key={mod.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {mod.name}
                            </span>
                            <span className="text-[11px] text-slate-400">{mod.description}</span>
                          </div>
                        </td>

                        {(['view', 'create', 'edit', 'delete', 'export', 'approve'] as (keyof RolePermissions)[]).map(
                          (actionKey) => {
                            const isChecked = isRootSuperAdmin ? true : !!modPerms[actionKey];

                            return (
                              <td key={actionKey} className="py-3 px-3 text-center">
                                <button
                                  type="button"
                                  disabled={isRootSuperAdmin}
                                  onClick={() => handleToggleRolePermission(mod.id, actionKey)}
                                  className={`w-6 h-6 rounded-md inline-flex items-center justify-center transition-all cursor-pointer ${
                                    isChecked
                                      ? 'bg-emerald-500 text-white shadow-2xs'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:bg-slate-200'
                                  } ${isRootSuperAdmin ? 'cursor-not-allowed opacity-90' : ''}`}
                                  title={`${actionKey.toUpperCase()} permission for ${mod.name}`}
                                >
                                  {isChecked ? <Check className="w-3.5 h-3.5 stroke-3" /> : <X className="w-3 h-3" />}
                                </button>
                              </td>
                            );
                          }
                        )}

                        <td className="py-3 px-4 text-right">
                          {!isRootSuperAdmin && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleToggleAllPermissionsForModule(mod.id, true)}
                                className="px-2 py-1 text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer"
                              >
                                All
                              </button>
                              <button
                                onClick={() => handleToggleAllPermissionsForModule(mod.id, false)}
                                className="px-2 py-1 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                              >
                                None
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 3: SECURITY & POLICIES ======================= */}
      {activeMainTab === 'security' && (
        <form onSubmit={handleSaveSecurityPolicy} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Fingerprint className="w-5 h-5 text-indigo-600" />
                  <span>Institutional Password & Session Security Configuration</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure authentication policies, timeout guards, 2FA requirements, and brute force defenses
                </p>
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Enforce Policies</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* 2FA Mode */}
              <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Two-Factor Authentication (2FA) Requirement
                </label>
                <select
                  value={localPolicy.twoFactorRequirement}
                  onChange={(e) =>
                    setLocalPolicy({
                      ...localPolicy,
                      twoFactorRequirement: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold"
                >
                  <option value="Optional">Optional (User Selected)</option>
                  <option value="AdminsOnly">Enforced for Admins & Super Admins Only</option>
                  <option value="MandatoryAll">Mandatory for ALL Institutional Users</option>
                </select>
                <p className="text-[11px] text-slate-400">
                  Controls mandatory authenticator app prompt upon credential verification.
                </p>
              </div>

              {/* Session Inactivity Timeout */}
              <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Session Inactivity Auto-Lock (Minutes)
                </label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={localPolicy.sessionTimeoutMinutes}
                  onChange={(e) => setLocalPolicy({ ...localPolicy, sessionTimeoutMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
                <p className="text-[11px] text-slate-400">
                  Automatically terminates or locks screen after period of zero mouse/keyboard input.
                </p>
              </div>

              {/* Min Password Length */}
              <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Minimum Password Length
                </label>
                <input
                  type="number"
                  min={6}
                  max={32}
                  value={localPolicy.minPasswordLength}
                  onChange={(e) => setLocalPolicy({ ...localPolicy, minPasswordLength: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPolicy.requireSpecialChars}
                    onChange={(e) => setLocalPolicy({ ...localPolicy, requireSpecialChars: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                    Require at least one special symbol (!@#$%^&*)
                  </span>
                </label>
              </div>

              {/* Brute Force Lock */}
              <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Max Failed Login Attempts (Brute Force Lock)
                </label>
                <input
                  type="number"
                  min={3}
                  max={10}
                  value={localPolicy.maxFailedLoginAttempts}
                  onChange={(e) => setLocalPolicy({ ...localPolicy, maxFailedLoginAttempts: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
                <p className="text-[11px] text-slate-400">
                  Temporarily suspends user login after specified consecutive failed password attempts.
                </p>
              </div>

              {/* Allowed IP Networks */}
              <div className="space-y-2 sm:col-span-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Campus IP Whitelisting Subnets
                </label>
                <input
                  type="text"
                  value={localPolicy.allowedIpRanges}
                  onChange={(e) => setLocalPolicy({ ...localPolicy, allowedIpRanges: e.target.value })}
                  placeholder="0.0.0.0/0 (Any Secure Network) or 192.168.1.0/24"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-xs"
                />
                <p className="text-[11px] text-slate-400">
                  Restricts Super Admin and Financial module access to verified on-campus LAN subnets.
                </p>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Modals */}
      <UserEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveUser}
        userToEdit={userToEdit}
        roleDefinitions={roleDefinitions}
      />

      <CustomRoleModal
        isOpen={isCustomRoleModalOpen}
        onClose={() => setIsCustomRoleModalOpen(false)}
        onSave={(roleData) => {
          const created = addCustomRole(roleData);
          setSelectedRoleName(created.name);
          showToast('Custom Role Added', `Defined custom role ${created.name}.`, 'success');
        }}
        existingRoles={roleDefinitions}
      />

      <RoleComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        roles={roleDefinitions}
      />

      <PasswordResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        user={resetTargetUser}
        tempPassword={tempPassword}
      />

      <RejectUserModal
        isOpen={isRejectModalOpen}
        user={userToReject}
        onClose={() => {
          setIsRejectModalOpen(false);
          setUserToReject(null);
        }}
        onConfirm={handleConfirmReject}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteUser}
        title="Revoke and Delete User Account"
        message={`Are you sure you want to permanently delete the profile for ${userToDelete?.name} (${userToDelete?.email})? This action will revoke all permissions and invalidate current sessions.`}
        confirmText="Permanently Delete"
        type="danger"
      />
    </div>
  );
};
