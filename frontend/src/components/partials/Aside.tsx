import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { appNavItems, filterNavItems } from "@/route/app-nav"
import { useAuthStore } from "@/store/auth.store"
import { NavLink } from "react-router-dom"

export default function Aside({ className }: { className?: string }) {
  const role = useAuthStore((s) => s.user?.role ?? null)
  const items = filterNavItems(appNavItems, role)

  return (
    <aside className={cn("sticky top-20 self-start", className)}>
      <div className="rounded-xl border bg-background shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-semibold">Menu</p>
          {role ? (
            <span className="text-muted-foreground text-xs">{role}</span>
          ) : null}
        </div>
        <Separator />
        <nav className="flex flex-col gap-1 p-2">
          {items.map((item) => (
            <NavLink
              key={item.to}
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
          ))}
        </nav>
      </div>
    </aside>
  )
}
