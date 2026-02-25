import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Market() {
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
