"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useRouter } from "next/navigation"

export function LinkDiscordButton() {
  const router = useRouter()
  return (
    <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push("/api/auth/discord-link")}>
      <Image src="/discord-logo.svg" alt="Discord" width={16} height={16} />
      Lier Discord
    </Button>
  )
}
