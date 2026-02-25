import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { api } from "@/services/api"
import { useAuthStore, type AuthUser } from "@/store/auth.store"
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

function parseHash(hash: string) {
  const clean = hash.startsWith("#") ? hash.slice(1) : hash
  const params = new URLSearchParams(clean)
  return {
    accessToken: params.get("accessToken"),
    next: params.get("next") ?? "/app",
    error: params.get("error"),
  }
}

export default function OAuthCallback() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const { accessToken, next, error } = useMemo(() => parseHash(window.location.hash), [])

  const [status, setStatus] = useState<"loading" | "error">("loading")
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (error) {
        setStatus("error")
        setMessage("OAuth failed. Please try again.")
        return
      }

      if (!accessToken) {
        setStatus("error")
        setMessage("Missing access token. Please try again.")
        return
      }

      try {
        const me = await api.get<{ user: AuthUser }>("/auth/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        })

        if (cancelled) return
        setAuth({ accessToken, user: me.data.user })
        navigate(next, { replace: true })
      } catch {
        if (cancelled) return
        setStatus("error")
        setMessage("Failed to finish OAuth sign-in. Please try again.")
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [accessToken, error, navigate, next, setAuth])

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background">
      <div className="bg-size-[40px_40px] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] pointer-events-none opacity-50"></div>

      <div className="relative z-10 w-full max-w-[420px] px-4">
        <div className="rounded-2xl bg-card text-card-foreground px-8 py-10 shadow-sm border border-border">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Signing you in</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {status === "loading" ? "Please wait..." : message}
            </p>
          </div>

          <div className={cn("flex justify-center", status === "loading" ? "opacity-80" : "")}>
            {status === "error" ? (
              <Button asChild className="h-11 w-full rounded-lg">
                <Link to="/login">Back to sign in</Link>
              </Button>
            ) : (
              <Button className="h-11 w-full rounded-lg" disabled>
                Loading...
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

