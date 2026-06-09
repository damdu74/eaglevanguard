"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MessageSquarePlus, Search, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { useEffect } from "react"
import { cn } from "@/lib/utils"

interface UserInfo {
  id: string
  steamName: string | null
  discordName: string | null
  name: string | null
  customAvatar: string | null
  steamAvatar: string | null
  discordAvatar: string | null
  image: string | null
}

interface ConversationItem {
  id: string
  otherUser: UserInfo
  lastMessage: { content: string; createdAt: string; senderId: string } | null
  unreadCount: number
  isBlocked: boolean
  isBlockedBy: boolean
  updatedAt: string
}

function userName(u: UserInfo) {
  return u.steamName ?? u.discordName ?? u.name ?? "Joueur"
}
function userAvatar(u: UserInfo) {
  return u.customAvatar ?? u.steamAvatar ?? u.discordAvatar ?? u.image ?? ""
}

interface Props {
  initialConversations: ConversationItem[]
}

export function ConversationList({ initialConversations }: Props) {
  const router = useRouter()
  const [conversations, setConversations] = useState(initialConversations)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UserInfo[]>([])
  const [loadingStart, setLoadingStart] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const debouncedQuery = useDebounce(searchQuery, 300)

  useEffect(() => {
    fetch("/api/messages")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setConversations(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSearchResults([])
      return
    }
    fetch(`/api/users/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then(setSearchResults)
      .catch(() => {})
  }, [debouncedQuery])

  async function deleteConversation(e: React.MouseEvent, convId: string) {
    e.preventDefault()
    setDeletingId(convId)
    try {
      const res = await fetch(`/api/messages/${convId}`, { method: "DELETE" })
      if (res.ok) setConversations((prev) => prev.filter((c) => c.id !== convId))
    } finally {
      setDeletingId(null)
    }
  }

  async function startConversation(userId: string) {
    setLoadingStart(userId)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) return
      const { conversationId } = await res.json()
      setDialogOpen(false)
      router.push(`/messages/${conversationId}`)
    } finally {
      setLoadingStart(null)
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <MessageSquarePlus className="h-4 w-4" />
              Nouvelle conversation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Démarrer une conversation</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un joueur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>
              <div className="divide-y rounded-md border">
                {searchResults.length > 0 ? (
                  searchResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => startConversation(u.id)}
                      disabled={loadingStart === u.id}
                      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userAvatar(u)} />
                        <AvatarFallback>{userName(u)[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{userName(u)}</span>
                    </button>
                  ))
                ) : debouncedQuery.length >= 2 ? (
                  <p className="px-4 py-3 text-sm text-muted-foreground">Aucun résultat</p>
                ) : (
                  <p className="px-4 py-3 text-sm text-muted-foreground">Tapez au moins 2 caractères</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquarePlus className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Aucune conversation</p>
          <p className="text-xs mt-1">Démarre une conversation avec un joueur</p>
        </div>
      ) : (
        <div className="divide-y rounded-md border">
          {conversations.map((conv) => (
            <div key={conv.id} className={cn("group flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors", conv.unreadCount > 0 && "bg-muted/30")}>
              <Link href={`/messages/${conv.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={userAvatar(conv.otherUser)} />
                  <AvatarFallback>{userName(conv.otherUser)[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("text-sm", conv.unreadCount > 0 ? "font-semibold" : "font-medium")}>
                      {userName(conv.otherUser)}
                    </span>
                    {conv.lastMessage && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true, locale: fr })}
                      </span>
                    )}
                  </div>
                  {conv.lastMessage ? (
                    <p className={cn("text-xs truncate mt-0.5", conv.unreadCount > 0 ? "text-foreground" : "text-muted-foreground")}>
                      {conv.lastMessage.content}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">Aucun message</p>
                  )}
                </div>
              </Link>
              {conv.unreadCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shrink-0">
                  {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                </span>
              )}
              <button
                onClick={(e) => deleteConversation(e, conv.id)}
                disabled={deletingId === conv.id}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                title="Supprimer la conversation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
