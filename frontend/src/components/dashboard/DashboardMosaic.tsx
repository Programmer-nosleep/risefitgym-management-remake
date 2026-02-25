import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  Dumbbell,
  LayoutGrid,
  Search,
  Settings,
  Users,
} from "lucide-react"
import type React from "react"
import { useMemo } from "react"

type DashboardMosaicProps = {
  className?: string
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function linePath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return ""
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
}

function SoftCard({
  className,
  ...props
}: React.ComponentProps<typeof Card> & { className?: string }) {
  return (
    <Card
      className={cn(
        "gap-0 rounded-3xl border-border/60 bg-card/80 py-0 shadow-[0_22px_60px_-48px_rgba(0,0,0,0.45)] backdrop-blur supports-[backdrop-filter]:bg-card/70 dark:bg-card/60 dark:shadow-[0_22px_60px_-48px_rgba(0,0,0,0.85)]",
        className
      )}
      {...props}
    />
  )
}

function MonthCalendar({ date }: { date: Date }) {
  const { monthLabel, weekdayLabels, cells } = useMemo(() => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const first = new Date(year, month, 1)
    const last = new Date(year, month + 1, 0)
    const daysInMonth = last.getDate()
    const startDay = (first.getDay() + 6) % 7

    const monthLabel = new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric",
    }).format(date)

    const weekdayLabels = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2024, 0, 1 + i)
      return new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(d)
    })

    const total = Math.ceil((startDay + daysInMonth) / 7) * 7
    const cells = Array.from({ length: total }, (_, idx) => {
      const dayNum = idx - startDay + 1
      return dayNum >= 1 && dayNum <= daysInMonth ? dayNum : null
    })

    return { monthLabel, weekdayLabels, cells }
  }, [date])

  const today = new Date()
  const isCurrentMonth =
    today.getFullYear() === date.getFullYear() && today.getMonth() === date.getMonth()

  return (
    <div className="space-y-3 px-6 py-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{monthLabel}</p>
          <p className="text-xs text-muted-foreground">Jadwal & aktivitas</p>
        </div>
        <div className="grid place-items-center rounded-2xl border bg-background/70 p-2">
          <CalendarDays className="size-4 text-muted-foreground" />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-[11px] text-muted-foreground">
        {weekdayLabels.map((d) => (
          <div key={d} className="grid place-items-center py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          const isToday = isCurrentMonth && day === today.getDate()
          return (
            <div
              key={`${day ?? "x"}-${idx}`}
              className={cn(
                "grid aspect-square place-items-center rounded-xl text-xs",
                day ? "text-foreground" : "text-muted-foreground/40",
                day && "bg-background/60",
                isToday && "bg-primary text-primary-foreground shadow-sm"
              )}
            >
              {day ?? ""}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MiniLineChart() {
  const w = 240
  const h = 96
  const padding = 10
  const values = [22, 24, 20, 28, 26, 34, 31, 42]
  const min = Math.min(...values)
  const max = Math.max(...values)

  const points = values.map((v, idx) => {
    const x = padding + (idx / (values.length - 1)) * (w - padding * 2)
    const t = (v - min) / (max - min || 1)
    const y = padding + (1 - t) * (h - padding * 2)
    return { x, y }
  })

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full">
      <defs>
        <linearGradient id="dm-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--color-chart-1)" stopOpacity="0.2" />
          <stop offset="1" stopColor="var(--color-chart-1)" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="dm-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-chart-1)" stopOpacity="0.28" />
          <stop offset="1" stopColor="var(--color-chart-1)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path
        d={`${linePath(points)} L ${w - padding} ${h - padding} L ${padding} ${
          h - padding
        } Z`}
        fill="url(#dm-fill)"
      />
      <path
        d={linePath(points)}
        fill="none"
        stroke="url(#dm-line)"
        strokeWidth="3.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {points.map((p, idx) => (
        <circle
          key={idx}
          cx={p.x}
          cy={p.y}
          r="3.5"
          fill="var(--color-chart-1)"
          opacity={idx === points.length - 1 ? 1 : 0.35}
        />
      ))}
    </svg>
  )
}

function MiniBars() {
  const bars = [34, 58, 46, 72, 62, 82, 55, 68, 90, 76, 64, 88]
  const max = Math.max(...bars)
  return (
    <div className="flex h-24 items-end gap-2">
      {bars.map((v, idx) => (
        <div
          key={idx}
          className="w-2.5 flex-1 rounded-full bg-[color:var(--color-chart-1)]"
          style={{ height: `${(v / max) * 100}%`, opacity: 0.25 + (v / max) * 0.75 }}
        />
      ))}
    </div>
  )
}

function DonutKpi() {
  const size = 120
  const r = 46
  const c = 2 * Math.PI * r
  const segments = [
    { value: 0.48, color: "var(--color-chart-1)", label: "Member" },
    { value: 0.32, color: "var(--color-chart-2)", label: "Kelas" },
    { value: 0.2, color: "var(--color-chart-3)", label: "Lainnya" },
  ]

  let offset = 0

  return (
    <div className="flex items-center gap-5">
      <div className="relative grid place-items-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--border)"
            strokeWidth="12"
            opacity="0.5"
          />
          {segments.map((s, idx) => {
            const dash = clamp(s.value, 0, 1) * c
            const dashOffset = c - offset
            offset += dash
            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={dashOffset}
              />
            )
          })}
        </svg>
        <div className="absolute text-center">
          <p className="text-2xl font-semibold">365</p>
          <p className="text-xs text-muted-foreground">hari</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">Komposisi</p>
        <ul className="space-y-1 text-sm">
          {segments.map((s) => (
            <li key={s.label} className="flex items-center gap-2">
              <span
                className="inline-block size-2.5 rounded-full"
                style={{ background: s.color }}
              />
              <span className="text-muted-foreground">{s.label}</span>
              <span className="ml-auto font-medium">{Math.round(s.value * 100)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function DashboardMosaic({ className }: DashboardMosaicProps) {
  const now = useMemo(() => new Date(), [])

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2rem] border bg-gradient-to-br from-background via-muted/30 to-background p-4 sm:p-6",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-28 -top-32 size-[26rem] rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-40 size-[32rem] rounded-full bg-[color:var(--color-chart-2)] blur-3xl opacity-20 dark:opacity-10"
      />

      <div className="relative space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-lg font-semibold leading-tight">Dashboard</p>
            <p className="text-sm text-muted-foreground">Ringkasan cepat untuk hari ini.</p>
          </div>

          <div className="flex w-full gap-2 md:w-auto">
            <div className="relative w-full md:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari member, kelas, transaksi…"
                className="h-10 rounded-2xl bg-background/70 pl-9"
              />
            </div>
            <Button className="h-10 rounded-2xl">Aksi</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <SoftCard className="lg:col-span-3">
            <div className="px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Menu</p>
                  <p className="text-xs text-muted-foreground">Navigasi cepat</p>
                </div>
                <div className="grid place-items-center rounded-2xl border bg-background/70 p-2">
                  <LayoutGrid className="size-4 text-muted-foreground" />
                </div>
              </div>

              <div className="mt-5 grid gap-2">
                {[
                  { icon: BarChart3, label: "Laporan" },
                  { icon: Users, label: "Member" },
                  { icon: Dumbbell, label: "Kelas" },
                  { icon: CreditCard, label: "Pembayaran" },
                  { icon: Settings, label: "Pengaturan" },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-2xl border bg-background/60 px-3 py-2 text-left text-sm transition hover:bg-background"
                  >
                    <item.icon className="size-4 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    <span className="text-xs text-muted-foreground">›</span>
                  </button>
                ))}
              </div>
            </div>
          </SoftCard>

          <SoftCard className="lg:col-span-5">
            <div className="px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Total pemasukan</p>
                  <p className="text-xs text-muted-foreground">30 hari terakhir</p>
                </div>
                <Badge variant="secondary" className="rounded-2xl">
                  +12.9%
                </Badge>
              </div>

              <div className="mt-5 grid gap-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-3xl font-semibold leading-none">Rp 13,69jt</p>
                    <p className="mt-1 text-xs text-muted-foreground">Rata-rata harian Rp 456rb</p>
                  </div>
                  <div className="grid place-items-center rounded-2xl border bg-background/70 p-2">
                    <BarChart3 className="size-4 text-muted-foreground" />
                  </div>
                </div>

                <MiniBars />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                </div>
              </div>
            </div>
          </SoftCard>

          <SoftCard className="lg:col-span-4">
            <div className="px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Revenue</p>
                  <p className="text-xs text-muted-foreground">Minggu ini</p>
                </div>
                <Badge className="rounded-2xl">+2.458</Badge>
              </div>
              <div className="mt-4">
                <MiniLineChart />
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
            </div>
          </SoftCard>

          <SoftCard className="lg:col-span-4">
            <MonthCalendar date={now} />
          </SoftCard>

          <SoftCard className="lg:col-span-5">
            <div className="px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Kelas hari ini</p>
                  <p className="text-xs text-muted-foreground">Jadwal yang akan berlangsung</p>
                </div>
                <Badge variant="outline" className="rounded-2xl text-muted-foreground">
                  3 kelas
                </Badge>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  { time: "07:00", title: "Strength Basic", coach: "Coach A" },
                  { time: "12:30", title: "Mobility Flow", coach: "Coach B" },
                  { time: "18:00", title: "HIIT Express", coach: "Coach C" },
                ].map((c) => (
                  <div
                    key={c.title}
                    className="flex items-center justify-between gap-3 rounded-2xl border bg-background/60 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{c.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.time} • {c.coach}
                      </p>
                    </div>
                    <Button variant="secondary" className="h-8 rounded-2xl px-3">
                      Detail
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </SoftCard>

          <SoftCard className="lg:col-span-6">
            <div className="px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Analitik</p>
                  <p className="text-xs text-muted-foreground">Distribusi aktivitas</p>
                </div>
                <Badge variant="secondary" className="rounded-2xl">
                  updated
                </Badge>
              </div>

              <div className="mt-5">
                <DonutKpi />
              </div>
            </div>
          </SoftCard>

          <SoftCard className="lg:col-span-6">
            <div className="px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Admin</p>
                  <p className="text-xs text-muted-foreground">Aksi cepat</p>
                </div>
                <Avatar className="size-9 border">
                  <AvatarFallback className="bg-primary/10 text-primary">RF</AvatarFallback>
                </Avatar>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Button variant="secondary" className="h-10 rounded-2xl">
                  Tambah member
                </Button>
                <Button variant="secondary" className="h-10 rounded-2xl">
                  Buat kelas
                </Button>
                <Button variant="secondary" className="h-10 rounded-2xl">
                  Buat invoice
                </Button>
                <Button className="h-10 rounded-2xl">Lihat laporan</Button>
                <Button className="h-10 rounded-2xl">Export</Button>
                <Button variant="outline" className="h-10 rounded-2xl">
                  Settings
                </Button>
              </div>
            </div>
          </SoftCard>
        </div>
      </div>
    </div>
  )
}
