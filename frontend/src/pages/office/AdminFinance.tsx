import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminFinance() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Admin Finance</h1>
        <p className="text-muted-foreground text-sm">
          Modul keuangan: invoice & pembayaran (Midtrans).
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invoice</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            Endpoint: <code className="font-mono">POST /invoices</code>,{" "}
            <code className="font-mono">GET /invoices/:id</code>,{" "}
            <code className="font-mono">GET /invoices/order/:orderId</code>.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            Token Midtrans: <code className="font-mono">POST /payment/token</code>.
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
