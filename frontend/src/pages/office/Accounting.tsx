import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getApiErrorMessage } from "@/helpers/api-error"
import { listInvoices } from "@/services/admin"
import type { Invoice, InvoiceStatus } from "@/services/user"
import { Eye, RefreshCcw } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

type InvoiceFilter = "ALL" | InvoiceStatus

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

function invoiceStatusPill(status: InvoiceStatus) {
  switch (status) {
    case "PAID":
      return { label: "Paid", className: "border-emerald-200 bg-emerald-500/10 text-emerald-700" }
    case "PENDING":
      return { label: "Pending", className: "border-border bg-muted text-muted-foreground" }
    case "FAILED":
      return { label: "Failed", className: "border-destructive/20 bg-destructive/10 text-destructive" }
    case "CANCELLED":
      return { label: "Cancelled", className: "border-destructive/20 bg-destructive/10 text-destructive" }
  }
}

function AccountingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      <Skeleton className="h-9 w-72" />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-44" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function Accounting() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [filter, setFilter] = useState<InvoiceFilter>("ALL")
  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const result = await listInvoices()
        if (cancelled) return
        setInvoices(result.invoices)
        setTotalAmount(result.totalAmount)
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
      const result = await listInvoices()
      setInvoices(result.invoices)
      setTotalAmount(result.totalAmount)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsRefreshing(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    const byStatus = invoices.filter((inv) => {
      if (filter === "ALL") return true
      return inv.status === filter
    })

    if (!q) return byStatus

    return byStatus.filter((inv) => {
      const haystack = `${inv.id} ${inv.orderId} ${inv.user.name} ${inv.user.email} ${inv.transactionId}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [filter, invoices, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))

  useEffect(() => {
    setCurrentPage(1)
  }, [filter, query])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const currentInvoices = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  function openInvoice(inv: Invoice) {
    setError(null)
    setMessage(null)
    setSelectedInvoice(inv)
    setSheetOpen(true)
  }

  if (isLoading && invoices.length === 0) return <AccountingSkeleton />

  const showingStart = filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const showingEnd = Math.min(currentPage * itemsPerPage, filtered.length)

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Accounting</h1>
        <p className="text-muted-foreground text-sm">
          Rekap invoice dan transaksi pembayaran yang tercatat.
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
            <CardTitle className="text-base">Total invoice</CardTitle>
            <CardDescription>Semua invoice.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrencyIdr(totalAmount)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-1">
            <CardTitle className="text-base">Jumlah invoice</CardTitle>
            <CardDescription>Total record.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{invoices.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-1">
            <CardTitle className="text-base">Cari invoice</CardTitle>
            <CardDescription>ID/order/user/tx.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari..." />
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

      <Tabs value={filter} onValueChange={(v) => setFilter(v as InvoiceFilter)} className="w-full">
        <TabsList variant="line" className="w-full justify-start border-b px-0">
          <TabsTrigger value="ALL" className="gap-2">
            All ({invoices.length})
          </TabsTrigger>
          <TabsTrigger value="PAID" className="gap-2">
            Paid ({invoices.filter((i) => i.status === "PAID").length})
          </TabsTrigger>
          <TabsTrigger value="PENDING" className="gap-2">
            Pending ({invoices.filter((i) => i.status === "PENDING").length})
          </TabsTrigger>
          <TabsTrigger value="FAILED" className="gap-2">
            Failed ({invoices.filter((i) => i.status === "FAILED").length})
          </TabsTrigger>
          <TabsTrigger value="CANCELLED" className="gap-2">
            Cancelled ({invoices.filter((i) => i.status === "CANCELLED").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter}>
          <Card>
            <CardHeader>
              <CardTitle>Invoice</CardTitle>
              <CardDescription>Daftar invoice terbaru.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border bg-background">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground text-xs">
                    <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left">
                      <th className="w-16">No</th>
                      <th>Invoice</th>
                      <th>User</th>
                      <th className="w-36">Status</th>
                      <th className="w-44">Amount</th>
                      <th className="w-44">Tanggal</th>
                      <th className="w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {currentInvoices.length ? (
                      currentInvoices.map((inv, index) => {
                        const pill = invoiceStatusPill(inv.status)

                        return (
                          <tr key={inv.id} className="[&>td]:px-4 [&>td]:py-3">
                            <td className="text-muted-foreground">
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </td>
                            <td>
                              <p className="truncate max-w-[220px] font-medium">{inv.id}</p>
                              <p className="text-muted-foreground truncate max-w-[220px] text-xs">
                                Order: {inv.orderId}
                              </p>
                            </td>
                            <td>
                              <p className="truncate max-w-[240px] font-medium">{inv.user.name}</p>
                              <p className="text-muted-foreground truncate max-w-[240px] text-xs">{inv.user.email}</p>
                            </td>
                            <td>
                              <Badge variant="outline" className={pill.className}>
                                {pill.label}
                              </Badge>
                            </td>
                            <td className="whitespace-nowrap font-semibold">{formatCurrencyIdr(inv.amount)}</td>
                            <td className="whitespace-nowrap">{formatDateTime(new Date(inv.createdAt))}</td>
                            <td className="whitespace-nowrap">
                              <Button variant="outline" size="icon-sm" onClick={() => openInvoice(inv)} title="Detail">
                                <Eye className="size-4" />
                                <span className="sr-only">Detail</span>
                              </Button>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-sm text-muted-foreground">
                          Tidak ada invoice.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground text-sm">
                  Showing{" "}
                  <span className="text-foreground font-medium">{showingStart}</span> to{" "}
                  <span className="text-foreground font-medium">{showingEnd}</span> of{" "}
                  <span className="text-foreground font-medium">{filtered.length}</span> results
                </p>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    &lt;
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="xs"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    &gt;
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open)
          if (!open) setSelectedInvoice(null)
        }}
      >
        <SheetContent className="flex flex-col gap-4 sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Detail Invoice</SheetTitle>
            <SheetDescription>{selectedInvoice ? selectedInvoice.id : "—"}</SheetDescription>
          </SheetHeader>

          {selectedInvoice ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-background p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{selectedInvoice.user.name}</p>
                  <p className="text-muted-foreground text-xs">{selectedInvoice.user.email}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Order: {selectedInvoice.orderId}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {formatCurrencyIdr(selectedInvoice.amount)}
                  </Badge>
                  <Badge variant="outline" className={invoiceStatusPill(selectedInvoice.status).className}>
                    {invoiceStatusPill(selectedInvoice.status).label}
                  </Badge>
                </div>
              </div>

              <div className="rounded-xl border bg-background p-3">
                <p className="text-sm font-semibold">Info</p>
                <div className="mt-2 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground text-xs">Payment method</p>
                    <p className="font-medium">{selectedInvoice.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Transaction ID</p>
                    <p className="font-medium">{selectedInvoice.transactionId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Created</p>
                    <p className="font-medium">{formatDateTime(new Date(selectedInvoice.createdAt))}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Updated</p>
                    <p className="font-medium">{formatDateTime(new Date(selectedInvoice.updatedAt))}</p>
                  </div>
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
                      {selectedInvoice.order.items.map((item) => (
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
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Pilih invoice untuk melihat detail.</p>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

