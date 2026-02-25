import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Purchasing() {
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
