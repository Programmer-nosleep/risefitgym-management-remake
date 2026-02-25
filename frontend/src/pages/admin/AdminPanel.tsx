import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState } from "react"

export function AdminPanelSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-52" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full max-w-lg" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminPanel() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) return <AdminPanelSkeleton />

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground text-sm">
          Manajemen user & role.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Endpoint: <code className="font-mono">GET /users</code>,{" "}
          <code className="font-mono">GET /users/:id</code>,{" "}
          <code className="font-mono">PATCH /users/:id/role</code> (ADMIN).
        </CardContent>
      </Card>
    </div>
  )
}
