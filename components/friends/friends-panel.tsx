"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserCheck, UserX, Users } from "lucide-react"
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

interface ReceivedRequest {
  id: string
  requester: FriendUser
}

interface FriendEntry {
  friendshipId: string
  user: FriendUser
}

interface FriendsPanelProps {
  friends: FriendEntry[]
  received: ReceivedRequest[]
}

function displayName(u: FriendUser) {
  return u.steamName ?? u.discordName ?? u.name ?? "Joueur"
}
function displayAvatar(u: FriendUser) {
  return u.customAvatar ?? u.steamAvatar ?? u.discordAvatar ?? u.image ?? ""
}

export function FriendsPanel({ friends: initialFriends, received: initialReceived }: FriendsPanelProps) {
  const [friends, setFriends] = useState(initialFriends)
  const [received, setReceived] = useState(initialReceived)
  const [loading, setLoading] = useState<string | null>(null)

  async function accept(id: string, requester: FriendUser) {
    setLoading(id)
    const res = await fetch(`/api/friends/${id}`, { method: "PATCH" })
    if (res.ok) {
      setReceived((prev) => prev.filter((r) => r.id !== id))
      setFriends((prev) => [...prev, { friendshipId: id, user: requester }])
    }
    setLoading(null)
  }

  async function decline(id: string) {
    setLoading(id)
    const res = await fetch(`/api/friends/${id}`, { method: "DELETE" })
    if (res.ok) setReceived((prev) => prev.filter((r) => r.id !== id))
    setLoading(null)
  }

  async function removeFriend(friendshipId: string) {
    setLoading(friendshipId)
    const res = await fetch(`/api/friends/${friendshipId}`, { method: "DELETE" })
    if (res.ok) setFriends((prev) => prev.filter((f) => f.friendshipId !== friendshipId))
    setLoading(null)
  }

  return (
    <div className="space-y-4">
      {received.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            Demandes reçues
            <Badge variant="secondary">{received.length}</Badge>
          </p>
          {received.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border px-3 py-2 bg-muted/30">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={displayAvatar(r.requester)} />
                  <AvatarFallback>{displayName(r.requester).slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Link href={`/profile/${r.requester.id}`} className="text-sm font-medium hover:underline">
                  {displayName(r.requester)}
                </Link>
              </div>
              <div className="flex gap-2">
                <Button size="sm" disabled={loading === r.id} onClick={() => accept(r.id, r.requester)}>
                  <UserCheck className="h-4 w-4 mr-1" />Accepter
                </Button>
                <Button size="sm" variant="outline" disabled={loading === r.id} onClick={() => decline(r.id)}>
                  <UserX className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {friends.length > 0 ? (
        <div className="space-y-2">
          {friends.map((f) => (
            <div key={f.friendshipId} className="flex items-center justify-between rounded-lg border px-3 py-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={displayAvatar(f.user)} />
                  <AvatarFallback>{displayName(f.user).slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Link href={`/profile/${f.user.id}`} className="text-sm font-medium hover:underline">
                  {displayName(f.user)}
                </Link>
              </div>
              <Button
                size="sm"
                variant="ghost"
                disabled={loading === f.friendshipId}
                onClick={() => removeFriend(f.friendshipId)}
                className="text-muted-foreground hover:text-destructive"
              >
                Retirer
              </Button>
            </div>
          ))}
        </div>
      ) : (
        received.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
            <Users className="h-8 w-8" />
            <p className="text-sm">Vous n&apos;avez pas encore d&apos;amis.</p>
          </div>
        )
      )}
    </div>
  )
}
