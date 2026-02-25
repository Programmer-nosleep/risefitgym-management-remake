import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { getApiErrorMessage } from "@/helpers/api-error"
import { requestOtp, type OtpPurpose, verifyOtp } from "@/helpers/auth.helper"
import { useAuthStore } from "@/store/auth.store"
import { useMemo, useRef, useState, type FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

function parseQuery(search: string) {
  const params = new URLSearchParams(search)
  const email = params.get("email") ?? ""
  const purpose = params.get("purpose") as OtpPurpose | null
  return { email, purpose }
}

function OtpCodeInput({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (code: string) => void
  disabled?: boolean
}) {
  const length = 6
  const digits = useMemo(() => {
    const clean = value.replace(/\D/g, "").slice(0, length)
    return Array.from({ length }, (_, i) => clean[i] ?? "")
  }, [value])

  const refs = useRef<Array<HTMLInputElement | null>>([])

  function setAt(index: number, char: string) {
    const next = digits.slice()
    next[index] = char
    onChange(next.join(""))
  }

  function focus(index: number) {
    refs.current[index]?.focus()
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {digits.map((d, i) => (
        <Input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          value={d}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, "")
            if (!raw) {
              setAt(i, "")
              return
            }

            const last = raw.slice(-1)
            setAt(i, last)
            if (i < length - 1) focus(i + 1)
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && i > 0) {
              focus(i - 1)
            }
          }}
          onPaste={(e) => {
            const raw = e.clipboardData.getData("text").replace(/\D/g, "")
            if (!raw) return
            e.preventDefault()

            const nextDigits = Array.from({ length }, (_, idx) => raw[idx] ?? "")
            onChange(nextDigits.join(""))
            const nextFocus = Math.min(raw.length, length) - 1
            if (nextFocus >= 0) focus(nextFocus)
          }}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          className={cn(
            "h-12 w-11 rounded-lg text-center text-lg font-semibold",
            "shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring",
            disabled && "opacity-70"
          )}
        />
      ))}
    </div>
  )
}

export default function VerifyOtp() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)

  const query = parseQuery(location.search)
  const state = (location.state ?? {}) as Partial<{ email: string; purpose: OtpPurpose; name?: string }>

  const email = (state.email ?? query.email ?? "").trim()
  const purpose = (state.purpose ?? query.purpose ?? "LOGIN") as OtpPurpose
  const name = state.name

  const [code, setCode] = useState("")
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setGeneralError(null)

    const emailValue = email.trim()
    const codeValue = code.replace(/\D/g, "").slice(0, 6)

    if (!emailValue) {
      setGeneralError("Missing email address. Please go back and try again.")
      return
    }

    if (codeValue.length !== 6) {
      setGeneralError("Please enter the 6-digit code.")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await verifyOtp({ email: emailValue, purpose, code: codeValue })
      setAuth({ accessToken: result.accessToken, user: result.user })
      navigate("/app", { replace: true })
    } catch (err) {
      setGeneralError(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResend() {
    setGeneralError(null)
    const emailValue = email.trim()
    if (!emailValue) {
      setGeneralError("Missing email address. Please go back and try again.")
      return
    }

    setIsResending(true)
    try {
      await requestOtp({
        email: emailValue,
        purpose,
        ...(purpose === "REGISTER" ? { name } : {}),
      })
    } catch (err) {
      setGeneralError(getApiErrorMessage(err))
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background">
      <div className="bg-size-[40px_40px] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] pointer-events-none opacity-50"></div>

      <div className="relative z-10 w-full max-w-[420px] px-4">
        <div className="rounded-2xl bg-card text-card-foreground px-8 py-10 shadow-sm border border-border">
          <div className="mb-8 flex flex-col items-center text-center">
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              Enter the code sent to{" "}
              <span className="font-semibold text-foreground">{email || "your email"}</span>
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-5">
            <OtpCodeInput value={code} onChange={setCode} disabled={isSubmitting} />

            {generalError && <p className="text-[13px] font-medium text-destructive">{generalError}</p>}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full rounded-lg bg-primary text-primary-foreground shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] border border-primary/20 hover:bg-primary/90 active:bg-primary/80 active:shadow-inner transition-all duration-200"
            >
              {isSubmitting ? "Verifying..." : "Verify"}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground font-medium">
            Can&apos;t find the email? Check your spam folder.
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleResend}
              disabled={isResending || (purpose === "REGISTER" && !name)}
              className="h-9 rounded-lg border-border bg-background text-foreground text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
            >
              {isResending ? "Resending..." : "Resend code"}
            </Button>

            <Link to={purpose === "REGISTER" ? "/register" : "/login"} className="text-xs font-medium text-foreground underline underline-offset-2 hover:text-primary">
              Back
            </Link>
          </div>

          {purpose === "REGISTER" && !name && (
            <p className="mt-3 text-[11px] text-muted-foreground">
              Resend is disabled because your name is missing. Please go back to register.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

