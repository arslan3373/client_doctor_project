import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: ('patient' | 'doctor' | 'admin')[];
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  allowedRoles = ['patient', 'doctor', 'admin'],
  children 
}) => {
  const { isAuthenticated, isDoctor, isPatient, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  const hasRequiredRole = user && (
    allowedRoles.includes(user.role) || 
    (isDoctor && allowedRoles.includes('doctor')) ||
    (isPatient && allowedRoles.includes('patient'))
  );

  // If user doesn't have required role, redirect to unauthorized or home
  if (!hasRequiredRole) {
    // You can create a specific "unauthorized" page if needed
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  // If we have children, render them, otherwise render the Outlet
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
