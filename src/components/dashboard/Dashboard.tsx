import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { TeacherDashboard } from './TeacherDashboard';
import { StudentDashboard } from './StudentDashboard';
import { ParentDashboard } from './ParentDashboard';
import { AccountantDashboard } from './AccountantDashboard';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();

  switch (currentUser.role) {
    case 'Teacher':
      return <TeacherDashboard onNavigate={onNavigate} />;
    case 'Student':
      return <StudentDashboard onNavigate={onNavigate} />;
    case 'Parent':
      return <ParentDashboard onNavigate={onNavigate} />;
    case 'Accountant':
      return <AccountantDashboard onNavigate={onNavigate} />;
    case 'Super Admin':
    case 'School Admin':
    case 'Principal':
    default:
      return <SuperAdminDashboard onNavigate={onNavigate} />;
  }
};
