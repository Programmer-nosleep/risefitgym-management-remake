import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getApiErrorMessage } from "@/helpers/api-error"
import { listAllOrders, type OrderSummaryAdmin } from "@/services/admin"
import { getInvoiceByOrder, getOrder, type Invoice, type OrderDetail, type OrderStatus } from "@/services/user"
import { Eye, FileText, RefreshCcw } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

type OrderFilter = "DONE" | "PENDING" | "CANCELLED" | "EXPIRED" | "ALL"

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

function PurchasingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-80" />
      </div>

      <Skeleton className="h-9 w-72" />

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function Purchasing() {
  const [orders, setOrders] = useState<OrderSummaryAdmin[]>([])
  const [filter, setFilter] = useState<OrderFilter>("DONE")
  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)
  const [isOrderLoading, setIsOrderLoading] = useState(false)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [invoiceLoading, setInvoiceLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const result = await listAllOrders()
        if (!cancelled) setOrders(result)
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

  async function refresh() {
    setIsRefreshing(true)
    setError(null)
    try {
      const result = await listAllOrders()
      setOrders(result)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsRefreshing(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const byFilter = orders.filter((o) => {
      if (filter === "ALL") return true
      if (filter === "DONE") return o.status === "PAID" || o.status === "COMPLETED"
      return o.status === filter
    })

    if (!q) return byFilter
    return byFilter.filter((o) => {
      const haystack = `${o.id} ${o.user.name} ${o.user.email}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [orders, filter, query])

  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status === "PAID" || o.status === "COMPLETED")
      .reduce((sum, o) => sum + o.total, 0)
  }, [orders])

  async function openOrder(orderId: string) {
    setSheetOpen(true)
    setSelectedOrder(null)
    setInvoice(null)
    setIsOrderLoading(true)
    setError(null)
    setMessage(null)

    try {
      const result = await getOrder(orderId)
      setSelectedOrder(result)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsOrderLoading(false)
    }
  }

  async function loadInvoiceForSelectedOrder() {
    if (!selectedOrder) return

    setInvoiceLoading(true)
    setError(null)
    setMessage(null)
    try {
      const result = await getInvoiceByOrder(selectedOrder.id)
      setInvoice(result)
      setMessage("Invoice berhasil diambil/dibuat.")
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setInvoiceLoading(false)
    }
  }

  if (isLoading && orders.length === 0) return <PurchasingSkeleton />

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Purchasing</h1>
        <p className="text-muted-foreground text-sm">
          Riwayat pesanan dan total pemasukan dari order yang sudah dibayar/selesai.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Gagal</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {message ? (
        <Alert>
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="gap-1">
            <CardTitle className="text-base">Total pemasukan</CardTitle>
            <CardDescription>Order Paid/Completed.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrencyIdr(totalRevenue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-1">
            <CardTitle className="text-base">Total order</CardTitle>
            <CardDescription>Semua status.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{orders.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-1">
            <CardTitle className="text-base">Filter & cari</CardTitle>
            <CardDescription>Cari berdasarkan ID/nama/email.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari order..." />
            <Button
              variant="outline"
              size="icon"
              onClick={refresh}
              disabled={isRefreshing}
              title="Refresh"
            >
              <RefreshCcw className="size-4" />
              <span className="sr-only">Refresh</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as OrderFilter)} className="w-full">
        <TabsList variant="line" className="w-full justify-start border-b px-0">
          <TabsTrigger value="DONE" className="gap-2">
            Paid/Completed ({orders.filter((o) => o.status === "PAID" || o.status === "COMPLETED").length})
          </TabsTrigger>
          <TabsTrigger value="PENDING" className="gap-2">
            Pending ({orders.filter((o) => o.status === "PENDING").length})
          </TabsTrigger>
          <TabsTrigger value="CANCELLED" className="gap-2">
            Cancelled ({orders.filter((o) => o.status === "CANCELLED").length})
          </TabsTrigger>
          <TabsTrigger value="EXPIRED" className="gap-2">
            Expired ({orders.filter((o) => o.status === "EXPIRED").length})
          </TabsTrigger>
          <TabsTrigger value="ALL" className="gap-2">
            All ({orders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter}>
          <Card>
            <CardHeader>
              <CardTitle>Daftar Pesanan</CardTitle>
              <CardDescription>Data order terbaru dari sistem.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border bg-background">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground text-xs">
                    <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left">
                      <th className="w-16">No</th>
                      <th>Order</th>
                      <th>Pembeli</th>
                      <th className="w-32">Status</th>
                      <th className="w-44">Total</th>
                      <th className="w-44">Tanggal</th>
                      <th className="w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.length ? (
                      filtered.map((o, index) => (
                        <tr key={o.id} className="[&>td]:px-4 [&>td]:py-3">
                          <td className="text-muted-foreground">{index + 1}</td>
                          <td className="font-medium">
                            <p className="truncate max-w-[180px]">{o.id}</p>
                          </td>
                          <td>
                            <p className="truncate max-w-[240px] font-medium">{o.user.name}</p>
                            <p className="text-muted-foreground truncate max-w-[240px] text-xs">{o.user.email}</p>
                          </td>
                          <td>
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
                          </td>
                          <td className="whitespace-nowrap font-semibold">{formatCurrencyIdr(o.total)}</td>
                          <td className="whitespace-nowrap">{formatDateTime(new Date(o.createdAt))}</td>
                          <td className="whitespace-nowrap">
                            <Button
                              variant="outline"
                              size="icon-sm"
                              onClick={() => openOrder(o.id)}
                              title="Detail"
                            >
                              <Eye className="size-4" />
                              <span className="sr-only">Detail</span>
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-sm text-muted-foreground">
                          Tidak ada data pesanan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open)
          if (!open) {
            setSelectedOrder(null)
            setInvoice(null)
          }
        }}
      >
        <SheetContent className="flex flex-col gap-4 sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Detail Order</SheetTitle>
            <SheetDescription>
              {selectedOrder ? selectedOrder.id : "Memuat data order..."}
            </SheetDescription>
          </SheetHeader>

          {isOrderLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : selectedOrder ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-background p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{selectedOrder.id}</p>
                  <p className="text-muted-foreground text-xs">
                    Dibuat {formatDateTime(new Date(selectedOrder.createdAt))}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={statusBadgeVariant(selectedOrder.status)}
                    className={
                      selectedOrder.status === "PAID" || selectedOrder.status === "COMPLETED"
                        ? "bg-primary/10 text-primary"
                        : undefined
                    }
                  >
                    {orderStatusLabel(selectedOrder.status)}
                  </Badge>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {formatCurrencyIdr(selectedOrder.total)}
                  </Badge>
                </div>
              </div>

              <div className="rounded-xl border bg-background">
                <div className="border-b px-3 py-2">
                  <p className="text-sm font-semibold">Items</p>
                </div>
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground text-xs">
                      <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left">
                        <th>Produk</th>
                        <th className="w-16">Qty</th>
                        <th className="w-32">Harga</th>
                        <th className="w-32">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id} className="[&>td]:px-3 [&>td]:py-2">
                          <td>
                            <p className="font-medium">{item.product.name}</p>
                            <p className="text-muted-foreground text-xs">{item.product.sku}</p>
                          </td>
                          <td className="whitespace-nowrap">{item.quantity}</td>
                          <td className="whitespace-nowrap">{formatCurrencyIdr(item.unitPrice)}</td>
                          <td className="whitespace-nowrap font-semibold">
                            {formatCurrencyIdr(item.unitPrice * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={loadInvoiceForSelectedOrder}
                  disabled={invoiceLoading}
                >
                  <FileText className="size-4" />
                  {invoiceLoading ? "Memproses..." : invoice ? "Refresh Invoice" : "Buat/Lihat Invoice"}
                </Button>
              </div>

              {invoice ? (
                <div className="rounded-xl border bg-background p-3">
                  <p className="text-sm font-semibold">Invoice</p>
                  <p className="text-muted-foreground mt-1 text-xs">ID: {invoice.id}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {formatCurrencyIdr(invoice.amount)}
                    </Badge>
                    <Badge variant="outline" className="text-muted-foreground">
                      {invoice.status}
                    </Badge>
                    <Badge variant="outline" className="text-muted-foreground">
                      {invoice.paymentMethod}
                    </Badge>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Order tidak ditemukan.</p>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

