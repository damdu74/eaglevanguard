"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Props {
  slug: string
  currentLogoUrl?: string | null
}

export function CommunityLogoUpload({ slug, currentLogoUrl }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<string>(currentLogoUrl ?? "")
  const [urlInput, setUrlInput] = useState<string>(currentLogoUrl ?? "")

  async function uploadFile(file: File) {
    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch(`/api/communities/${slug}/logo-upload`, {
        method: "POST",
        body: form,
      })
      if (!res.ok) throw new Error()
      const { url } = await res.json()
      setPreview(url)
      toast.success("Logo mis à jour")
      router.refresh()
    } catch {
      toast.error("Erreur lors du téléversement")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function saveUrl() {
    if (urlInput && !/^https?:\/\/.+/.test(urlInput)) {
      toast.error("L'URL doit commencer par http:// ou https://")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/communities/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: urlInput || null }),
      })
      if (!res.ok) throw new Error()
      setPreview(urlInput)
      toast.success("Logo mis à jour")
      router.refresh()
    } catch {
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <Label>Logo de la communauté</Label>
      <div className="flex gap-4 items-start">
        {/* Aperçu */}
        <div className="w-20 h-20 rounded-lg border border-border bg-muted/30 flex items-center justify-center shrink-0 overflow-hidden">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Logo"
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              onError={() => setPreview("")}
            />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
          )}
        </div>

        <div className="flex-1 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) uploadFile(file)
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading
              ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Téléversement...</>
              : <><Upload className="mr-2 h-3.5 w-3.5" />Depuis le PC</>
            }
          </Button>
          <div className="relative flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] text-muted-foreground">ou URL</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="flex gap-2">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://..."
              className="text-xs h-8"
            />
            <Button
              type="button"
              size="sm"
              className="h-8 shrink-0"
              disabled={saving || urlInput === (currentLogoUrl ?? "")}
              onClick={saveUrl}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "OK"}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Évite les liens Discord — ils expirent. Préfère l&apos;upload ou un hébergeur permanent (Imgur, GitHub…).
          </p>
        </div>
      </div>
    </div>
  )
}
