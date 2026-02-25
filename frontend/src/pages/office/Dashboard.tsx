import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getApiErrorMessage } from "@/helpers/api-error"
import type { Role } from "@/route/app-nav"
import {
  getMyProfileDashboard,
  type OrderStatus,
  type ProfileDashboard,
} from "@/services/user"
import {
  Calendar,
  Clock,
  CreditCard,
  DoorOpen,
  GraduationCap,
  Pencil,
  Receipt,
  ShieldCheck,
  UserRound,
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

function roleLabel(role: Role) {
  switch (role) {
    case "ADMIN":
      return "Admin"
    case "BACKOFFICE":
      return "Backoffice"
    default:
      return "User"
  }
}

function orderStatusLabel(status: OrderStatus) {
  switch (status) {
    case "PENDING":
      return "Pending"
    case "PAID":
      return "Paid"
    case "COMPLETED":
      return "Completed"
    case "CANCELLED":
      return "Cancelled"
    case "EXPIRED":
      return "Expired"
  }
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

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-80" />
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <div className="relative px-6 py-6">
          <Skeleton className="absolute inset-0 rounded-none" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <Skeleton className="size-14 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-52" />
                <Skeleton className="h-4 w-40" />
                <div className="flex gap-3 pt-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            </div>
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
        <Separator />
        <div className="grid gap-3 px-6 py-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-52" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <Skeleton className="h-9 w-72" />
        <Card>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function Dashboard() {
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
      icon: DoorOpen,
    }))

    const orders = profile.recentOrders.map((o) => ({
      id: o.id,
      type: "order" as const,
      at: o.createdAt,
      title: `Order ${orderStatusLabel(o.status)}`,
      description: `Total ${formatCurrencyIdr(o.total)}.`,
      icon: o.status === "PAID" || o.status === "COMPLETED" ? CreditCard : Receipt,
    }))

    return [...attendances, ...orders].sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
    )
  }, [profile])

  if (isLoading && !profile) return <DashboardSkeleton />

  const user = profile?.user
  const activeMembership = profile?.activeMembership ?? null
  const membershipPill = activeMembership ? membershipStatusPill(activeMembership.status as MembershipStatus) : null
  const joinedAt = user?.createdAt ? new Date(user.createdAt) : null
  const lastAttendanceAt = profile?.lastAttendanceAt ? new Date(profile.lastAttendanceAt) : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            {user?.role ? <Badge variant="secondary">{roleLabel(user.role)}</Badge> : null}
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/app/profile">
              <Pencil className="size-4" />
              Edit profile
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">
          Ringkasan profil, program, dan aktivitas terbaru.
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
          <div className="absolute inset-0 bg-linear-to-br from-primary/15 via-primary/5 to-transparent" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="size-14 ring-1 ring-border">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                  {initialsFromName(user?.name ?? "R")}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold">{user?.name ?? "—"}</h2>

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
                </div>

                <p className="text-muted-foreground text-sm">{user?.email ?? "—"}</p>

                <div className="mt-3 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="size-4" />
                    {joinedAt ? `Bergabung ${formatMonthYear(joinedAt)}` : "—"}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="size-4" />
                    {lastAttendanceAt
                      ? `Terakhir hadir ${formatRelativeFromNow(lastAttendanceAt)}`
                      : "Belum ada attendance"}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeMembership ? (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  <GraduationCap className="size-3" />
                  {activeMembership.membership.name}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid gap-3 px-6 py-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border bg-background/60 px-3 py-2">
            <ShieldCheck className="size-4 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="truncate text-sm font-medium">
                {user?.role ? roleLabel(user.role) : "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border bg-background/60 px-3 py-2">
            <CreditCard className="size-4 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Total spent</p>
              <p className="truncate text-sm font-medium">
                {profile ? formatCurrencyIdr(profile.stats.totalSpent) : "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border bg-background/60 px-3 py-2">
            <Receipt className="size-4 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Paid orders</p>
              <p className="truncate text-sm font-medium">
                {profile ? String(profile.stats.paidOrdersCount) : "—"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Programs</CardTitle>
            <CardDescription>Membership aktif dan ringkasan periode.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="gap-3 py-4 shadow-none">
                <CardHeader className="px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        {activeMembership?.membership.name ?? "Belum ada program"}
                      </CardTitle>
                      <CardDescription>
                        {activeMembership?.membership.description ??
                          "Daftarkan membership untuk mulai latihan."}
                      </CardDescription>
                    </div>
                    {activeMembership && membershipPill ? (
                      <Badge variant="outline" className={membershipPill.className}>
                        {membershipPill.label}
                      </Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="px-4">
                  <div className="grid gap-1 text-sm text-muted-foreground">
                    <p>
                      Periode:{" "}
                      <span className="font-medium text-foreground">
                        {activeMembership
                          ? `${formatDateTime(new Date(activeMembership.startDate))} – ${formatDateTime(
                            new Date(activeMembership.endDate)
                          )}`
                          : "—"}
                      </span>
                    </p>
                    <p>
                      Harga:{" "}
                      <span className="font-medium text-foreground">
                        {activeMembership
                          ? formatCurrencyIdr(activeMembership.membership.price)
                          : "—"}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="gap-3 py-4 shadow-none">
                <CardHeader className="px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-base">Aktivitas</CardTitle>
                      <CardDescription>Ringkasan attendance dan order.</CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      <UserRound className="size-3" />
                      {profile ? String(profile.stats.attendancesCount) : "—"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-4">
                  <div className="grid gap-2 text-sm text-muted-foreground">
                    <p>
                      Attendance total:{" "}
                      <span className="font-medium text-foreground">
                        {profile ? String(profile.stats.attendancesCount) : "—"}
                      </span>
                    </p>
                    <p>
                      Orders total:{" "}
                      <span className="font-medium text-foreground">
                        {profile ? String(profile.stats.ordersCount) : "—"}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ringkasan</CardTitle>
            <CardDescription>Statistik singkat untuk akun ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="flex items-center justify-between rounded-xl border bg-background px-3 py-2">
                <p className="text-xs text-muted-foreground">Orders</p>
                <p className="text-sm font-semibold">
                  {profile ? String(profile.stats.ordersCount) : "—"}
                </p>
              </div>
              <div className="flex items-center justify-between rounded-xl border bg-background px-3 py-2">
                <p className="text-xs text-muted-foreground">Paid orders</p>
                <p className="text-sm font-semibold">
                  {profile ? String(profile.stats.paidOrdersCount) : "—"}
                </p>
              </div>
              <div className="flex items-center justify-between rounded-xl border bg-background px-3 py-2">
                <p className="text-xs text-muted-foreground">Total spent</p>
                <p className="text-sm font-semibold">
                  {profile ? formatCurrencyIdr(profile.stats.totalSpent) : "—"}
                </p>
              </div>
              <div className="flex items-center justify-between rounded-xl border bg-background px-3 py-2">
                <p className="text-xs text-muted-foreground">Attendances</p>
                <p className="text-sm font-semibold">
                  {profile ? String(profile.stats.attendancesCount) : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity" className="w-full">
        <TabsList variant="line" className="w-full justify-start border-b px-0">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <CardDescription>Gabungan attendance dan order terbaru.</CardDescription>
            </CardHeader>
            <CardContent>
              {activityItems.length ? (
                <ul className="divide-y">
                  {activityItems.map((item) => (
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
              <CardDescription>Order terbaru dan total pengeluaran.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border bg-background px-3 py-2">
                  <p className="text-xs text-muted-foreground">Total spent</p>
                  <p className="text-base font-semibold">
                    {profile ? formatCurrencyIdr(profile.stats.totalSpent) : "—"}
                  </p>
                </div>
                <div className="rounded-xl border bg-background px-3 py-2">
                  <p className="text-xs text-muted-foreground">Paid orders</p>
                  <p className="text-base font-semibold">
                    {profile ? String(profile.stats.paidOrdersCount) : "—"}
                  </p>
                </div>
                <div className="rounded-xl border bg-background px-3 py-2">
                  <p className="text-xs text-muted-foreground">All orders</p>
                  <p className="text-base font-semibold">
                    {profile ? String(profile.stats.ordersCount) : "—"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Recent orders</p>
                {profile?.recentOrders?.length ? (
                  <div className="divide-y rounded-xl border bg-background">
                    {profile.recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between gap-3 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {orderStatusLabel(order.status)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(new Date(order.createdAt))}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold">
                          {formatCurrencyIdr(order.total)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Belum ada order.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance</CardTitle>
              <CardDescription>Riwayat check-in terbaru.</CardDescription>
            </CardHeader>
            <CardContent>
              {profile?.recentAttendances?.length ? (
                <div className="divide-y rounded-xl border bg-background">
                  {profile.recentAttendances.map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-3 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          Check-in {formatDateTime(new Date(a.checkInAt))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.checkOutAt
                            ? `Check-out ${formatDateTime(new Date(a.checkOutAt))}`
                            : "Belum check-out"}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-muted-foreground">
                        {formatRelativeFromNow(new Date(a.checkInAt))}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Belum ada data attendance.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

