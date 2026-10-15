import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { hasSession } from "../services/auth/session";

//Protegge solo la navigazione: i dati della cassa li deve proteggere il backend
export function ProtectedRoute({ children }: { children: ReactNode }) {
  if (!hasSession()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
