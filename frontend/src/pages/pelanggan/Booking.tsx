import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getApiErrorMessage } from "@/helpers/api-error"
import {
  getMyActiveMembership,
  listMemberships,
  subscribeMembership,
  type ActiveMembership,
  type Membership,
} from "@/services/user"
import { CalendarCheck2, Crown, Sparkles } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

function formatCurrencyIdr(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function BookingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-56" />
      <div className="space-y-1">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-96" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function Booking() {
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [activeMembership, setActiveMembership] = useState<ActiveMembership | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      setSuccess(null)
      try {
        const [membershipList, myActive] = await Promise.all([listMemberships(), getMyActiveMembership()])
        if (cancelled) return
        setMemberships(membershipList)
        setActiveMembership(myActive)
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

  const featuredMembershipId = useMemo(() => {
    if (!memberships.length) return null
    return memberships.reduce((prev, current) => (current.price > prev.price ? current : prev)).id
  }, [memberships])

  async function handleSubscribe(membershipId: string) {
    setSubmittingId(membershipId)
    setError(null)
    setSuccess(null)

    try {
      const userMembership = await subscribeMembership(membershipId)
      setActiveMembership(userMembership)
      setSuccess("Membership berhasil diaktifkan.")
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSubmittingId(null)
    }
  }

  if (isLoading && memberships.length === 0) return <BookingSkeleton />

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/app">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Booking</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Booking Membership</h1>
        <p className="text-sm text-muted-foreground">
          Pilih paket membership yang sesuai untuk mulai latihan.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Gagal</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {success ? (
        <Alert>
          <AlertTitle>Berhasil</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      {activeMembership ? (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              Membership aktif
            </CardTitle>
            <CardDescription>
              Saat ini Anda memiliki membership yang masih aktif.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background p-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">{activeMembership.membership.name}</p>
                <p className="text-muted-foreground text-xs">
                  Berlaku sampai{" "}
                  <span className="text-foreground font-medium">
                    {formatDateTime(new Date(activeMembership.endDate))}
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {formatCurrencyIdr(activeMembership.membership.price)}
                </Badge>
                <Badge variant="outline" className="border-emerald-200 bg-emerald-500/10 text-emerald-700">
                  Active
                </Badge>
              </div>
            </div>
            <p className="text-muted-foreground text-xs">
              Jika ingin ganti paket, tunggu membership ini berakhir terlebih dahulu.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Paket tersedia</CardTitle>
          <CardDescription>
            Paket terurut berdasarkan harga. Pilih yang paling cocok buat goal Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {memberships.map((m) => {
              const isFeatured = featuredMembershipId === m.id
              const isSubmitting = submittingId === m.id
              const isDisabled = Boolean(activeMembership) || Boolean(submittingId)

              return (
                <Card
                  key={m.id}
                  className="gap-3 overflow-hidden py-0 shadow-none"
                >
                  <div className="relative h-20 bg-linear-to-br from-primary/20 via-primary/10 to-transparent">
                    <div className="absolute right-3 top-3">
                      {isFeatured ? (
                        <Badge className="bg-primary text-primary-foreground">
                          <Crown className="size-3" />
                          Best value
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  <CardHeader className="px-4 pt-4 pb-0">
                    <CardTitle className="text-base">{m.name}</CardTitle>
                    <CardDescription>{m.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 px-4 pb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {formatCurrencyIdr(m.price)}
                      </Badge>
                      <Badge variant="outline" className="text-muted-foreground">
                        {m.durationDays} hari
                      </Badge>
                    </div>

                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => handleSubscribe(m.id)}
                      disabled={isDisabled}
                    >
                      <CalendarCheck2 className="size-4" />
                      {isSubmitting ? "Memproses..." : activeMembership ? "Sudah aktif" : "Aktifkan membership"}
                    </Button>

                    <p className="text-muted-foreground text-xs">
                      Sistem akan mengaktifkan paket mulai sekarang.
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="mt-6">
            <Button asChild variant="outline" size="sm">
              <Link to="/app/home">Kembali ke overview</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
