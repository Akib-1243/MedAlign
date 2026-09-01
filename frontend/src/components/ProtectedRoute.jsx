import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ShieldX, UserRound, Stethoscope, ShieldCheck } from "lucide-react";

/**
 * ProtectedRoute — Guards routes strictly by authentication state and role access.
 *
 * Rules:
 *  1. Unauthenticated users -> Redirect to designated loginPath.
 *  2. Authenticated user with invalid role -> Redirect to user's authorized role dashboard:
 *     - admin   -> /admin
 *     - doctor  -> /doctor
 *     - patient -> /patient
 *  3. Authorized user -> Render page children.
 */

const ROLE_DASHBOARDS = {
  admin: "/admin",
  doctor: "/doctor",
  patient: "/patient",
  reception: "/admin",
};

function ProtectedRoute({
  authenticated,
  user,
  allowedRoles,
  loginPath = "/auth",
  children,
}) {
  const location = useLocation();

  // 1. Not authenticated -> redirect to role login path
  if (!authenticated) {
    return (
      <Navigate
        to={loginPath}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  // 2. Authenticated but attempting to access an unauthorized role page
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const userDashboard = ROLE_DASHBOARDS[user?.role] || "/patient";
    return <Navigate to={userDashboard} replace />;
  }

  // 3. Authorized -> render page
  return children;
}

export default ProtectedRoute;
