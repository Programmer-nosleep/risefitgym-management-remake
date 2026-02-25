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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { getApiErrorMessage } from "@/helpers/api-error"
import { addCartItem, listProducts, type Product } from "@/services/user"
import { PackageSearch, ShoppingCart } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

function formatCurrencyIdr(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function ViewSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-56" />
      <div className="space-y-1">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Card>
        <CardHeader className="gap-3">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-52" />
        </CardHeader>
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

export default function View() {
  const [products, setProducts] = useState<Product[]>([])
  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const result = await listProducts()
        if (!cancelled) setProducts(result)
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => {
      const haystack = `${p.name} ${p.sku} ${p.description ?? ""}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [products, query])

  async function handleAddToCart(productId: string) {
    setSubmittingId(productId)
    setMessage(null)
    setError(null)
    try {
      await addCartItem({ productId, quantity: 1 })
      setMessage("Produk ditambahkan ke keranjang.")
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSubmittingId(null)
    }
  }

  if (isLoading && products.length === 0) return <ViewSkeleton />

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
            <BreadcrumbPage>Lihat Barang</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Lihat Barang</h1>
        <p className="text-sm text-muted-foreground">
          Pilih produk yang tersedia dan masukkan ke keranjang.
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

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PackageSearch className="size-5 text-primary" />
                Produk
              </CardTitle>
              <CardDescription>Daftar produk aktif dari sistem.</CardDescription>
            </div>
            <div className="w-full sm:max-w-xs">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari produk..."
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-xl border bg-background">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-xs">
                <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left">
                  <th>Produk</th>
                  <th>Harga</th>
                  <th>Stok</th>
                  <th className="w-44"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length ? (
                  filtered.map((p) => {
                    const isOut = p.stock <= 0
                    const isSubmitting = submittingId === p.id

                    return (
                      <tr key={p.id} className="[&>td]:px-4 [&>td]:py-3">
                        <td>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{p.name}</p>
                            <p className="text-muted-foreground truncate text-xs">
                              {p.sku}
                              {p.description ? ` • ${p.description}` : ""}
                            </p>
                          </div>
                        </td>
                        <td className="whitespace-nowrap font-semibold">
                          {formatCurrencyIdr(p.price)}
                        </td>
                        <td className="whitespace-nowrap">
                          {isOut ? (
                            <Badge variant="destructive">Habis</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                              {p.stock} tersedia
                            </Badge>
                          )}
                        </td>
                        <td className="whitespace-nowrap">
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => handleAddToCart(p.id)}
                            disabled={isOut || Boolean(submittingId)}
                          >
                            <ShoppingCart className="size-4" />
                            {isSubmitting ? "Menambahkan..." : "Tambah ke cart"}
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted-foreground">
                      Tidak ada produk yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <Button asChild variant="outline" size="sm">
              <Link to="/app/home">Kembali</Link>
            </Button>

            <Button asChild size="sm" variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/15">
              <Link to="/app/history">Lihat riwayat</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
