import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "react-router-dom"

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-xl items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Halaman tidak ditemukan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            Route yang kamu buka tidak ada. Cek lagi URL-nya atau balik ke Dashboard.
          </p>
          <Button asChild className="w-fit">
            <Link to="/app">Kembali</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

