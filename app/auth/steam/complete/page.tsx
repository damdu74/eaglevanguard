"use client"

import { Suspense, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"

function SteamCompleteInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const code = searchParams.get("code")

  useEffect(() => {
    if (!code) {
      router.push("/auth/signin")
      return
    }
    signIn("steam-credentials", { code, callbackUrl: "/dashboard" })
  }, [code, router])

  return (
    <p className="text-muted-foreground animate-pulse">Connexion Steam en cours…</p>
  )
}

export default function SteamCompletePage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <Suspense fallback={<p className="text-muted-foreground">Chargement…</p>}>
        <SteamCompleteInner />
      </Suspense>
    </main>
  )
}
