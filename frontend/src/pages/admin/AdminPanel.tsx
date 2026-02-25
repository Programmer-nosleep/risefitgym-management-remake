import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminPanel() {
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
