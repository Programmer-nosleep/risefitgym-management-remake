import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState } from "react"

export function PurchasingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-60" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-28" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full max-w-md" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function Purchasing() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) return <PurchasingSkeleton />

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Purchasing</h1>
        <p className="text-muted-foreground text-sm">
          Placeholder untuk alur pembelian (orders).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Endpoint: <code className="font-mono">GET /orders</code> dan{" "}
          <code className="font-mono">GET /orders/all</code> (admin/backoffice).
        </CardContent>
      </Card>
    </div>
  )
}
