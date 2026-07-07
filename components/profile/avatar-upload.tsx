"use client"

import { useRef, useState, useTransition } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Camera, Loader2 } from "lucide-react"

interface AvatarUploadProps {
  currentImage?: string | null
  displayName: string
}

function compressImage(file: File, maxSize = 512, quality = 0.85): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement("canvas")
      let { width, height } = img
      const ratio = Math.min(maxSize / width, maxSize / height, 1)
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => resolve(new File([blob!], "avatar.jpg", { type: "image/jpeg" })),
        "image/jpeg",
        quality
      )
    }
    img.src = url
  })
}

export function AvatarUpload({ currentImage, displayName }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage ?? null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(rawFile: File) {
    setError(null)
    const file = await compressImage(rawFile)
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
        URL.revokeObjectURL(localPreview)
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
