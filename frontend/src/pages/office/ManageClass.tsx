import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { getApiErrorMessage } from "@/helpers/api-error"
import { createMembership, deleteMembership, updateMembership } from "@/services/admin"
import { listMemberships, type Membership } from "@/services/user"
import { Pencil, Plus, RefreshCcw, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

export function ManageClassSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-80" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full max-w-xl" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function ManageClass() {
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingMembership, setEditingMembership] = useState<Membership | null>(null)
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    durationDays: "",
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const result = await listMemberships()
        if (!cancelled) setMemberships(result)
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

  function formatCurrencyIdr(amount: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return memberships
    return memberships.filter((m) => {
      const haystack = `${m.name} ${m.description}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [memberships, query])

  async function refreshMemberships() {
    setIsRefreshing(true)
    setError(null)
    try {
      const result = await listMemberships()
      setMemberships(result)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsRefreshing(false)
    }
  }

  function openCreateSheet() {
    setMessage(null)
    setError(null)
    setEditingMembership(null)
    setForm({ name: "", description: "", price: "", durationDays: "" })
    setSheetOpen(true)
  }

  function openEditSheet(m: Membership) {
    setMessage(null)
    setError(null)
    setEditingMembership(m)
    setForm({
      name: m.name,
      description: m.description,
      price: String(m.price),
      durationDays: String(m.durationDays),
    })
    setSheetOpen(true)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    setMessage(null)

    const name = form.name.trim()
    const description = form.description.trim()

    const price = Number.parseInt(form.price, 10)
    const durationDays = Number.parseInt(form.durationDays, 10)

    if (!name) {
      setError("Nama membership wajib diisi.")
      setSubmitting(false)
      return
    }

    if (!description) {
      setError("Deskripsi wajib diisi.")
      setSubmitting(false)
      return
    }

    if (!Number.isFinite(price) || price < 0) {
      setError("Harga harus berupa angka >= 0.")
      setSubmitting(false)
      return
    }

    if (!Number.isFinite(durationDays) || durationDays <= 0) {
      setError("Durasi harus berupa angka > 0 (hari).")
      setSubmitting(false)
      return
    }

    try {
      if (!editingMembership) {
        const created = await createMembership({
          name,
          description,
          price,
          durationDays,
        })

        setMemberships((prev) =>
          [...prev, created].sort((a, b) => a.price - b.price)
        )
        setMessage("Membership berhasil ditambahkan.")
        setSheetOpen(false)
        return
      }

      const patch: Parameters<typeof updateMembership>[1] = {}
      if (name !== editingMembership.name) patch.name = name
      if (description !== editingMembership.description) patch.description = description
      if (price !== editingMembership.price) patch.price = price
      if (durationDays !== editingMembership.durationDays) patch.durationDays = durationDays

      if (!Object.keys(patch).length) {
        setMessage("Tidak ada perubahan.")
        setSheetOpen(false)
        return
      }

      const updated = await updateMembership(editingMembership.id, patch)
      setMemberships((prev) =>
        prev
          .map((m) => (m.id === updated.id ? updated : m))
          .sort((a, b) => a.price - b.price)
      )
      setMessage("Membership berhasil diperbarui.")
      setSheetOpen(false)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(m: Membership) {
    const ok = window.confirm(`Hapus membership "${m.name}"?`)
    if (!ok) return

    setDeletingId(m.id)
    setError(null)
    setMessage(null)
    try {
      await deleteMembership(m.id)
      setMemberships((prev) => prev.filter((x) => x.id !== m.id))
      setMessage("Membership berhasil dihapus.")
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) return <ManageClassSkeleton />

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Manage Class</h1>
        <p className="text-muted-foreground text-sm">
          CRUD paket membership (ADMIN/BACKOFFICE).
        </p>
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

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <CardTitle>Paket Membership</CardTitle>
              <CardDescription>
                Tambah, ubah, dan hapus paket membership untuk halaman booking user.
              </CardDescription>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="w-full sm:w-64">
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari paket..." />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshMemberships}
                disabled={isRefreshing || submitting || Boolean(deletingId)}
              >
                <RefreshCcw className="size-4" />
                {isRefreshing ? "Memuat..." : "Refresh"}
              </Button>
              <Button size="sm" onClick={openCreateSheet} disabled={submitting || Boolean(deletingId)}>
                <Plus className="size-4" />
                Tambah
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-xl border bg-background">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-xs">
                <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left">
                  <th>Paket</th>
                  <th>Harga</th>
                  <th>Durasi</th>
                  <th className="w-36"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length ? (
                  filtered.map((m) => {
                    const isDeleting = deletingId === m.id

                    return (
                      <tr key={m.id} className="[&>td]:px-4 [&>td]:py-3">
                        <td>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{m.name}</p>
                            <p className="text-muted-foreground truncate text-xs">{m.description}</p>
                          </div>
                        </td>
                        <td className="whitespace-nowrap font-semibold">{formatCurrencyIdr(m.price)}</td>
                        <td className="whitespace-nowrap">
                          <Badge variant="outline" className="text-muted-foreground">
                            {m.durationDays} hari
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon-sm"
                              onClick={() => openEditSheet(m)}
                              disabled={submitting || Boolean(deletingId)}
                            >
                              <Pencil className="size-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon-sm"
                              onClick={() => handleDelete(m)}
                              disabled={submitting || Boolean(deletingId)}
                            >
                              <Trash2 className="size-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                          {isDeleting ? (
                            <p className="mt-1 text-right text-xs text-muted-foreground">Menghapus...</p>
                          ) : null}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted-foreground">
                      Tidak ada paket.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open)
          if (!open) setEditingMembership(null)
        }}
      >
        <SheetContent className="flex flex-col gap-4">
          <SheetHeader>
            <SheetTitle>{editingMembership ? "Edit Paket" : "Tambah Paket"}</SheetTitle>
            <SheetDescription>
              {editingMembership ? "Ubah data paket membership." : "Tambahkan paket membership baru."}
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nama Paket</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Contoh: Bulanan"
                autoComplete="off"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Contoh: Membership 30 hari"
                autoComplete="off"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price">Harga</Label>
              <Input
                id="price"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="durationDays">Durasi (hari)</Label>
              <Input
                id="durationDays"
                type="number"
                min={1}
                value={form.durationDays}
                onChange={(e) => setForm((prev) => ({ ...prev, durationDays: e.target.value }))}
                placeholder="30"
              />
            </div>
          </div>

          <SheetFooter className="mt-auto">
            <Button variant="outline" onClick={() => setSheetOpen(false)} disabled={submitting}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
