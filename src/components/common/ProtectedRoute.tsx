import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AccessDeniedView } from '../auth/AccessDeniedView';
import { RolePermissions } from '../../types/erp';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  requiredModule?: string;
  requiredAction?: keyof RolePermissions;
  currentPath: string;
  onNavigateHome: () => void;
  onSwitchRole?: (role: string) => void;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  requiredModule,
  requiredAction = 'view',
  currentPath,
  onNavigateHome,
  onSwitchRole,
  children,
}) => {
  const { currentUser, isAuthenticated, hasModulePermission } = useAuth();

  if (!isAuthenticated) {
    return null; // Parent layout will render LoginView
  }

  // 1. Super Admin has unrestricted institutional access
  if (currentUser.role === 'Super Admin') {
    return <>{children}</>;
  }

  // 2. Check Allowed Roles if specified
  if (allowedRoles && allowedRoles.length > 0) {
    const isRoleAllowed = allowedRoles.some(
      (r) => r.toLowerCase() === currentUser.role.toLowerCase()
    );
    if (!isRoleAllowed) {
      return (
        <AccessDeniedView
          attemptedPath={`/${currentPath}`}
          requiredRoles={allowedRoles}
          onNavigateHome={onNavigateHome}
          onSwitchRole={onSwitchRole}
        />
      );
    }
  }

  // 3. Check Granular Module Permissions if specified
  if (requiredModule) {
    const action: keyof RolePermissions = (requiredAction as keyof RolePermissions) || 'view';
    const hasPerm = hasModulePermission(requiredModule, action);
    if (!hasPerm) {
      return (
        <AccessDeniedView
          attemptedPath={`/${currentPath}`}
          requiredRoles={allowedRoles || ['Super Admin', 'School Admin']}
          onNavigateHome={onNavigateHome}
          onSwitchRole={onSwitchRole}
        />
      );
    }
  }

  return <>{children}</>;
};
