"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Bell, Users, ClipboardList } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Props {
  initialFriendRequests: number
  initialPendingApplications: number
}

export function NotificationBell({ initialFriendRequests, initialPendingApplications }: Props) {
  const router = useRouter()
  const [friendRequests, setFriendRequests] = useState(initialFriendRequests)
  const [pendingApplications, setPendingApplications] = useState(initialPendingApplications)

  const total = friendRequests + pendingApplications

  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await fetch("/api/notifications")
        if (!res.ok) return
        const data = await res.json()
        const newFriends = data.friendRequests ?? 0
        const newApps = data.pendingApplications ?? 0
        if (newFriends !== friendRequests || newApps !== pendingApplications) {
          setFriendRequests(newFriends)
          setPendingApplications(newApps)
          router.refresh()
        }
      } catch {}
    }

    const interval = setInterval(fetchCounts, 10000)
    return () => clearInterval(interval)
  }, [friendRequests, pendingApplications, router])

  if (total === 0) {
    return (
      <button
        className="relative flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted transition-colors"
        title="Notifications"
        disabled
      >
        <Bell className="h-4 w-4" />
      </button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted transition-colors"
          title={`${total} notification${total > 1 ? "s" : ""}`}
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
            {total > 9 ? "9+" : total}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {friendRequests > 0 && (
          <DropdownMenuItem asChild>
            <Link href="/players/friends" className="flex items-center gap-3 cursor-pointer">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>
                {friendRequests} demande{friendRequests > 1 ? "s" : ""} d&apos;ami
              </span>
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                {friendRequests > 9 ? "9+" : friendRequests}
              </span>
            </Link>
          </DropdownMenuItem>
        )}
        {pendingApplications > 0 && (
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="flex items-center gap-3 cursor-pointer">
              <ClipboardList className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>
                {pendingApplications} candidature{pendingApplications > 1 ? "s" : ""} en attente
              </span>
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                {pendingApplications > 9 ? "9+" : pendingApplications}
              </span>
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
