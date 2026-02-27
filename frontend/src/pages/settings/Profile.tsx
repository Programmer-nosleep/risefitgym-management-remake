import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { getApiErrorMessage } from "@/helpers/api-error"
import { getMyProfile, updateMyProfile, type UserProfile } from "@/services/user"
import { useAuthStore } from "@/store/auth.store"
import { Pencil, ShieldCheck, UserRound } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

type SettingsSection =
  | "profile"
  | "security"
  | "teams"
  | "team-member"
  | "notifications"
  | "billing"
  | "data-export"

function initialsFromName(name: string) {
  const cleaned = name.trim()
  if (!cleaned) return "R"

  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()

  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase()
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(date)
}

function roleLabel(role: UserProfile["role"]) {
  switch (role) {
    case "ADMIN":
      return "Admin"
    case "BACKOFFICE":
      return "Backoffice"
    default:
      return "User"
  }
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      <Card className="py-0">
        <div className="grid gap-0 lg:grid-cols-[260px_1fr]">
          <div className="border-b p-4 lg:border-b-0 lg:border-r">
            <Skeleton className="h-4 w-24" />
            <div className="mt-3 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
          <div className="space-y-4 p-4 md:p-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
        </div>
      </Card>
    </div>
  )
}

export default function Profile() {
  const setUser = useAuthStore((s) => s.setUser)
  const [section, setSection] = useState<SettingsSection>("profile")
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: "",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  })

  const navItems = useMemo(
    () =>
      [
        { id: "profile" as const, label: "My Profile", icon: UserRound },
        { id: "security" as const, label: "Security", icon: ShieldCheck },
        { id: "teams" as const, label: "Teams" },
        { id: "team-member" as const, label: "Team Member" },
        { id: "notifications" as const, label: "Notifications" },
        { id: "billing" as const, label: "Billing" },
        { id: "data-export" as const, label: "Data Export" },
      ] satisfies { id: SettingsSection; label: string; icon?: typeof UserRound }[],
    []
  )

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const result = await getMyProfile()
        if (!cancelled) setProfile(result)
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  function openEditSheet() {
    if (!profile) return

    setMessage(null)
    setError(null)
    setForm({
      name: profile.name,
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    })
    setSheetOpen(true)
  }

  async function handleSave() {
    if (!profile) return

    setSubmitting(true)
    setError(null)
    setMessage(null)

    const name = form.name.trim()
    const currentPassword = form.currentPassword.trim()
    const newPassword = form.newPassword
    const confirmNewPassword = form.confirmNewPassword

    if (newPassword || confirmNewPassword) {
      if (newPassword.length < 8) {
        setError("Password baru minimal 8 karakter.")
        setSubmitting(false)
        return
      }

      if (newPassword !== confirmNewPassword) {
        setError("Konfirmasi password baru tidak cocok.")
        setSubmitting(false)
        return
      }
    }

    const payload: Parameters<typeof updateMyProfile>[0] = {}

    if (name && name !== profile.name) payload.name = name

    if (newPassword) {
      payload.newPassword = newPassword
      if (currentPassword) payload.currentPassword = currentPassword
    }

    try {
      const updated = await updateMyProfile(payload)
      setProfile(updated)
      setUser({ id: updated.id, name: updated.name, email: updated.email, role: updated.role })
      setMessage("Profil berhasil diperbarui.")
      setSheetOpen(false)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading && !profile) return <ProfileSkeleton />

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground text-sm">Kelola profil dan pengaturan akun.</p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Gagal</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {message ? (
        <Alert>
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="py-0">
        <div className="grid gap-0 lg:grid-cols-[260px_1fr]">
          <div className="border-b p-4 lg:border-b-0 lg:border-r">
            <p className="text-muted-foreground text-xs font-medium">SETTINGS</p>
            <div className="mt-3 grid gap-1">
              {navItems.map((item) => {
                const isActive = section === item.id
                const Icon = item.icon

                return (
                  <Button
                    key={item.id}
                    type="button"
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() => setSection(item.id)}
                  >
                    {Icon ? <Icon className="size-4" /> : null}
                    {item.label}
                  </Button>
                )
              })}
            </div>
          </div>

          <div className="p-4 md:p-6">
            {section === "profile" ? (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">My Profile</h2>
                  <p className="text-muted-foreground text-sm">
                    Informasi dasar akun kamu di RiseFit.
                  </p>
                </div>

                <div className="rounded-xl border bg-background p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full font-semibold">
                        {profile ? initialsFromName(profile.name) : "R"}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold">{profile?.name ?? "—"}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            {profile ? roleLabel(profile.role) : "—"}
                          </Badge>
                          <p className="text-muted-foreground truncate text-xs">{profile?.email ?? "—"}</p>
                        </div>
                      </div>
                    </div>

                    <Button variant="outline" size="sm" onClick={openEditSheet} disabled={!profile}>
                      <Pencil className="size-4" />
                      Edit
                    </Button>
                  </div>
                </div>

                <Card className="gap-3">
                  <CardHeader className="gap-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-base">Personal Information</CardTitle>
                        <CardDescription>Data akun yang tersimpan di sistem.</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={openEditSheet} disabled={!profile}>
                        <Pencil className="size-4" />
                        Edit
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Full Name</p>
                      <p className="font-medium">{profile?.name ?? "—"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Email address</p>
                      <p className="font-medium">{profile?.email ?? "—"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Role</p>
                      <p className="font-medium">{profile ? roleLabel(profile.role) : "—"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Joined</p>
                      <p className="font-medium">
                        {profile ? formatDate(new Date(profile.createdAt)) : "—"}
                      </p>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <p className="text-muted-foreground text-xs">Last updated</p>
                      <p className="font-medium">
                        {profile ? formatDate(new Date(profile.updatedAt)) : "—"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="gap-3">
                  <CardHeader className="gap-1">
                    <CardTitle className="text-base">Address</CardTitle>
                    <CardDescription>Belum tersedia di versi ini.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Country</p>
                      <p className="font-medium">—</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">City / State</p>
                      <p className="font-medium">—</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Postal Code</p>
                      <p className="font-medium">—</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Tax ID</p>
                      <p className="font-medium">—</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : section === "security" ? (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Security</h2>
                <p className="text-muted-foreground text-sm">
                  Ubah password akun melalui tombol edit di halaman profile.
                </p>
                <Button variant="outline" size="sm" onClick={() => setSection("profile")}>
                  Kembali ke My Profile
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">{navItems.find((n) => n.id === section)?.label}</h2>
                <p className="text-muted-foreground text-sm">Fitur ini belum tersedia.</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open)
          if (!open) {
            setForm((prev) => ({
              ...prev,
              currentPassword: "",
              newPassword: "",
              confirmNewPassword: "",
            }))
          }
        }}
      >
        <SheetContent className="flex flex-col gap-4">
          <SheetHeader>
            <SheetTitle>Edit Profile</SheetTitle>
            <SheetDescription>Ubah nama dan/atau password akun.</SheetDescription>
          </SheetHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nama lengkap"
                autoComplete="off"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="currentPassword">Current Password (opsional)</Label>
              <Input
                id="currentPassword"
                type="password"
                value={form.currentPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Isi jika ingin ganti password"
                autoComplete="current-password"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="newPassword">New Password (opsional)</Label>
              <Input
                id="newPassword"
                type="password"
                value={form.newPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Minimal 8 karakter"
                autoComplete="new-password"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={form.confirmNewPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, confirmNewPassword: e.target.value }))}
                placeholder="Ulangi password baru"
                autoComplete="new-password"
              />
            </div>
          </div>

          <SheetFooter className="mt-auto">
            <Button variant="outline" onClick={() => setSheetOpen(false)} disabled={submitting}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={submitting || !profile}>
              {submitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

