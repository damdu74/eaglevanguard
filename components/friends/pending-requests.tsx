"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { UserCheck, UserX, Hourglass } from "lucide-react"
import Link from "next/link"

interface FriendUser {
  id: string
  steamName: string | null
  discordName: string | null
  name: string | null
  customAvatar: string | null
  steamAvatar: string | null
  discordAvatar: string | null
  image: string | null
}

interface PendingRequest {
  id: string
  requester: FriendUser
}

interface Props {
  initialReceived: PendingRequest[]
}

function displayName(u: FriendUser) {
  return u.steamName ?? u.discordName ?? u.name ?? "Joueur"
}
function displayAvatar(u: FriendUser) {
  return u.customAvatar ?? u.steamAvatar ?? u.discordAvatar ?? u.image ?? ""
}

export function PendingRequests({ initialReceived }: Props) {
  const router = useRouter()
  const [received, setReceived] = useState(initialReceived)
  const [loading, setLoading] = useState<string | null>(null)

  async function accept(id: string) {
    setLoading(id)
    const res = await fetch(`/api/friends/${id}`, { method: "PATCH" })
    if (res.ok) {
      setReceived((prev) => prev.filter((r) => r.id !== id))
      router.refresh()
    }
    setLoading(null)
  }

  async function decline(id: string) {
    setLoading(id)
    const res = await fetch(`/api/friends/${id}`, { method: "DELETE" })
    if (res.ok) setReceived((prev) => prev.filter((r) => r.id !== id))
    setLoading(null)
  }

  if (received.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground text-center">
        <Hourglass className="h-7 w-7" />
        <p className="text-sm">Aucune invitation en attente.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {received.map((r) => (
        <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 bg-muted/30">
          <Link
            href={`/profile/${r.requester.id}`}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0"
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={displayAvatar(r.requester)} />
              <AvatarFallback className="text-xs">
                {displayName(r.requester).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium truncate">{displayName(r.requester)}</span>
          </Link>
          <div className="flex gap-1 shrink-0">
            <Button
              size="icon"
              className="h-8 w-8"
              disabled={loading === r.id}
              onClick={() => accept(r.id)}
              title="Accepter"
            >
              <UserCheck className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              disabled={loading === r.id}
              onClick={() => decline(r.id)}
              title="Refuser"
            >
              <UserX className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
