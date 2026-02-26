import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuth = sessionStorage.getItem('cashier_auth') === 'true'
  return isAuth ? children : <Navigate to="/cashier" replace />
}