"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Ban, Send, ShieldOff, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
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

interface MessageItem {
  id: string
  content: string
  read: boolean
  createdAt: string
  sender: UserInfo
}

interface Props {
  conversationId: string
  currentUserId: string
  otherUser: UserInfo
  initialMessages: MessageItem[]
  initialIsBlocked: boolean
  initialIsBlockedBy: boolean
}

function userName(u: UserInfo) {
  return u.steamName ?? u.discordName ?? u.name ?? "Joueur"
}
function userAvatar(u: UserInfo) {
  return u.customAvatar ?? u.steamAvatar ?? u.discordAvatar ?? u.image ?? ""
}

export function MessageThread({
  conversationId,
  currentUserId,
  otherUser,
  initialMessages,
  initialIsBlocked,
  initialIsBlockedBy,
}: Props) {
  const [messages, setMessages] = useState(initialMessages)
  const [isBlocked, setIsBlocked] = useState(initialIsBlocked)
  const [isBlockedBy, setIsBlockedBy] = useState(initialIsBlockedBy)
  const [content, setContent] = useState("")
  const [sending, setSending] = useState(false)
  const [blockLoading, setBlockLoading] = useState(false)
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastFetchRef = useRef(new Date().toISOString())

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Polling toutes les 5 secondes pour les nouveaux messages
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/messages/${conversationId}`)
        if (!res.ok) return
        const data = await res.json()
        setMessages(data.messages)
        setIsBlocked(data.isBlocked)
        setIsBlockedBy(data.isBlockedBy)
        // Marquer comme lu
        fetch(`/api/messages/${conversationId}/read`, { method: "PATCH" }).catch(() => {})
      } catch {}
    }

    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [conversationId])

  async function sendMessage() {
    if (!content.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) return
      const msg = await res.json()
      setMessages((prev) => [...prev, msg])
      setContent("")
      lastFetchRef.current = msg.createdAt
    } finally {
      setSending(false)
    }
  }

  async function deleteMessage(messageId: string) {
    setDeletingMessageId(messageId)
    try {
      const res = await fetch(`/api/messages/${conversationId}/${messageId}`, { method: "DELETE" })
      if (res.ok) setMessages((prev) => prev.filter((m) => m.id !== messageId))
    } finally {
      setDeletingMessageId(null)
    }
  }

  async function toggleBlock() {
    setBlockLoading(true)
    try {
      const method = isBlocked ? "DELETE" : "POST"
      const res = await fetch(`/api/users/${otherUser.id}/block`, { method })
      if (res.ok) setIsBlocked(!isBlocked)
    } finally {
      setBlockLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const canSend = !isBlockedBy

  return (
    <div className="flex flex-col flex-1 min-h-0 border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30 shrink-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userAvatar(otherUser)} />
            <AvatarFallback>{userName(otherUser)[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="font-semibold text-sm">{userName(otherUser)}</span>
          {isBlocked && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Bloqué</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleBlock}
          disabled={blockLoading}
          className={cn("gap-2 text-xs", isBlocked ? "text-muted-foreground" : "text-destructive hover:text-destructive")}
        >
          {isBlocked ? (
            <><ShieldOff className="h-3.5 w-3.5" /> Débloquer</>
          ) : (
            <><Ban className="h-3.5 w-3.5" /> Bloquer</>
          )}
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Aucun message — envoyez le premier !
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender.id === currentUserId
            return (
              <div key={msg.id} className={cn("group flex gap-2 items-end", isOwn ? "justify-end" : "justify-start")}>
                {!isOwn && (
                  <Avatar className="h-7 w-7 shrink-0 mb-4">
                    <AvatarImage src={userAvatar(msg.sender)} />
                    <AvatarFallback>{userName(msg.sender)[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
                {isOwn && (
                  <button
                    onClick={() => deleteMessage(msg.id)}
                    disabled={deletingMessageId === msg.id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity mb-4 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0"
                    title="Supprimer le message"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <div className={cn("max-w-[70%] space-y-1", isOwn ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "rounded-2xl px-3 py-2 text-sm break-words",
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted rounded-bl-sm"
                    )}
                  >
                    {msg.content}
                  </div>
                  <p className={cn("text-[11px] text-muted-foreground px-1", isOwn ? "text-right" : "text-left")}>
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: fr })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t p-3">
        {isBlockedBy ? (
          <p className="text-center text-sm text-muted-foreground py-2">
            Vous ne pouvez pas envoyer de messages à cet utilisateur.
          </p>
        ) : (
          <div className="flex gap-2 items-end">
            <Textarea
              placeholder="Écrire un message… (Entrée pour envoyer, Maj+Entrée pour sauter une ligne)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              className="resize-none min-h-[40px] max-h-32"
              disabled={sending}
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={!content.trim() || sending || !canSend}
              className="shrink-0 h-10 w-10"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
