import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getApiErrorMessage } from "@/helpers/api-error"
import { apiBaseUrl } from "@/services/api"
import type { FormEvent } from "react"
import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { signUp } from "@/helpers/auth.helper"
import { useAuthStore } from "@/store/auth.store"
import { useTheme } from "@/hooks/use-theme"
import { ArrowLeft, Moon, Sun } from "lucide-react"
import { siApple } from "simple-icons/icons"

export default function Register() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)
  const { theme, toggleTheme } = useTheme()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Specific error states for fields
  const [nameError, setNameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)
  const [generalError, setGeneralError] = useState<string | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Temporarily disable Apple OAuth button (keep handler + UI for later).
  const isAppleOauthEnabled = false

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // Reset errors
    setNameError(null)
    setEmailError(null)
    setPasswordError(null)
    setConfirmPasswordError(null)
    setGeneralError(null)

    const nameValue = name.trim()
    const emailValue = email.trim()
    const passwordValue = password
    const confirmPasswordValue = confirmPassword

    let hasError = false

    if (!nameValue) {
      setNameError("Please enter your full name")
      hasError = true
    }

    if (!emailValue) {
      setEmailError("Please enter a valid email address")
      hasError = true
    }

    if (!passwordValue || passwordValue.length < 8) {
      setPasswordError("Password must be at least 8 characters")
      hasError = true
    }

    if (!confirmPasswordValue) {
      setConfirmPasswordError("Please confirm your password")
      hasError = true
    } else if (passwordValue !== confirmPasswordValue) {
      setConfirmPasswordError("Passwords do not match")
      hasError = true
    }

    if (hasError) return

    setIsSubmitting(true)
    try {
      const result = await signUp({ name: nameValue, email: emailValue, password: passwordValue })
      setAuth({ accessToken: result.accessToken, user: result.user })

      const state = (location.state ?? {}) as Partial<{ from?: string }>
      const next =
        state.from ??
        new URLSearchParams(location.search).get("next") ??
        "/app"
      navigate(next, { replace: true })
    } catch (err) {
      setGeneralError(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleGoogle() {
    window.location.href = `${apiBaseUrl}/auth/oauth/google?next=${encodeURIComponent("/app")}`
  }

  function handleApple() {
    window.location.href = `${apiBaseUrl}/auth/oauth/apple?next=${encodeURIComponent("/app")}`
  }

  function handleBack() {
    navigate("/", { replace: true })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background">
      <div className="bg-size-[40px_40px] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] pointer-events-none opacity-50"></div>

      <div className="absolute left-4 top-4 z-20">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="size-9 rounded-full border border-border bg-background/70 backdrop-blur hover:bg-accent"
        >
          <ArrowLeft className="size-4" />
          <span className="sr-only">Back</span>
        </Button>
      </div>

      <div className="absolute right-4 top-4 z-20">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="size-9 rounded-full border border-border bg-background/70 backdrop-blur hover:bg-accent"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      <div className="relative z-10 w-full max-w-[400px] px-4">
        <div className="rounded-2xl bg-card text-card-foreground px-8 py-10 shadow-sm border border-border">

          <div className="mb-8 flex flex-col items-center text-center">
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
              Create an account
            </h1>
            <p className="text-sm text-muted-foreground">
              Please enter your details to create an account.
            </p>
          </div>

          {/* Alert block removed */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Field */}
            <div className="space-y-1.5">
              <Label
                htmlFor="name"
                className={cn("text-xs font-medium text-foreground", nameError && "text-destructive")}
              >
                Full Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setNameError(null)
                }}
                placeholder="Enter your full name"
                autoComplete="name"
                className={cn(
                  "h-11 rounded-lg border-input bg-background text-foreground shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  nameError && "border-destructive focus-visible:ring-destructive/50"
                )}
              />
              {nameError && <p className="text-[11px] text-destructive">{nameError}</p>}
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className={cn("text-xs font-medium text-foreground", emailError && "text-destructive")}
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setEmailError(null)
                }}
                placeholder="Enter your Email"
                autoComplete="email"
                className={cn(
                  "h-11 rounded-lg border-input bg-background text-foreground shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  emailError && "border-destructive focus-visible:ring-destructive/50"
                )}
              />
              {emailError && <p className="text-[11px] text-destructive">{emailError}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className={cn("text-xs font-medium text-foreground", passwordError && "text-destructive")}
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setPasswordError(null)
                }}
                placeholder="Create a password"
                autoComplete="new-password"
                className={cn(
                  "h-11 rounded-lg border-input bg-background text-foreground shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  passwordError && "border-destructive focus-visible:ring-destructive/50"
                )}
              />
              {passwordError && <p className="text-[11px] text-destructive">{passwordError}</p>}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <Label
                htmlFor="confirmPassword"
                className={cn("text-xs font-medium text-foreground", confirmPasswordError && "text-destructive")}
              >
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setConfirmPasswordError(null)
                }}
                placeholder="Confirm your password"
                autoComplete="new-password"
                className={cn(
                  "h-11 rounded-lg border-input bg-background text-foreground shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  confirmPasswordError && "border-destructive focus-visible:ring-destructive/50"
                )}
              />
              {confirmPasswordError && <p className="text-[11px] text-destructive">{confirmPasswordError}</p>}
            </div>

            {generalError && (
              <p className="text-[13px] font-medium text-destructive">{generalError}</p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 h-11 w-full rounded-lg bg-primary text-primary-foreground shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] border border-primary/20 hover:bg-primary/90 active:bg-primary/80 active:shadow-inner transition-all duration-200"
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <div className="my-6 flex items-center justify-center">
            <div className="w-full border-t border-border"></div>
            <span className="bg-card px-3 text-[10px] uppercase font-medium text-muted-foreground">or</span>
            <div className="w-full border-t border-border"></div>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="h-11 w-full rounded-lg border-border bg-background text-foreground text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
              type="button"
              onClick={handleGoogle}
            >
              <svg className="mr-2 size-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              Continue with Google
            </Button>

            {isAppleOauthEnabled && (
              <Button
                variant="outline"
                className="h-11 w-full rounded-lg border-border bg-background text-foreground text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                type="button"
                onClick={handleApple}
              >
                <svg className="mr-2 size-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d={siApple.path} />
                </svg>
                Continue with Apple
              </Button>
            )}
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground font-medium">
            Already have an account?{" "}
            <Link to="/login" className="text-foreground underline underline-offset-2 hover:text-primary">
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}
