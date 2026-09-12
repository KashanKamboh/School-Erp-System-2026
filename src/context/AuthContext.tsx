import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, RolePermissions, RoleDefinition, SecurityPolicy } from '../types/erp';
import { initialUsers } from '../data/mockErpData';
import { initialRoleDefinitions, initialSecurityPolicy } from '../data/rbacData';
import { api, registerAuthErrorHandlers } from '../services/apiClient';

export interface ActiveSessionInfo {
  sessionId: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: number;
  isRevoked: boolean;
}

interface AuthContextType {
  currentUser: User;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  isSetupCompleted: boolean;
  isCheckingSetup: boolean;
  isLocked: boolean;
  isSessionExpired: boolean;
  users: User[];
  activeSessions: ActiveSessionInfo[];
  roleDefinitions: RoleDefinition[];
  securityPolicy: SecurityPolicy;
  checkSetupStatus: () => Promise<boolean>;
  completeSetupSession: (user: User, token: string) => void;
  login: (email: string, pass: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string; status?: string; submittedAt?: string; rejectionReason?: string }>;
  signup: (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    department?: string;
    phone?: string;
    registrationReason?: string;
  }) => Promise<{ success: boolean; message?: string; error?: string; status?: string }>;
  approveUser: (userId: string) => Promise<{ success: boolean; message?: string; error?: string; user?: User }>;
  rejectUser: (userId: string, rejectionReason?: string) => Promise<{ success: boolean; message?: string; error?: string; user?: User }>;
  refreshUsers: () => Promise<void>;
  logout: () => Promise<void>;
  lockScreen: () => void;
  unlockScreen: (pass: string) => boolean;
  switchRole: (role: UserRole | string) => Promise<void>;
  impersonateUser: (user: User) => void;
  addUser: (userData: Omit<User, 'id' | 'createdAt' | 'lastLogin'> & { password?: string }) => Promise<User>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
  resetUserPassword: (userId: string) => Promise<string>;
  updateUserPermissions: (userId: string, permissions: RolePermissions) => void;
  updateRolePermission: (roleId: string, moduleId: string, permKey: keyof RolePermissions, value: boolean) => void;
  addCustomRole: (roleData: Omit<RoleDefinition, 'id' | 'isSystem'>) => RoleDefinition;
  deleteCustomRole: (roleId: string) => void;
  updateSecurityPolicy: (updates: Partial<SecurityPolicy>) => Promise<void>;
  updateCurrentUser: (updates: Partial<User>) => void;
  updateProfile: (updates: Partial<User>) => void;
  fetchActiveSessions: () => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;
  revokeAllOtherSessions: () => Promise<void>;
  closeSessionExpiredModal: () => void;
  hasPermission: (permission: keyof RolePermissions) => boolean;
  hasModulePermission: (moduleId: string, action: keyof RolePermissions) => boolean;
}

const defaultPermissionsByRole: Record<string, RolePermissions> = {
  'Super Admin': { view: true, create: true, edit: true, delete: true, export: true, print: true, approve: true },
  'School Admin': { view: true, create: true, edit: true, delete: true, export: true, print: true, approve: true },
  'Principal': { view: true, create: true, edit: true, delete: false, export: true, print: true, approve: true },
  'Teacher': { view: true, create: true, edit: true, delete: false, export: true, print: true, approve: false },
  'Student': { view: true, create: false, edit: false, delete: false, export: false, print: true, approve: false },
  'Parent': { view: true, create: false, edit: false, delete: false, export: false, print: true, approve: false },
  'Accountant': { view: true, create: true, edit: true, delete: false, export: true, print: true, approve: true },
  'Librarian': { view: true, create: true, edit: true, delete: false, export: true, print: true, approve: false },
  'Transport Manager': { view: true, create: true, edit: true, delete: false, export: true, print: true, approve: false },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isSetupCompleted, setIsSetupCompleted] = useState<boolean>(true);
  const [isCheckingSetup, setIsCheckingSetup] = useState<boolean>(true);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);

  const defaultGuestUser: User = {
    id: '',
    name: 'Institutional Guest',
    email: '',
    role: 'Super Admin',
    status: 'Active',
    department: 'Administration',
    lastLogin: 'Never',
    createdAt: new Date().toISOString().split('T')[0],
    twoFactorEnabled: false,
    permissions: { view: true, create: true, edit: true, delete: true, export: true, print: true, approve: true },
  };

  const [currentUser, setCurrentUser] = useState<User>(initialUsers[0] || defaultGuestUser);
  const [users, setUsers] = useState<User[]>(initialUsers || []);
  const [activeSessions, setActiveSessions] = useState<ActiveSessionInfo[]>([]);
  const [roleDefinitions, setRoleDefinitions] = useState<RoleDefinition[]>(initialRoleDefinitions);
  const [securityPolicy, setSecurityPolicy] = useState<SecurityPolicy>(initialSecurityPolicy);

  // Check setup status
  const checkSetupStatus = useCallback(async (): Promise<boolean> => {
    setIsCheckingSetup(true);
    try {
      const res = await api.get('/setup/status');
      if (res && typeof res.setupCompleted === 'boolean') {
        setIsSetupCompleted(res.setupCompleted);
        return res.setupCompleted;
      }
      return true;
    } catch (e) {
      return true;
    } finally {
      setIsCheckingSetup(false);
    }
  }, []);

  const completeSetupSession = useCallback((user: User, token: string) => {
    if (token) {
      localStorage.setItem('edupulse_jwt_token', token);
    }
    setCurrentUser(user);
    setIsAuthenticated(true);
    setIsSetupCompleted(true);
  }, []);

  // Register unauthorized handlers
  useEffect(() => {
    registerAuthErrorHandlers(
      () => {
        setIsSessionExpired(true);
      },
      (errorInfo) => {
        console.warn(`[RBAC Server Blocked] ${errorInfo.url}: ${errorInfo.error}`);
      }
    );
  }, []);

  // Check Authenticated Session with backend on app start
  const verifySessionOnBoot = useCallback(async () => {
    setIsCheckingAuth(true);

    // Watchdog timer to ensure the UI never hangs in loading state
    const watchdogTimer = setTimeout(() => {
      setIsCheckingAuth(false);
      setIsCheckingSetup(false);
    }, 2500);

    try {
      await checkSetupStatus();
      const data = await api.get('/auth/me');
      if (data && data.authenticated && data.user) {
        setCurrentUser(data.user);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      // Unauthenticated session
      setIsAuthenticated(false);
      localStorage.removeItem('edupulse_jwt_token');
    } finally {
      clearTimeout(watchdogTimer);
      setIsCheckingAuth(false);
      setIsCheckingSetup(false);
    }
  }, [checkSetupStatus]);

  useEffect(() => {
    verifySessionOnBoot();
  }, [verifySessionOnBoot]);

  // Load Users and Security Policies from server
  const refreshUsers = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      if (['Super Admin', 'School Admin'].includes(currentUser.role)) {
        const res = await api.get('/users');
        if (res && res.users) {
          setUsers(res.users);
        }
      }
    } catch (e) {
      // Ignored for non-admin
    }
  }, [isAuthenticated, currentUser.role]);

  const fetchActiveSessions = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/auth/sessions');
      if (res && res.sessions) {
        setActiveSessions(res.sessions);
      }
    } catch (e) {
      // Error handled
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshUsers();
      fetchActiveSessions();
    }
  }, [isAuthenticated, refreshUsers, fetchActiveSessions]);

  const login = async (
    email: string,
    pass: string,
    rememberMe = true
  ): Promise<{ success: boolean; error?: string; status?: string; submittedAt?: string; rejectionReason?: string }> => {
    try {
      const res = await api.post('/auth/login', {
        email,
        password: pass,
        rememberMe,
      });

      if (res.success && res.user) {
        if (res.token) {
          localStorage.setItem('edupulse_jwt_token', res.token);
        }
        setCurrentUser(res.user);
        setIsAuthenticated(true);
        setIsLocked(false);
        setIsSessionExpired(false);
        return { success: true };
      }
      return {
        success: false,
        error: res.error || 'Authentication failed',
        status: res.status,
        submittedAt: res.submittedAt,
        rejectionReason: res.rejectionReason,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.details?.error || err.message || 'Invalid email or password.',
        status: err.details?.status,
        submittedAt: err.details?.submittedAt,
        rejectionReason: err.details?.rejectionReason,
      };
    }
  };

  const signup = async (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    department?: string;
    phone?: string;
    registrationReason?: string;
  }): Promise<{ success: boolean; message?: string; error?: string; status?: string }> => {
    try {
      const res = await api.post('/auth/signup', data);
      if (res.success) {
        if (res.token) {
          localStorage.setItem('edupulse_jwt_token', res.token);
        }
        if (res.user) {
          setCurrentUser(res.user);
          setIsAuthenticated(true);
          setIsLocked(false);
          setIsSessionExpired(false);
        }
        // Also refresh user list
        refreshUsers();
        return {
          success: true,
          message: res.message || 'Account created and activated successfully.',
          status: 'Active',
        };
      }
      return {
        success: false,
        error: res.error || 'Registration failed.',
        status: res.status,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.details?.error || err.message || 'Registration request could not be processed.',
        status: err.details?.status,
      };
    }
  };

  const approveUser = async (userId: string): Promise<{ success: boolean; message?: string; error?: string; user?: User }> => {
    try {
      const res = await api.post(`/users/${userId}/approve`);
      if (res.success && res.user) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? res.user : u)));
        return {
          success: true,
          message: res.message || 'User approved and activated.',
          user: res.user,
        };
      }
      return { success: false, error: res.error || 'Approval failed.' };
    } catch (err: any) {
      // Fallback local update if offline
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                status: 'Active',
                reviewedBy: currentUser.name,
                reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
              }
            : u
        )
      );
      return {
        success: true,
        message: 'User approved and activated.',
      };
    }
  };

  const rejectUser = async (
    userId: string,
    rejectionReason?: string
  ): Promise<{ success: boolean; message?: string; error?: string; user?: User }> => {
    try {
      const res = await api.post(`/users/${userId}/reject`, { rejectionReason });
      if (res.success && res.user) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? res.user : u)));
        return {
          success: true,
          message: res.message || 'User registration rejected.',
          user: res.user,
        };
      }
      return { success: false, error: res.error || 'Rejection failed.' };
    } catch (err: any) {
      // Fallback local update
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                status: 'Rejected',
                rejectionReason: rejectionReason || 'Institutional requirements not verified.',
                reviewedBy: currentUser.name,
                reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
              }
            : u
        )
      );
      return {
        success: true,
        message: 'User registration rejected.',
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Best effort logout
    } finally {
      localStorage.removeItem('edupulse_jwt_token');
      setIsAuthenticated(false);
      setIsLocked(false);
      setIsSessionExpired(false);
    }
  };

  const lockScreen = () => {
    setIsLocked(true);
  };

  const unlockScreen = (pass: string) => {
    if (pass && pass.trim().length >= 4) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const switchRole = async (role: UserRole | string): Promise<void> => {
    try {
      const res = await api.post('/auth/switch-role', { targetRole: role });
      if (res.success && res.user) {
        if (res.token) {
          localStorage.setItem('edupulse_jwt_token', res.token);
        }
        setCurrentUser(res.user);
        setIsAuthenticated(true);
      }
    } catch (e) {
      // Fallback
      const existing = users.find((u) => u.role === role);
      if (existing) {
        setCurrentUser(existing);
      }
    }
  };

  const impersonateUser = (targetUser: User) => {
    setCurrentUser(targetUser);
    setIsAuthenticated(true);
  };

  const addUser = async (userData: Omit<User, 'id' | 'createdAt' | 'lastLogin'> & { password?: string }): Promise<User> => {
    try {
      const payload = {
        ...userData,
        password: userData.password || 'Admin@2026',
      };
      const res = await api.post('/users', payload);
      if (res.success && res.user) {
        setUsers((prev) => [res.user, ...prev]);
        return res.user;
      }
      throw new Error(res.error || 'Failed to create user');
    } catch (err: any) {
      throw new Error(err.details?.error || err.message);
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
    try {
      const res = await api.put(`/users/${userId}`, updates);
      if (res.success && res.user) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? res.user : u)));
        if (currentUser.id === userId) {
          setCurrentUser(res.user);
        }
      }
    } catch (err: any) {
      throw new Error(err.details?.error || err.message);
    }
  };

  const deleteUser = async (userId: string): Promise<void> => {
    try {
      await api.delete(`/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: any) {
      throw new Error(err.details?.error || err.message);
    }
  };

  const toggleUserStatus = async (userId: string): Promise<void> => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    const nextStatus = target.status === 'Active' ? 'Inactive' : 'Active';
    await updateUser(userId, { status: nextStatus });
  };

  const resetUserPassword = async (userId: string): Promise<string> => {
    try {
      const res = await api.post(`/users/${userId}/reset-password`);
      return res.tempPassword || 'Pass@2026!';
    } catch (err: any) {
      throw new Error(err.details?.error || err.message);
    }
  };

  const updateUserPermissions = (userId: string, permissions: RolePermissions) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, permissions } : u))
    );
    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, permissions }));
    }
  };

  const updateRolePermission = (
    roleId: string,
    moduleId: string,
    permKey: keyof RolePermissions,
    value: boolean
  ) => {
    setRoleDefinitions((prev) =>
      prev.map((r) => {
        if (r.id === roleId) {
          const existingMod = r.permissions[moduleId] || {
            view: false,
            create: false,
            edit: false,
            delete: false,
            export: false,
            print: false,
            approve: false,
          };
          return {
            ...r,
            permissions: {
              ...r.permissions,
              [moduleId]: {
                ...existingMod,
                [permKey]: value,
              },
            },
          };
        }
        return r;
      })
    );
  };

  const addCustomRole = (roleData: Omit<RoleDefinition, 'id' | 'isSystem'>): RoleDefinition => {
    const newRole: RoleDefinition = {
      ...roleData,
      id: `role-custom-${Date.now()}`,
      isSystem: false,
    };
    setRoleDefinitions((prev) => [...prev, newRole]);
    return newRole;
  };

  const deleteCustomRole = (roleId: string) => {
    setRoleDefinitions((prev) => prev.filter((r) => r.id !== roleId && !r.isSystem));
  };

  const updateSecurityPolicy = async (updates: Partial<SecurityPolicy>): Promise<void> => {
    try {
      const res = await api.put('/security/policy', updates);
      if (res.success && res.policy) {
        setSecurityPolicy(res.policy);
      }
    } catch (e) {
      setSecurityPolicy((prev) => ({ ...prev, ...updates }));
    }
  };

  const updateCurrentUser = (updates: Partial<User>) => {
    setCurrentUser((prev) => ({ ...prev, ...updates }));
  };

  const revokeSession = async (sessionId: string): Promise<void> => {
    await api.post('/auth/sessions/revoke', { targetSessionId: sessionId });
    setActiveSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
  };

  const revokeAllOtherSessions = async (): Promise<void> => {
    await api.post('/auth/sessions/revoke', { revokeAllOther: true });
    await fetchActiveSessions();
  };

  const closeSessionExpiredModal = () => {
    setIsSessionExpired(false);
  };

  const hasPermission = (perm: keyof RolePermissions): boolean => {
    if (currentUser.role === 'Super Admin') return true;
    if (currentUser.permissions && currentUser.permissions[perm] !== undefined) {
      return currentUser.permissions[perm];
    }
    const roleDefault = defaultPermissionsByRole[currentUser.role];
    return roleDefault ? roleDefault[perm] : false;
  };

  const hasModulePermission = (moduleId: string, action: keyof RolePermissions): boolean => {
    if (currentUser.role === 'Super Admin') return true;
    // Check if user has custom override
    if (currentUser.customModulePermissions && currentUser.customModulePermissions[moduleId]) {
      return !!currentUser.customModulePermissions[moduleId][action];
    }
    // Check role definitions
    const matchedRole = roleDefinitions.find((r) => r.name.toLowerCase() === currentUser.role.toLowerCase());
    if (matchedRole && matchedRole.permissions[moduleId]) {
      return !!matchedRole.permissions[moduleId][action];
    }
    return hasPermission(action);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isCheckingAuth,
        isSetupCompleted,
        isCheckingSetup,
        isLocked,
        isSessionExpired,
        users,
        activeSessions,
        roleDefinitions,
        securityPolicy,
        checkSetupStatus,
        completeSetupSession,
        login,
        signup,
        approveUser,
        rejectUser,
        refreshUsers,
        logout,
        lockScreen,
        unlockScreen,
        switchRole,
        impersonateUser,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        resetUserPassword,
        updateUserPermissions,
        updateRolePermission,
        addCustomRole,
        deleteCustomRole,
        updateSecurityPolicy,
        updateCurrentUser,
        updateProfile: updateCurrentUser,
        fetchActiveSessions,
        revokeSession,
        revokeAllOtherSessions,
        closeSessionExpiredModal,
        hasPermission,
        hasModulePermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
