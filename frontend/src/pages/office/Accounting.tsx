import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState } from "react"

export function AccountingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full max-w-lg" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function Accounting() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) return <AccountingSkeleton />

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Accounting</h1>
        <p className="text-muted-foreground text-sm">
          Placeholder untuk laporan dan rekonsiliasi data transaksi.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice & Payment</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Saat ini backend belum menyediakan list invoice; jadi halaman ini fokus ke flow per order.
        </CardContent>
      </Card>
    </div>
  )
}
