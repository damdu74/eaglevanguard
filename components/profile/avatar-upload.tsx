"use client"

import { useRef, useState, useTransition } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Camera, Loader2 } from "lucide-react"

interface AvatarUploadProps {
  currentImage?: string | null
  displayName: string
}

export function AvatarUpload({ currentImage, displayName }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage ?? null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (file.size > 4 * 1024 * 1024) {
      setError("Fichier trop lourd (max 4 Mo)")
      return
    }
    setError(null)
    const localPreview = URL.createObjectURL(file)
    setPreview(localPreview)

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append("file", file)
        const res = await fetch("/api/profile/avatar", { method: "POST", body: formData })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.error ?? `Erreur ${res.status}`)
        }
        window.location.reload()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de l'upload. Réessayez.")
        setPreview(currentImage ?? null)
      }
    })
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
        <Avatar className="h-24 w-24">
          <AvatarImage src={preview ?? undefined} />
          <AvatarFallback className="text-2xl">{displayName[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {isPending ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => fileRef.current?.click()}
        disabled={isPending}
      >
        {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Upload en cours…</> : "Changer la photo"}
      </Button>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ""
        }}
      />
    </div>
  )
}
