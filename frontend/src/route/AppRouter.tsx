import AppLayout from "@/layouts/AppLayout"
import AdminPanel from "@/pages/admin/AdminPanel"
import Login from "@/pages/auth/Login"
import OAuthCallback from "@/pages/auth/OAuthCallback"
import Register from "@/pages/auth/Register"
import VerifyOtp from "@/pages/auth/VerifyOtp"
import LandingPage from "@/pages/home/LandingPage"
import Booking from "@/pages/pelanggan/Booking"
import History from "@/pages/pelanggan/History"
import HomeUser from "@/pages/pelanggan/HomeUser"
import View from "@/pages/pelanggan/View"
import NotFound from "@/pages/NotFound"
import Accounting from "@/pages/office/Accounting"
import AdminFinance from "@/pages/office/AdminFinance"
import Dashboard from "@/pages/office/Dashboard"
import Inventory from "@/pages/office/Inventory"
import ManageClass from "@/pages/office/ManageClass"
import Market from "@/pages/office/Market"
import Purchasing from "@/pages/office/Purchasing"
import Profile from "@/pages/settings/Profile"
import { useAuthStore } from "@/store/auth.store"
import type { ReactNode } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import ProtectedRoute from "./ProtectedRoute"

function PublicOnly({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  if (accessToken) return <Navigate to="/app" replace />
  return <>{children}</>
}

function AppIndexRedirect() {
  const role = useAuthStore((s) => s.user?.role)

  if (role === "USER") return <Navigate to="/app/home" replace />
  return <Navigate to="/app/dashboard" replace />
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnly>
              <Register />
            </PublicOnly>
          }
        />

        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<AppIndexRedirect />} />
            <Route path="profile" element={<Profile />} />

            <Route element={<ProtectedRoute allowedRoles={["USER"]} />}>
              <Route path="home" element={<HomeUser />} />
              <Route path="view" element={<View />} />
              <Route path="booking" element={<Booking />} />
              <Route path="history" element={<History />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["ADMIN", "BACKOFFICE"]} />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="admin-finance" element={<AdminFinance />} />
              <Route path="purchasing" element={<Purchasing />} />
              <Route path="manage-class" element={<ManageClass />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="marketing-sales" element={<Market />} />
              <Route path="accounting" element={<Accounting />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
              <Route path="admin" element={<AdminPanel />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
