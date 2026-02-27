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
import {
  createAgent,
  deleteAgent,
  listAgentMovements,
  listAgents,
  updateAgent,
  type Agent,
  type AgentMovement,
} from "@/services/admin"
import { Pencil, Plus, RefreshCcw, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

type AgentForm = {
  name: string
  email: string
  phone: string
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

function movementBadge(type: AgentMovement["type"]) {
  switch (type) {
    case "IN":
      return { label: "IN", className: "border-emerald-200 bg-emerald-500/10 text-emerald-700" }
    case "OUT":
      return { label: "OUT", className: "border-destructive/20 bg-destructive/10 text-destructive" }
    default:
      return { label: "ADJUST", className: "border-border bg-muted text-muted-foreground" }
  }
}

function MarketSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-60" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-44" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function Market() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [movements, setMovements] = useState<AgentMovement[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)

  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [movementsLoading, setMovementsLoading] = useState(false)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [form, setForm] = useState<AgentForm>({ name: "", email: "", phone: "" })

  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === selectedAgentId) ?? null,
    [agents, selectedAgentId]
  )

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const result = await listAgents()
        if (cancelled) return
        setAgents(result)
        if (result.length) setSelectedAgentId((prev) => prev ?? result[0].id)
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

  useEffect(() => {
    let cancelled = false

    async function loadMovements(agentId: string) {
      setMovementsLoading(true)
      setError(null)
      try {
        const result = await listAgentMovements(agentId)
        if (!cancelled) setMovements(result)
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err))
      } finally {
        if (!cancelled) setMovementsLoading(false)
      }
    }

    if (selectedAgentId) {
      loadMovements(selectedAgentId)
    } else {
      setMovements([])
    }

    return () => {
      cancelled = true
    }
  }, [selectedAgentId])

  const filteredAgents = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return agents
    return agents.filter((a) => {
      const haystack = `${a.name} ${a.email ?? ""} ${a.phone ?? ""}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [agents, query])

  async function refresh() {
    setIsRefreshing(true)
    setError(null)
    try {
      const result = await listAgents()
      setAgents(result)
      if (result.length && !selectedAgentId) setSelectedAgentId(result[0].id)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsRefreshing(false)
    }
  }

  function openCreateSheet() {
    setMessage(null)
    setError(null)
    setEditingAgent(null)
    setForm({ name: "", email: "", phone: "" })
    setSheetOpen(true)
  }

  function openEditSheet(agent: Agent) {
    setMessage(null)
    setError(null)
    setEditingAgent(agent)
    setForm({
      name: agent.name,
      email: agent.email ?? "",
      phone: agent.phone ?? "",
    })
    setSheetOpen(true)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    setMessage(null)

    const name = form.name.trim()
    const email = form.email.trim()
    const phone = form.phone.trim()

    if (!name) {
      setError("Nama agent wajib diisi.")
      setSubmitting(false)
      return
    }

    try {
      if (!editingAgent) {
        const created = await createAgent({
          name,
          ...(email ? { email } : {}),
          ...(phone ? { phone } : {}),
        })
        setAgents((prev) => [created, ...prev])
        setSelectedAgentId(created.id)
        setMessage("Agent berhasil ditambahkan.")
        setSheetOpen(false)
        return
      }

      const patch: Parameters<typeof updateAgent>[1] = {}
      if (name !== editingAgent.name) patch.name = name
      if (email !== (editingAgent.email ?? "")) patch.email = email
      if (phone !== (editingAgent.phone ?? "")) patch.phone = phone

      if (!Object.keys(patch).length) {
        setMessage("Tidak ada perubahan.")
        setSheetOpen(false)
        return
      }

      const updated = await updateAgent(editingAgent.id, patch)
      setAgents((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
      setMessage("Agent berhasil diperbarui.")
      setSheetOpen(false)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(agent: Agent) {
    const ok = window.confirm(`Hapus agent "${agent.name}"?`)
    if (!ok) return

    setDeletingId(agent.id)
    setError(null)
    setMessage(null)
    try {
      await deleteAgent(agent.id)
      setAgents((prev) => prev.filter((a) => a.id !== agent.id))
      if (selectedAgentId === agent.id) {
        const next = agents.find((a) => a.id !== agent.id)?.id ?? null
        setSelectedAgentId(next)
      }
      setMessage("Agent berhasil dihapus.")
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  const totalIn = useMemo(() => movements.filter((m) => m.type === "IN").reduce((s, m) => s + m.quantity, 0), [movements])
  const totalOut = useMemo(
    () => movements.filter((m) => m.type === "OUT").reduce((s, m) => s + m.quantity, 0),
    [movements]
  )

  if (isLoading && agents.length === 0) return <MarketSkeleton />

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Marketing Sales</h1>
        <p className="text-muted-foreground text-sm">
          Kelola agent (sales) dan lihat histori pergerakan stok berdasarkan agent.
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <CardTitle>Agents</CardTitle>
                <CardDescription>Daftar agent yang terdaftar.</CardDescription>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <div className="w-full sm:w-64">
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari agent..." />
                </div>
                <Button variant="outline" size="sm" onClick={refresh} disabled={isRefreshing}>
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
                    <th>Agent</th>
                    <th className="w-32">Kontak</th>
                    <th className="w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredAgents.length ? (
                    filteredAgents.map((a) => {
                      const isSelected = a.id === selectedAgentId
                      const isDeleting = deletingId === a.id

                      return (
                        <tr
                          key={a.id}
                          className="hover:bg-muted/30 transition-colors"
                          data-state={isSelected ? "selected" : undefined}
                        >
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              className="w-full text-left"
                              onClick={() => setSelectedAgentId(a.id)}
                            >
                              <p className="font-medium">{a.name}</p>
                              <p className="text-muted-foreground text-xs">{a.email ?? "—"}</p>
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm">{a.phone ?? "—"}</p>
                            <p className="text-muted-foreground text-xs">{formatDateTime(new Date(a.createdAt))}</p>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon-sm"
                                onClick={() => openEditSheet(a)}
                                disabled={submitting || Boolean(deletingId)}
                                title="Edit"
                              >
                                <Pencil className="size-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon-sm"
                                onClick={() => handleDelete(a)}
                                disabled={submitting || Boolean(deletingId)}
                                title="Hapus"
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
                      <td colSpan={3} className="px-4 py-6 text-center text-sm text-muted-foreground">
                        Tidak ada agent.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Movements</CardTitle>
                <CardDescription>
                  {selectedAgent ? (
                    <>
                      Histori inventory movement untuk{" "}
                      <span className="text-foreground font-medium">{selectedAgent.name}</span>.
                    </>
                  ) : (
                    "Pilih agent untuk melihat histori."
                  )}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-muted-foreground">
                  IN: {totalIn}
                </Badge>
                <Badge variant="outline" className="text-muted-foreground">
                  OUT: {totalOut}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {movementsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : selectedAgent ? (
              <div className="overflow-x-auto rounded-xl border bg-background">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground text-xs">
                    <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left">
                      <th className="w-28">Type</th>
                      <th>Produk</th>
                      <th className="w-20">Qty</th>
                      <th className="w-44">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {movements.length ? (
                      movements.map((m) => {
                        const pill = movementBadge(m.type)
                        return (
                          <tr key={m.id} className="[&>td]:px-4 [&>td]:py-3">
                            <td>
                              <Badge variant="outline" className={pill.className}>
                                {pill.label}
                              </Badge>
                            </td>
                            <td>
                              <p className="font-medium">{m.product.name}</p>
                              <p className="text-muted-foreground text-xs">{m.product.sku}</p>
                              {m.note ? (
                                <p className="text-muted-foreground mt-1 text-xs">
                                  Note: {m.note}
                                </p>
                              ) : null}
                            </td>
                            <td className="whitespace-nowrap font-semibold">{m.quantity}</td>
                            <td className="whitespace-nowrap">{formatDateTime(new Date(m.createdAt))}</td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted-foreground">
                          Belum ada movement untuk agent ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Pilih agent dari daftar untuk melihat movement.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open)
          if (!open) setEditingAgent(null)
        }}
      >
        <SheetContent className="flex flex-col gap-4">
          <SheetHeader>
            <SheetTitle>{editingAgent ? "Edit Agent" : "Tambah Agent"}</SheetTitle>
            <SheetDescription>
              {editingAgent ? "Ubah data agent." : "Tambahkan agent baru untuk pencatatan movement."}
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nama agent"
                autoComplete="off"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email (opsional)</Label>
              <Input
                id="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="email@contoh.com"
                autoComplete="off"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone (opsional)</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="08xxxxxxxxxx"
                autoComplete="off"
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

