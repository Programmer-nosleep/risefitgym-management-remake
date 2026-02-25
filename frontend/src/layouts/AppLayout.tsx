import AppSidebar from "@/components/partials/AppSidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { useTheme } from "@/hooks/use-theme"
import { appNavItems } from "@/route/app-nav"
import { ArrowLeft, Moon, Sun } from "lucide-react"
import { useMemo } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  const pageTitle = useMemo(() => {
    if (location.pathname === "/app") return "App"
    if (location.pathname === "/app/profile") return "Profile"

    const navMatch = appNavItems.find((item) => item.to === location.pathname)
    if (navMatch) return navMatch.label

    const last = location.pathname.split("/").filter(Boolean).at(-1) ?? "App"
    return last.charAt(0).toUpperCase() + last.slice(1)
  }, [location.pathname])

  return (
    <SidebarProvider className="bg-muted/30">
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="size-8">
              <ArrowLeft className="size-4" />
              <span className="sr-only">Back</span>
            </Button>
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="size-8">
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col gap-6 px-4 py-6 md:px-6">
          <div className="min-w-0 flex-1">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
