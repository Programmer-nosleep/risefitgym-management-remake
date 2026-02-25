import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { getApiErrorMessage } from "@/helpers/api-error"
import { getMyProfileDashboard, type ProfileDashboard } from "@/services/user"
import {
  Calendar,
  CalendarCheck2,
  Clock,
  PackageSearch,
  Receipt,
  Sparkles,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

type MembershipStatus = "ACTIVE" | "EXPIRED" | "CANCELLED"

function initialsFromName(name: string) {
  const cleaned = name.trim()
  if (!cleaned) return "R"

  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()

  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase()
}

function formatCurrencyIdr(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatMonthYear(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric" }).format(date)
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function formatRelativeFromNow(date: Date) {
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60_000)

  if (diffMinutes < 1) return "baru saja"
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} jam lalu`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return "kemarin"
  return `${diffDays} hari lalu`
}

function membershipStatusPill(status: MembershipStatus) {
  switch (status) {
    case "ACTIVE":
      return { label: "Active", className: "border-emerald-200 bg-emerald-500/10 text-emerald-700" }
    case "EXPIRED":
      return { label: "Expired", className: "border-border bg-muted text-muted-foreground" }
    case "CANCELLED":
      return { label: "Cancelled", className: "border-destructive/20 bg-destructive/10 text-destructive" }
  }
}

function HomeUserSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-56" />

      <div className="space-y-1">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-96" />
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <div className="relative px-6 py-6">
          <Skeleton className="absolute inset-0 rounded-none" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="size-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-4 w-56" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-32" />
            </div>
          </div>
        </div>
        <Separator />
        <div className="grid gap-3 px-6 py-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function HomeUser() {
  const [profile, setProfile] = useState<ProfileDashboard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const result = await getMyProfileDashboard()
        if (!cancelled) setProfile(result)
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  const activityItems = useMemo(() => {
    if (!profile) return []

    const attendances = profile.recentAttendances.map((a) => ({
      id: a.id,
      type: "attendance" as const,
      at: a.checkInAt,
      title: "Check-in",
      description: a.checkOutAt ? "Sesi selesai (check-out tercatat)." : "Sedang berjalan / belum check-out.",
      icon: Calendar,
    }))

    const orders = profile.recentOrders.map((o) => ({
      id: o.id,
      type: "order" as const,
      at: o.createdAt,
      title: "Order",
      description: `Total ${formatCurrencyIdr(o.total)}.`,
      icon: Receipt,
    }))

    return [...attendances, ...orders].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  }, [profile])

  if (isLoading && !profile) return <HomeUserSkeleton />

  const user = profile?.user
  const activeMembership = profile?.activeMembership ?? null
  const membershipPill = activeMembership ? membershipStatusPill(activeMembership.status as MembershipStatus) : null
  const joinedAt = user?.createdAt ? new Date(user.createdAt) : null
  const lastAttendanceAt = profile?.lastAttendanceAt ? new Date(profile.lastAttendanceAt) : null

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/app">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Overview</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Pelanggan</h1>
        <p className="text-sm text-muted-foreground">
          Selamat datang kembali. Pantau membership, transaksi, dan aktivitas Anda.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Gagal memuat data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="gap-0 overflow-hidden py-0">
        <div className="relative px-6 py-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar size="lg" className="ring-1 ring-border">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                  {initialsFromName(user?.name ?? "R")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm text-muted-foreground">Hi,</p>
                  <p className="truncate text-lg font-semibold">{user?.name ?? "—"}</p>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    <Sparkles className="size-3" />
                    Member
                  </Badge>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {activeMembership && membershipPill ? (
                    <Badge variant="outline" className={membershipPill.className}>
                      <span className="inline-block size-1.5 rounded-full bg-current opacity-60" />
                      {membershipPill.label}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      No membership
                    </Badge>
                  )}

                  {joinedAt ? (
                    <span className="text-xs text-muted-foreground">
                      Bergabung {formatMonthYear(joinedAt)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link to="/app/view">
                  <PackageSearch className="size-4" />
                  Lihat barang
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/app/booking">
                  <CalendarCheck2 className="size-4" />
                  Booking
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid gap-3 px-6 py-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-xl border bg-background/60 px-3 py-2">
            <Receipt className="size-4 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Paid orders</p>
              <p className="truncate text-sm font-semibold">
                {profile ? String(profile.stats.paidOrdersCount) : "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border bg-background/60 px-3 py-2">
            <Receipt className="size-4 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Total spent</p>
              <p className="truncate text-sm font-semibold">
                {profile ? formatCurrencyIdr(profile.stats.totalSpent) : "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border bg-background/60 px-3 py-2">
            <Calendar className="size-4 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Attendances</p>
              <p className="truncate text-sm font-semibold">
                {profile ? String(profile.stats.attendancesCount) : "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border bg-background/60 px-3 py-2">
            <Clock className="size-4 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Last attendance</p>
              <p className="truncate text-sm font-semibold">
                {lastAttendanceAt ? formatRelativeFromNow(lastAttendanceAt) : "—"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Aktivitas terbaru</CardTitle>
            <CardDescription>Ringkasan aktivitas terakhir Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            {activityItems.length ? (
              <ul className="divide-y">
                {activityItems.slice(0, 6).map((item) => (
                  <li key={`${item.type}-${item.id}`} className="flex gap-3 py-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                      <item.icon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <time className="shrink-0 text-xs text-muted-foreground">
                      {formatDateTime(new Date(item.at))}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada aktivitas.</p>
            )}

            <div className="mt-4">
              <Button asChild variant="outline" size="sm">
                <Link to="/app/history">Lihat semua riwayat</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Membership</CardTitle>
            <CardDescription>Status membership Anda saat ini.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeMembership ? (
              <div className="rounded-xl border bg-background p-4">
                <p className="text-sm font-semibold">{activeMembership.membership.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Berlaku sampai{" "}
                  <span className="font-medium text-foreground">
                    {formatDateTime(new Date(activeMembership.endDate))}
                  </span>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {membershipPill ? (
                    <Badge variant="outline" className={membershipPill.className}>
                      {membershipPill.label}
                    </Badge>
                  ) : null}
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {formatCurrencyIdr(activeMembership.membership.price)}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border bg-background p-4">
                <p className="text-sm font-semibold">Belum ada membership</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pilih paket membership untuk mulai latihan dan akses fitur lengkap.
                </p>
              </div>
            )}

            <Button asChild className="w-full" size="sm">
              <Link to="/app/booking">Pilih paket</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
