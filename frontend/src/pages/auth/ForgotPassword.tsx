import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getApiErrorMessage } from "@/helpers/api-error"
import { requestOtp } from "@/helpers/auth.helper"
import { cn } from "@/lib/utils"
import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

export default function ForgotPassword() {
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [emailError, setEmailError] = useState<string | null>(null)
    const [generalError, setGeneralError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        setEmailError(null)
        setGeneralError(null)

        const emailValue = email.trim()

        if (!emailValue) {
            setEmailError("Please enter a valid email address")
            return
        }

        setIsSubmitting(true)
        try {
            await requestOtp({ email: emailValue, purpose: "LOGIN" })
            const params = new URLSearchParams({ email: emailValue, purpose: "LOGIN" })
            navigate(`/verify-otp?${params.toString()}`, {
                state: { email: emailValue, purpose: "LOGIN" },
            })
        } catch (err) {
            setGeneralError(getApiErrorMessage(err))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-background">
            <div className="bg-size-[40px_40px] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] pointer-events-none opacity-50"></div>

            <div className="relative z-10 w-full max-w-[400px] px-4">
                <div className="rounded-2xl bg-card text-card-foreground px-8 py-10 shadow-sm border border-border">

                    <div className="mb-8 flex flex-col items-center text-center">
                        <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
                            Forgot Password
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Enter your email address to receive a reset link.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
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
                                onChange={(e) => { setEmail(e.target.value); setEmailError(null) }}
                                placeholder="Enter your Email"
                                autoComplete="email"
                                className={cn(
                                    "h-11 rounded-lg border-input bg-background text-foreground shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring",
                                    emailError && "border-destructive focus-visible:ring-destructive/50"
                                )}
                            />
                            {emailError && <p className="text-[11px] text-destructive">{emailError}</p>}
                        </div>

                        {generalError && (
                            <p className="text-[13px] font-medium text-destructive">{generalError}</p>
                        )}

                        <Button
                            type="submit"
                            className="mt-6 h-11 w-full rounded-lg bg-primary text-primary-foreground shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] border border-primary/20 hover:bg-primary/90 active:bg-primary/80 active:shadow-inner transition-all duration-200"
                        >
                            {isSubmitting ? "Sending..." : "Send Reset Link"}
                        </Button>
                    </form>

                    <p className="mt-8 text-center text-xs text-muted-foreground font-medium">
                        Remember your password?{" "}
                        <Link to="/login" className="text-foreground underline underline-offset-2 hover:text-primary">
                            Back to Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
