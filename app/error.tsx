"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 text-center px-4">
      <AlertTriangle className="h-16 w-16 text-destructive" />
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">500</h1>
        <p className="text-xl font-semibold">Une erreur est survenue</p>
        <p className="text-muted-foreground max-w-sm">
          Quelque chose s&apos;est mal passé. Veuillez réessayer ou revenir plus tard.
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}>Réessayer</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
          Tableau de bord
        </Button>
      </div>
    </div>
  )
}
