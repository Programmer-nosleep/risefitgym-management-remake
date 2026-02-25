import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState } from "react"

export function ManageClassSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-80" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full max-w-xl" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function ManageClass() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) return <ManageClassSkeleton />

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Manage Class</h1>
        <p className="text-muted-foreground text-sm">
          Placeholder untuk manajemen membership/class.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membership</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Endpoint: <code className="font-mono">GET /memberships</code>,{" "}
          <code className="font-mono">GET /memberships/me</code>,{" "}
          <code className="font-mono">POST /memberships/subscribe</code>.
        </CardContent>
      </Card>
    </div>
  )
}
