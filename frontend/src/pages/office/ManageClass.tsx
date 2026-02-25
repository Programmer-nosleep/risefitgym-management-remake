import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ManageClass() {
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
