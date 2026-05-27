"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const ERROR_MESSAGES: Record<string, string> = {
  SteamVerificationFailed: "La vérification Steam a échoué. Réessayez depuis la page de connexion.",
  SteamAuthFailed: "Une erreur s'est produite lors de la connexion Steam. Réessayez dans quelques instants.",
  CredentialsSignin: "Code d'authentification invalide ou expiré. Réessayez depuis la page de connexion.",
  Configuration: "Erreur de configuration du serveur. Contactez un administrateur.",
  Default: "Une erreur inattendue s'est produite lors de la connexion.",
}

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error") ?? "Default"
  const detail = searchParams.get("detail")
  const message = ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle>Erreur de connexion</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button asChild>
          <Link href="/auth/signin">Retour à la connexion</Link>
        </Button>
        <div className="space-y-1">
          <p className="text-center text-xs text-muted-foreground">
            Code : <span className="font-mono">{error}</span>
          </p>
          {detail && (
            <p className="text-center text-xs text-muted-foreground font-mono break-all">
              {detail}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AuthErrorPage() {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex shrink-0 items-center border-b bg-background px-6 py-2 z-50">
        <Link href="/" className="flex items-center">
          <Image src="/icon.png" alt="NEXUS" width={36} height={36} />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4">
        <Suspense fallback={<p className="text-muted-foreground">Chargement…</p>}>
          <ErrorContent />
        </Suspense>
      </main>
    </div>
  )
}
