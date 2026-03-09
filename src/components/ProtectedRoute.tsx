import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("auth_token");
  if (!token) return <Navigate to="/cassa" replace />;
  return <>{children}</>;
}
