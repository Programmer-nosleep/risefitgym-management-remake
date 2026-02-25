import BrandLogo from "@/components/BrandLogo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Sparkles,
} from "lucide-react"
import { Link } from "react-router-dom"

type Program = {
  tag: string
  title: string
  description: string
  imageUrl: string
  highlight?: boolean
}

type Plan = {
  label: string
  name: string
  price: number
  features: string[]
  featured?: boolean
}

type Testimonial = {
  name: string
  role: string
  quote: string
  imageUrl: string
}

const heroImageUrl =
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=2200&q=80"

const aboutImages = [
  "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?auto=format&fit=crop&w=1400&q=80",
]

const programs: Program[] = [
  {
    tag: "HIIT",
    title: "Ignite",
    description:
      "High-intensity interval training to burn fat and boost endurance.",
    imageUrl:
      "https://images.unsplash.com/photo-1517832606294-7e0c9a0d4d55?auto=format&fit=crop&w=1200&q=80",
    highlight: true,
  },
  {
    tag: "Strength",
    title: "Evolution",
    description:
      "Progressive resistance training for muscle growth and total-body strength.",
    imageUrl:
      "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    tag: "Flow & Restore",
    title: "Balance",
    description:
      "Mobility-focused sessions to enhance flexibility and mindful recovery.",
    imageUrl:
      "https://images.unsplash.com/photo-1554344058-2d2d7f5f2a57?auto=format&fit=crop&w=1200&q=80",
  },
]

const plans: Plan[] = [
  {
    label: "Basic Plan",
    name: "Starting Simple",
    price: 167,
    features: ["Gym Access", "Cardio Zone", "Locker Room"],
  },
  {
    label: "Complete Plan",
    name: "Fitness Full Club",
    price: 197,
    features: ["All Areas", "Group Classes", "Trainer Check-ins"],
    featured: true,
  },
  {
    label: "Special Plan",
    name: "PRO Wellness",
    price: 277,
    features: ["All Access", "Recovery Sessions", "Nutrition Support"],
  },
]

const testimonials: Testimonial[] = [
  {
    name: "Jane Cooper",
    role: "Premium Member",
    quote:
      "The classes are engaging, the trainers are top-notch, and the energy here is unbeatable. I feel stronger and more confident than ever!",
    imageUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Cody Fisher",
    role: "Member",
    quote:
      "I love how flexible the plans are. I can mix strength, HIIT, and recovery without feeling overwhelmed.",
    imageUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section id="home" className="relative overflow-hidden bg-zinc-950">
        <div className="absolute inset-0">
          <img
            src={heroImageUrl}
            alt=""
            className="h-full w-full object-cover opacity-80"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/35 to-black/75" />
        </div>

        <header className="relative z-10">
          <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-6 md:px-6">
            <div className="flex items-center gap-3">
              <BrandLogo className="h-9" />
              <div className="hidden items-center gap-2 text-white sm:flex">
                <Sparkles className="size-4 text-yellow-300" />
                <span className="font-[var(--font-display)] text-sm font-semibold tracking-wide">
                  RiseFit
                </span>
              </div>
            </div>

            <div className="hidden items-center gap-3 rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur lg:flex">
              <nav className="flex items-center gap-1 text-white/85">
                {[
                  ["Home", "#home"],
                  ["About", "#about"],
                  ["Programs", "#programs"],
                  ["Plans", "#plans"],
                  ["Reviews", "#reviews"],
                ].map(([label, href]) => (
                  <a
                    key={href}
                    href={href}
                    className="rounded-full px-3 py-2 text-sm hover:bg-white/10 hover:text-white"
                  >
                    {label}
                  </a>
                ))}
              </nav>
              <div className="h-7 w-px bg-white/15" />
              <Button
                asChild
                size="sm"
                className="rounded-full bg-yellow-300 text-zinc-900 hover:bg-yellow-200"
              >
                <Link to="/register">Enroll</Link>
              </Button>
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
              >
                <Link to="/login">Login</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="rounded-full bg-yellow-300 text-zinc-900 hover:bg-yellow-200"
              >
                <Link to="/register">Enroll</Link>
              </Button>
            </div>
          </div>
        </header>

        <div className="relative z-10">
          <div className="mx-auto max-w-screen-2xl px-4 pb-16 pt-10 md:px-6 md:pb-24 md:pt-14">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
              <div className="space-y-6 lg:col-span-7">
                <p className="text-xs tracking-[0.28em] text-white/70">
                  YOUR FITNESS JOURNEY STARTS HERE
                </p>
                <h1 className="max-w-2xl font-[var(--font-display)] text-4xl leading-[1.05] text-white sm:text-5xl md:text-6xl">
                  More Than a Gym—A Community That Drives You
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    asChild
                    className="h-11 rounded-full bg-yellow-300 px-6 text-zinc-900 hover:bg-yellow-200"
                  >
                    <Link to="/register">
                      Enroll Now <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 rounded-full border-white/25 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white"
                  >
                    <a href="#about">Visit us</a>
                  </Button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {["bg-white", "bg-yellow-200", "bg-emerald-200", "bg-sky-200"].map(
                        (bg, idx) => (
                          <div
                            key={bg}
                            className={cn(
                              "size-8 rounded-full ring-2 ring-black/30",
                              bg
                            )}
                            style={{ zIndex: 10 - idx }}
                          />
                        )
                      )}
                    </div>
                    <div className="text-white">
                      <p className="text-sm font-semibold">10K+ Membership</p>
                      <p className="text-xs text-white/70">Enjoy our programs</p>
                    </div>
                  </div>
                  <div className="hidden items-center gap-2 text-xs text-white/70 sm:flex">
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-3 py-1.5">
                      <Check className="size-3 text-yellow-300" />
                      Coach-led
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-3 py-1.5">
                      <Check className="size-3 text-yellow-300" />
                      Flexible plans
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 lg:flex lg:justify-end">
                <div className="relative w-full max-w-md lg:translate-y-[-12px]">
                  <div className="rounded-3xl border border-white/10 bg-white/85 p-4 shadow-2xl backdrop-blur">
                    <div className="flex items-center gap-2 rounded-2xl bg-zinc-900 px-3 py-2 text-xs text-white">
                      <MapPin className="size-4 text-yellow-300" />
                      <span className="truncate">
                        2715 Ash Dr, San Jose, South Dakota 83475
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {[
                        ["Monday", "10:00 AM", "02:00 PM", "4h"],
                        ["Friday", "08:00 AM", "12:00 PM", "4h"],
                      ].map(([day, start, end, duration]) => (
                        <div
                          key={day}
                          className="rounded-2xl bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-[var(--font-display)] text-sm font-semibold text-zinc-900">
                              {day}
                            </p>
                            <span className="rounded-full bg-yellow-200 px-2 py-1 text-xs font-semibold text-zinc-900">
                              {duration}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="text-[10px] font-medium tracking-wider text-zinc-500">
                                START
                              </p>
                              <p className="mt-0.5 font-semibold text-zinc-900">
                                {start}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-medium tracking-wider text-zinc-500">
                                END
                              </p>
                              <p className="mt-0.5 font-semibold text-zinc-900">
                                {end}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pointer-events-none absolute -bottom-8 left-0 right-0 hidden h-20 bg-linear-to-b from-transparent to-zinc-950 lg:block" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-screen-2xl px-4 py-16 md:px-6">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            <p className="text-xs tracking-[0.28em] text-muted-foreground">
              WHO WE ARE
            </p>
            <h2 className="mt-3 max-w-md font-[var(--font-display)] text-3xl leading-tight sm:text-4xl">
              A chill way to change things up.
            </h2>
          </div>

          <div className="space-y-4 lg:col-span-7">
            <p className="text-sm font-medium">It&apos;s that simple: your new gym.</p>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Keeping things simple is key to a routine that boosts your
              physical, social, mental, and emotional health. With coach-led
              sessions, thoughtful programming, and friendly community vibes,
              training becomes the best part of your week.
            </p>

            <div className="grid gap-4 pt-4 sm:grid-cols-2">
              {aboutImages.map((src) => (
                <div
                  key={src}
                  className="group relative overflow-hidden rounded-3xl bg-muted"
                >
                  <img
                    src={src}
                    alt=""
                    className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-linear-to-tr from-black/15 via-transparent to-transparent" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="programs" className="bg-muted/30">
        <div className="mx-auto max-w-screen-2xl px-4 py-16 md:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs tracking-[0.28em] text-muted-foreground">
                FIND YOUR PERFECT WORKOUT PROGRAM
              </p>
              <h2 className="mt-3 font-[var(--font-display)] text-3xl leading-tight sm:text-4xl">
                Custom fitness plans for your goals—strength, endurance, or
                balance.
              </h2>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-background/70 backdrop-blur"
                aria-label="Previous"
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-background/70 backdrop-blur"
                aria-label="Next"
              >
                <ChevronRight />
              </Button>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {programs.map((p) => (
              <div
                key={p.title}
                className={cn(
                  "group overflow-hidden rounded-3xl border bg-background shadow-sm transition-shadow hover:shadow-md",
                  p.highlight && "border-yellow-200 bg-yellow-200"
                )}
              >
                <div className="p-4 pb-0">
                  <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
                    <img
                      src={p.imageUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
                <div className="p-5">
                  <p
                    className={cn(
                      "text-xs font-semibold tracking-[0.28em]",
                      p.highlight ? "text-zinc-900/70" : "text-muted-foreground"
                    )}
                  >
                    {p.tag}
                  </p>
                  <h3
                    className={cn(
                      "mt-2 font-[var(--font-display)] text-xl",
                      p.highlight ? "text-zinc-900" : "text-foreground"
                    )}
                  >
                    {p.title}
                  </h3>
                  <p
                    className={cn(
                      "mt-2 text-sm leading-relaxed",
                      p.highlight ? "text-zinc-900/70" : "text-muted-foreground"
                    )}
                  >
                    {p.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="plans" className="mx-auto max-w-screen-2xl px-4 py-16 md:px-6">
        <div className="text-center">
          <p className="text-xs tracking-[0.28em] text-muted-foreground">
            DISCOVER OUR PLANS
          </p>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl sm:text-4xl">
            Flexible Plans for Every Fitness Goal
          </h2>
        </div>

        <div className="mx-auto mt-10 max-w-3xl space-y-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "rounded-3xl border bg-background p-5 shadow-sm",
                plan.featured && "border-zinc-900 bg-zinc-900 text-white"
              )}
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-xs font-semibold tracking-[0.28em]",
                      plan.featured ? "text-white/70" : "text-muted-foreground"
                    )}
                  >
                    {plan.label}
                  </p>
                  <h3 className="mt-2 font-[var(--font-display)] text-2xl">
                    {plan.name}
                  </h3>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {plan.features.map((f) => (
                      <span
                        key={f}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
                          plan.featured
                            ? "bg-white/10 text-white"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Check className="size-3" />
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-end justify-between gap-4 sm:flex-col sm:items-end">
                  <div className="text-right">
                    <div className="font-[var(--font-display)] text-4xl font-semibold leading-none">
                      {plan.price}
                    </div>
                    <div
                      className={cn(
                        "mt-1 text-xs font-medium",
                        plan.featured ? "text-white/70" : "text-muted-foreground"
                      )}
                    >
                      / month
                    </div>
                  </div>

                  <Button
                    asChild
                    className={cn(
                      "rounded-full",
                      plan.featured
                        ? "bg-yellow-300 text-zinc-900 hover:bg-yellow-200"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    <Link to="/register">Enroll</Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="reviews" className="bg-muted/30">
        <div className="mx-auto max-w-screen-2xl px-4 py-16 md:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs tracking-[0.28em] text-muted-foreground">
                WHAT THEY SAY ABOUT US
              </p>
              <h2 className="mt-3 font-[var(--font-display)] text-3xl leading-tight sm:text-4xl">
                We let our work speak for itself, but we value client feedback
                too.
              </h2>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-background/70 backdrop-blur"
                aria-label="Previous testimonial"
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-background/70 backdrop-blur"
                aria-label="Next testimonial"
              >
                <ChevronRight />
              </Button>
            </div>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="grid gap-5 rounded-3xl border bg-background p-6 shadow-sm sm:grid-cols-[160px_1fr]"
              >
                <div className="overflow-hidden rounded-2xl bg-muted">
                  <img
                    src={t.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-5">
                    <p className="font-[var(--font-display)] text-sm font-semibold">
                      {t.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2">
              <Sparkles className="size-4 text-yellow-400" />
              Coach-led sessions
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2">
              <Sparkles className="size-4 text-yellow-400" />
              Premium equipment
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2">
              <Sparkles className="size-4 text-yellow-400" />
              Friendly community
            </span>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-screen-2xl px-4 py-10 text-center md:px-6">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} RiseFit. Built with shadcn/ui.
        </p>
      </footer>
    </div>
  )
}

