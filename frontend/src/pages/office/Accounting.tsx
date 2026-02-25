import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Accounting() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Accounting</h1>
        <p className="text-muted-foreground text-sm">
          Placeholder untuk laporan dan rekonsiliasi data transaksi.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice & Payment</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Saat ini backend belum menyediakan list invoice; jadi halaman ini fokus ke flow per order.
        </CardContent>
      </Card>
    </div>
  )
}
