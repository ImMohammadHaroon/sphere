import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  getDashboardPath,
  isOrgVerificationBlocking,
} from "@/lib/authHelpers";

export function ProtectedRoute({ allowedRoles, children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  const blocking = isOrgVerificationBlocking(user);
  const onAwaitingPage = location.pathname === "/awaiting-approval";

  if (blocking && !onAwaitingPage) {
    return <Navigate to="/awaiting-approval" replace />;
  }

  if (!blocking && onAwaitingPage) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <>{children}</>;
}
