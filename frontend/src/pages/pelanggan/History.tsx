import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getApiErrorMessage } from "@/helpers/api-error"
import {
  listMyAttendances,
  listMyOrders,
  type Attendance,
  type OrderStatus,
  type OrderSummary,
} from "@/services/user"
import { Calendar, CreditCard, Receipt } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

function formatCurrencyIdr(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date)
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

function statusBadgeVariant(status: OrderStatus): "secondary" | "outline" | "destructive" {
  if (status === "PAID" || status === "COMPLETED") return "secondary"
  if (status === "CANCELLED" || status === "EXPIRED") return "destructive"
  return "outline"
}

function HistorySkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-56" />
      <div className="space-y-1">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
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
  )
}

export default function History() {
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const [ordersResult, attendancesResult] = await Promise.all([listMyOrders(), listMyAttendances()])
        if (cancelled) return
        setOrders(ordersResult)
        setAttendances(attendancesResult)
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

  if (isLoading && orders.length === 0 && attendances.length === 0) return <HistorySkeleton />

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
            <BreadcrumbPage>Riwayat</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Riwayat</h1>
        <p className="text-sm text-muted-foreground">Ringkasan order dan kehadiran terbaru.</p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Gagal</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="orders" className="w-full">
        <TabsList variant="line" className="w-full justify-start border-b px-0">
          <TabsTrigger value="orders" className="gap-2">
            <Receipt className="size-4" />
            Orders ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2">
            <Calendar className="size-4" />
            Attendance ({attendances.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
              <CardDescription>Riwayat order dari akun ini.</CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length ? (
                <div className="divide-y rounded-xl border bg-background">
                  {orders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between gap-3 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{o.id}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(new Date(o.createdAt))}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={statusBadgeVariant(o.status)}
                          className={
                            o.status === "PAID" || o.status === "COMPLETED"
                              ? "bg-primary/10 text-primary"
                              : undefined
                          }
                        >
                          {orderStatusLabel(o.status)}
                        </Badge>
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          <CreditCard className="size-3" />
                          {formatCurrencyIdr(o.total)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Belum ada order.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance</CardTitle>
              <CardDescription>Riwayat check-in / check-out Anda.</CardDescription>
            </CardHeader>
            <CardContent>
              {attendances.length ? (
                <div className="divide-y rounded-xl border bg-background">
                  {attendances.map((a) => (
                    <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2">
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
                        {a.locationText ? a.locationText : "—"}
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

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/app/home">Kembali</Link>
        </Button>
      </div>
    </div>
  )
}

