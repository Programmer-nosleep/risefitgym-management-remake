import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Inventory() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground text-sm">
          Produk & stok (akses sesuai role).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Endpoint: <code className="font-mono">GET /products</code>. Create/Update/Delete butuh role ADMIN/BACKOFFICE.
        </CardContent>
      </Card>
    </div>
  )
}
