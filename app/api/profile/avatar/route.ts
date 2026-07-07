import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { put } from "@vercel/blob"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const contentType = req.headers.get("content-type") ?? ""

  // File upload via Vercel Blob
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 })

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 5 Mo)" }, { status: 400 })
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Seules les images sont acceptées" }, { status: 400 })
    }

    const ext = file.name.split(".").pop() ?? "png"

    let blob
    try {
      blob = await put(`avatars/${session.user.id}.${ext}`, file, {
        access: "public",
        allowOverwrite: true,
      })
    } catch (err) {
      console.error("[avatar upload] Blob error:", err)
      const msg = err instanceof Error ? err.message : "Erreur Vercel Blob"
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { customAvatar: blob.url },
    })

    return NextResponse.json({ url: blob.url })
  }

  // URL input fallback
  const { url } = await req.json()
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { customAvatar: url },
  })

  return NextResponse.json({ url })
}
