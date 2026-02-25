import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState } from "react"

export function MarketSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-60" />
        <Skeleton className="h-4 w-96" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-28" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full max-w-lg" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function Market() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) return <MarketSkeleton />

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Marketing Sales</h1>
        <p className="text-muted-foreground text-sm">
          Placeholder untuk data agent & inventory movement.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agents</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Endpoint: <code className="font-mono">GET /agents</code> dan{" "}
          <code className="font-mono">GET /agents/:id/movements</code>.
        </CardContent>
      </Card>
    </div>
  )
}
