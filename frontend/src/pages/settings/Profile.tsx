import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/store/auth.store"

export default function Profile() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground text-sm">
          Info akun & pengaturan dasar.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-foreground text-xs font-medium">Name</p>
              <p>{user?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-foreground text-xs font-medium">Email</p>
              <p>{user?.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-foreground text-xs font-medium">Role</p>
              <p>{user?.role ?? "—"}</p>
            </div>
          </div>
          <p className="mt-4 text-xs">
            Endpoint update: <code className="font-mono">PATCH /users/me</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
