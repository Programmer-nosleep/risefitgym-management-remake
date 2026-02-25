import Aside from "@/components/partials/Aside"
import Footer from "@/components/partials/Footer"
import Navbar from "@/components/partials/Navbar"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth.store"
import { Outlet } from "react-router-dom"

export default function AppLayout() {
  const role = useAuthStore((s) => s.user?.role ?? null)
  const hideAside = role === "USER"

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />

      <div className="mx-auto flex w-full max-w-screen-2xl gap-6 px-4 py-6 md:px-6">
        <Aside className={cn("hidden w-64 shrink-0 md:block", hideAside && "md:hidden")} />

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  )
}
