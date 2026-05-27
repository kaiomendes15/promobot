import { Navigate, Outlet } from 'react-router'
import { tokenStorage } from '../api/client'

export default function ProtectedRoute() {
  return tokenStorage.get() ? <Outlet /> : <Navigate to="/login" replace />
}
