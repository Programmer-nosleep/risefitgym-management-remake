import { getMe } from "@/helpers/auth.helper"
import { useAuthStore } from "@/store/auth.store"
import type { ReactNode } from "react"
import { useEffect } from "react"

export default function AuthProvider({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  useEffect(() => {
    let cancelled = false

    async function hydrateMe() {
      if (!accessToken || user) return
      try {
        const me = await getMe()
        if (!cancelled) setUser(me)
      } catch {
        if (!cancelled) clearAuth()
      }
    }

    hydrateMe()

    return () => {
      cancelled = true
    }
  }, [accessToken, user, setUser, clearAuth])

  return <>{children}</>
}
