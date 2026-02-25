import type { LucideIcon } from "lucide-react"
import {
  Home,
  LayoutDashboard,
  Shield,
  Wallet,
  ShoppingCart,
  TrendingUp,
  GraduationCap,
  Calculator,
  Warehouse,
  CalendarCheck2,
  PackageSearch,
  History,
} from "lucide-react"

export type Role = "USER" | "ADMIN" | "BACKOFFICE"

export type AppNavItem = {
  label: string
  to: string
  icon: LucideIcon
  roles?: Role[]
}

export const appNavItems: AppNavItem[] = [
  { label: "Overview", to: "/app/home", icon: Home, roles: ["USER"] },
  { label: "Lihat Barang", to: "/app/view", icon: PackageSearch, roles: ["USER"] },
  { label: "Booking", to: "/app/booking", icon: CalendarCheck2, roles: ["USER"] },
  { label: "Riwayat", to: "/app/history", icon: History, roles: ["USER"] },
  { label: "Dashboard", to: "/app/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "BACKOFFICE"] },
  { label: "Admin Panel", to: "/app/admin", icon: Shield, roles: ["ADMIN"] },
  { label: "Admin Finance", to: "/app/admin-finance", icon: Wallet, roles: ["ADMIN", "BACKOFFICE"] },
  { label: "Purchasing", to: "/app/purchasing", icon: ShoppingCart, roles: ["ADMIN", "BACKOFFICE"] },
  { label: "Marketing Sales", to: "/app/marketing-sales", icon: TrendingUp, roles: ["ADMIN", "BACKOFFICE"] },
  { label: "Manage Class", to: "/app/manage-class", icon: GraduationCap, roles: ["ADMIN", "BACKOFFICE"] },
  { label: "Accounting", to: "/app/accounting", icon: Calculator, roles: ["ADMIN", "BACKOFFICE"] },
  { label: "Inventory", to: "/app/inventory", icon: Warehouse, roles: ["ADMIN", "BACKOFFICE"] },
]

export function filterNavItems(items: AppNavItem[], role: Role | null) {
  return items.filter((item) => !item.roles || (role !== null && item.roles.includes(role)))
}
