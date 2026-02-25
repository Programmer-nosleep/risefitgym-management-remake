import BrandLogo from "@/components/BrandLogo"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { appNavItems, filterNavItems } from "@/route/app-nav"
import { useAuthStore } from "@/store/auth.store"
import { LogOut, Menu, User } from "lucide-react"
import { Link, NavLink, useNavigate } from "react-router-dom"

export default function Navbar() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const items = filterNavItems(appNavItems, user?.role ?? null)
  const showInlineLinks = user?.role === "USER"

  function handleSignOut() {
    clearAuth()
    navigate("/login", { replace: true })
  }

  const initials = (user?.name ?? "R")
    .trim()
    .slice(0, 1)
    .toUpperCase()

  return (
    <nav className="bg-gradient-to-r from-orange-600 to-orange-800 shadow-md">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-3 px-4 md:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 md:hidden"
            >
              <Menu className="size-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <SheetHeader className="gap-3">
              <SheetTitle className="flex items-center gap-2">
                <BrandLogo />
                <span>RiseFit</span>
              </SheetTitle>
              <p className="text-muted-foreground text-xs">
                Navigasi utama untuk akses cepat.
              </p>
            </SheetHeader>
            <Separator />
            <div className="flex flex-col gap-1 p-2">
              {items.map((item) => (
                <SheetClose asChild key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        buttonVariants({ variant: "ghost" }),
                        "h-9 w-full justify-start gap-3",
                        isActive && "bg-primary/10 text-primary hover:bg-primary/15"
                      )
                    }
                    end
                  >
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </NavLink>
                </SheetClose>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        <Link to="/app" className="flex items-center gap-2">
          <BrandLogo />
        </Link>

        {showInlineLinks ? (
          <div className="hidden items-center gap-1 rounded-full bg-white/10 p-1 md:flex">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white",
                    isActive && "bg-white/15 text-white"
                  )
                }
                end
              >
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ) : null}

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden flex-col items-end leading-tight text-white sm:flex">
            <span className="text-sm font-semibold">{user?.name ?? "Guest"}</span>
            <span className="text-[11px] opacity-80">
              {user?.role ?? "UNAUTHENTICATED"}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
              >
                <Avatar size="sm">
                  <AvatarFallback className="bg-white/15 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56">
              <DropdownMenuLabel className="flex flex-col">
                <span className="text-sm font-semibold">{user?.name ?? "Guest"}</span>
                <span className="text-muted-foreground text-xs font-normal">
                  {user?.email ?? "Belum login"}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/app/profile" className="flex items-center">
                  <User className="mr-2 size-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
