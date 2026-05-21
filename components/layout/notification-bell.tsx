"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Bell, Users, ClipboardList, CheckCheck, ExternalLink } from "lucide-react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

interface Notif {
  id: string
  type: string
  message: string
  link: string | null
  read: boolean
  createdAt: string
}

interface Props {
  initialFriendRequests: number
  initialPendingApplications: number
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  APPLICATION_ACCEPTED: <span className="text-green-500 text-xs font-bold">✓</span>,
  APPLICATION_REJECTED: <span className="text-red-500 text-xs font-bold">✗</span>,
  FRIEND_ACCEPTED: <Users className="h-3.5 w-3.5 text-blue-500" />,
  FRIEND_REJECTED: <Users className="h-3.5 w-3.5 text-red-500" />,
}

export function NotificationBell({ initialFriendRequests, initialPendingApplications }: Props) {
  const router = useRouter()
  const [friendRequests, setFriendRequests] = useState(initialFriendRequests)
  const [pendingApplications, setPendingApplications] = useState(initialPendingApplications)
  const [notifications, setNotifications] = useState<Notif[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  const total = friendRequests + pendingApplications + unreadCount

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 10000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchAll() {
    try {
      const res = await fetch("/api/notifications")
      if (!res.ok) return
      const data = await res.json()
      setFriendRequests(data.friendRequests ?? 0)
      setPendingApplications(data.pendingApplications ?? 0)
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)
      router.refresh()
    } catch {}
  }

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" })
    setUnreadCount(0)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const hasActionable = friendRequests > 0 || pendingApplications > 0
  const hasNotifs = notifications.length > 0

  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={200} closeDelay={150}>
      <HoverCardTrigger asChild>
        <button
          className="relative flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted transition-colors"
          title={total > 0 ? `${total} notification${total > 1 ? "s" : ""}` : "Notifications"}
        >
          <Bell className="h-4 w-4" />
          {total > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
              {total > 9 ? "9+" : total}
            </span>
          )}
        </button>
      </HoverCardTrigger>

      <HoverCardContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Tout marquer lu
            </button>
          )}
        </div>

        <div className="divide-y max-h-80 overflow-y-auto">
          {/* Actions en attente */}
          {hasActionable && (
            <>
              {friendRequests > 0 && (
                <Link
                  href="/players/friends"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/10 shrink-0">
                    <Users className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {friendRequests} demande{friendRequests > 1 ? "s" : ""} d&apos;ami
                    </p>
                    <p className="text-xs text-muted-foreground">En attente de réponse</p>
                  </div>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shrink-0">
                    {friendRequests > 9 ? "9+" : friendRequests}
                  </span>
                </Link>
              )}
              {pendingApplications > 0 && (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500/10 shrink-0">
                    <ClipboardList className="h-3.5 w-3.5 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {pendingApplications} candidature{pendingApplications > 1 ? "s" : ""} en attente
                    </p>
                    <p className="text-xs text-muted-foreground">À traiter</p>
                  </div>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shrink-0">
                    {pendingApplications > 9 ? "9+" : pendingApplications}
                  </span>
                </Link>
              )}
            </>
          )}

          {/* Notifications personnelles */}
          {hasNotifs ? (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3 transition-colors ${!n.read ? "bg-muted/30" : ""}`}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted shrink-0 mt-0.5">
                  {TYPE_ICONS[n.type] ?? <Bell className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: fr })}
                  </p>
                </div>
                {n.link && (
                  <Link
                    href={n.link}
                    onClick={() => setOpen(false)}
                    className="shrink-0 text-muted-foreground hover:text-foreground mt-0.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                )}
                {!n.read && (
                  <span className="h-2 w-2 rounded-full bg-red-500 shrink-0 mt-2" />
                )}
              </div>
            ))
          ) : (
            !hasActionable && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Aucune notification
              </div>
            )
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
