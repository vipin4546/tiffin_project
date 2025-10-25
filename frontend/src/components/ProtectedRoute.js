import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({
  children,
  requiredRole = null,
  redirectTo = "/login",
}) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Redirect based on user role
    const roleBasedRedirect = {
      admin: "/admin/dashboard",
      chef: "/chef/dashboard",
      customer: "/customer/dashboard",
    };

    return (
      <Navigate to={roleBasedRedirect[user.role] || "/dashboard"} replace />
    );
  }

  return children;
};

export default ProtectedRoute;
