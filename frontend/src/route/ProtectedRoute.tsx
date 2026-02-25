import type { Role } from "@/route/app-nav"
import { useAuthStore } from "@/store/auth.store"
import { Navigate, Outlet, useLocation } from "react-router-dom"

export default function ProtectedRoute({ allowedRoles }: { allowedRoles?: Role[] }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (allowedRoles) {
    if (!user) {
      return (
        <div className="p-6 text-sm text-muted-foreground">
          Loading...
        </div>
      )
    }

    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/app" replace />
    }
  }

  return <Outlet />
}
