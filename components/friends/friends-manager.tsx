"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserSearch } from "@/components/friends/user-search"
import { UserCheck, UserX, Users, Hourglass } from "lucide-react"
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

interface FriendEntry {
  friendshipId: string
  user: FriendUser
}

interface PendingRequest {
  id: string
  requester: FriendUser
}

interface Props {
  initialFriends: FriendEntry[]
  initialReceived: PendingRequest[]
}

function name(u: FriendUser) {
  return u.steamName ?? u.discordName ?? u.name ?? "Joueur"
}
function avatar(u: FriendUser) {
  return u.customAvatar ?? u.steamAvatar ?? u.discordAvatar ?? u.image ?? ""
}

export function FriendsManager({ initialFriends, initialReceived }: Props) {
  const [friends, setFriends] = useState(initialFriends)
  const [received, setReceived] = useState(initialReceived)
  const [loading, setLoading] = useState<string | null>(null)

  async function accept(request: PendingRequest) {
    setLoading(request.id)
    const res = await fetch(`/api/friends/${request.id}`, { method: "PATCH" })
    if (res.ok) {
      setReceived((prev) => prev.filter((r) => r.id !== request.id))
      setFriends((prev) => [...prev, { friendshipId: request.id, user: request.requester }])
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Colonne gauche — liste d'amis */}
      <Card>
        <CardHeader>
          <CardTitle>Ma liste d&apos;amis</CardTitle>
          <CardDescription>
            {friends.length} ami{friends.length > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {friends.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground text-center">
              <Users className="h-7 w-7" />
              <p className="text-sm">Vous n&apos;avez pas encore d&apos;amis.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((f) => (
                <div key={f.friendshipId} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <Link
                    href={`/profile/${f.user.id}`}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity min-w-0"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={avatar(f.user)} />
                      <AvatarFallback className="text-xs">
                        {name(f.user).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate">{name(f.user)}</span>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={loading === f.friendshipId}
                    onClick={() => removeFriend(f.friendshipId)}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                  >
                    Retirer
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Colonne droite */}
      <div className="space-y-4">
        {/* Invitations en attente */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Invitations en attente</CardTitle>
              {received.length > 0 && (
                <Badge variant="destructive" className="text-white">{received.length}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {received.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground text-center">
                <Hourglass className="h-7 w-7" />
                <p className="text-sm">Aucune invitation en attente.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {received.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 bg-muted/30">
                    <Link
                      href={`/profile/${r.requester.id}`}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0"
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={avatar(r.requester)} />
                        <AvatarFallback className="text-xs">
                          {name(r.requester).slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate">{name(r.requester)}</span>
                    </Link>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="icon"
                        className="h-8 w-8 bg-green-600 hover:bg-green-700 text-white"
                        disabled={loading === r.id}
                        onClick={() => accept(r)}
                        title="Accepter"
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        className="h-8 w-8 bg-red-600 hover:bg-red-700 text-white"
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
            )}
          </CardContent>
        </Card>

        {/* Ajouter un ami */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ajouter un ami</CardTitle>
            <CardDescription>Recherchez un joueur par son pseudo.</CardDescription>
          </CardHeader>
          <CardContent>
            <UserSearch />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
