import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children, allowedRole }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-9 h-9 text-[#0B192C] animate-spin" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Verifying Sovereign Credentials...
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Enforce role-based access control
  if (allowedRole && role && role !== allowedRole) {
    const destination =
      role === "admin"
        ? "/admin/dashboard"
        : role === "government"
        ? "/government/dashboard"
        : "/startup/dashboard";
    return <Navigate to={destination} replace />;
  }

  return children;
}
