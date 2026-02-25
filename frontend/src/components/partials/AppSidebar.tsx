import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useTheme } from "@/hooks/use-theme"
import type { Role } from "@/route/app-nav"
import { useAuthStore } from "@/store/auth.store"
import type { LucideIcon } from "lucide-react"
import {
  Bell,
  Building,
  Calculator,
  CalendarCheck,
  ChevronRight,
  ChevronsUpDown,
  CreditCard,
  Dumbbell,
  History,
  LayoutDashboard,
  LogOut,
  Moon,
  Package,
  Plus,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Sun,
  TrendingUp,
  Users,
} from "lucide-react"
import { useMemo, useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"

type Team = {
  name: string
  plan: string
  logo: LucideIcon
}

type NavSubItem = {
  title: string
  url: string
}

type NavItem = {
  title: string
  url: string
  icon: LucideIcon
  items?: NavSubItem[]
  roles?: Role[]
}

function initialsFromName(name: string) {
  const cleaned = name.trim()
  if (!cleaned) return "R"

  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()

  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase()
}

function roleLabel(role: Role) {
  switch (role) {
    case "ADMIN":
      return "Admin"
    case "BACKOFFICE":
      return "Backoffice"
    default:
      return "User"
  }
}

export default function AppSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const role = user?.role ?? null
  const { theme, toggleTheme } = useTheme()

  const teams = useMemo<Team[]>(() => {
    const plan = role ? roleLabel(role) : "Enterprise"
    return [
      { name: "RiseFit", plan, logo: Dumbbell },
      { name: "RiseFit Gym", plan, logo: LayoutDashboard },
      { name: "RiseFit Studio", plan, logo: Users },
    ]
  }, [role])

  const [activeTeamIndex, setActiveTeamIndex] = useState(0)
  const activeTeam = teams[activeTeamIndex] ?? teams[0] ?? null

  const navMain = useMemo<NavItem[]>(() => {
    return [
      {
        title: "Overview",
        url: "/app/home",
        icon: LayoutDashboard,
        roles: ["USER"],
      },
      {
        title: "Lihat Barang",
        url: "/app/view",
        icon: ShoppingBag,
        roles: ["USER"],
      },
      {
        title: "Booking",
        url: "/app/booking",
        icon: CalendarCheck,
        roles: ["USER"],
      },
      {
        title: "Riwayat",
        url: "/app/history",
        icon: History,
        roles: ["USER"],
      },
      {
        title: "Dashboard",
        url: "/app/dashboard",
        icon: LayoutDashboard,
        roles: ["ADMIN", "BACKOFFICE"],
      },
      {
        title: "Admin Finance",
        url: "/app/admin-finance",
        icon: Building,
        roles: ["ADMIN", "BACKOFFICE"],
      },
      {
        title: "Purchasing",
        url: "/app/purchasing",
        icon: ShoppingCart,
        roles: ["ADMIN", "BACKOFFICE"],
      },
      {
        title: "Marketing Sales",
        url: "/app/marketing-sales",
        icon: TrendingUp,
        roles: ["ADMIN", "BACKOFFICE"],
      },
      {
        title: "Manage Class",
        url: "/app/manage-class",
        icon: Dumbbell,
        roles: ["ADMIN", "BACKOFFICE"],
      },
      {
        title: "Accounting",
        url: "/app/accounting",
        icon: Calculator,
        roles: ["ADMIN", "BACKOFFICE"],
      },
      {
        title: "Inventory",
        url: "/app/inventory",
        icon: Package,
        roles: ["ADMIN", "BACKOFFICE"],
      },
    ]
  }, [])

  const filteredNav = useMemo(() => {
    return navMain.filter((item) => !item.roles || (role !== null && item.roles.includes(role)))
  }, [navMain, role])

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  function handleSignOut() {
    clearAuth()
    navigate("/login", { replace: true })
  }

  const initials = initialsFromName(user?.name ?? "RiseFit")

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  tooltip="Teams"
                >
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    {activeTeam ? <activeTeam.logo className="size-4" /> : null}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold">{activeTeam?.name ?? "RiseFit"}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {activeTeam?.plan ?? "Enterprise"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="start"
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Teams
                </DropdownMenuLabel>
                {teams.map((team, index) => (
                  <DropdownMenuItem
                    key={team.name}
                    onClick={() => setActiveTeamIndex(index)}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                      <team.logo className="size-4 shrink-0" />
                    </div>
                    {team.name}
                    <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 p-2">
                  <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                    <Plus className="size-4" />
                  </div>
                  <div className="font-medium text-muted-foreground">Add team</div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            {!user ? (
              <SidebarMenu>
                {Array.from({ length: 6 }).map((_, idx) => (
                  <SidebarMenuItem key={idx}>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            ) : (
              <SidebarMenu>
                {filteredNav.map((item) => {
                  const isActive =
                    location.pathname === item.url ||
                    item.items?.some((sub) => sub.url === location.pathname) ||
                    false

                  if (item.items?.length) {
                    const open = openGroups[item.title] ?? isActive

                    return (
                      <SidebarMenuItem key={item.title}>
                        <Collapsible
                          open={open}
                          onOpenChange={(nextOpen) =>
                            setOpenGroups((prev) => ({ ...prev, [item.title]: nextOpen }))
                          }
                          className="group/collapsible"
                        >
                          <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                            <NavLink to={item.url} end>
                              <item.icon />
                              <span>{item.title}</span>
                            </NavLink>
                          </SidebarMenuButton>

                          <CollapsibleTrigger asChild>
                            <SidebarMenuAction className="data-[state=open]:rotate-90">
                              <ChevronRight />
                              <span className="sr-only">Toggle</span>
                            </SidebarMenuAction>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.items.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.url}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={location.pathname === subItem.url}
                                  >
                                    <NavLink to={subItem.url} end>
                                      <span>{subItem.title}</span>
                                    </NavLink>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </Collapsible>
                      </SidebarMenuItem>
                    )
                  }

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                        <NavLink to={item.url} end>
                          <item.icon />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  tooltip="Account"
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>

                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold">{user?.name ?? "Guest"}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email ?? "Belum login"}
                    </span>
                  </div>

                  <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
                    <Avatar className="size-8 rounded-lg">
                      <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user?.name ?? "Guest"}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user?.email ?? "Belum login"}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/app/profile")}>
                  <Settings className="mr-2 size-4" />
                  Settings
                </DropdownMenuItem>
                {role === "USER" && (
                  <DropdownMenuItem onClick={() => navigate("/app/profile")}>
                    <CreditCard className="mr-2 size-4" />
                    Billing
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate("/app/profile")}>
                  <Bell className="mr-2 size-4" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleTheme}>
                  {theme === "dark" ? (
                    <Sun className="mr-2 size-4" />
                  ) : (
                    <Moon className="mr-2 size-4" />
                  )}
                  Theme
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
