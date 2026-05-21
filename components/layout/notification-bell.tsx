"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Bell } from "lucide-react"

interface Props {
  initialCount: number
}

export function NotificationBell({ initialCount }: Props) {
  const router = useRouter()
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/friends")
        if (!res.ok) return
        const data = await res.json()
        const newCount = data.received?.length ?? 0
        if (newCount !== count) {
          setCount(newCount)
          router.refresh()
        }
      } catch {}
    }

    const interval = setInterval(fetchCount, 10000)
    return () => clearInterval(interval)
  }, [count, router])

  return (
    <Link
      href="/players/friends"
      className="relative flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted transition-colors"
      title={count > 0 ? `${count} demande${count > 1 ? "s" : ""} d'ami` : "Notifications"}
    >
      <Bell className="h-4 w-4" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  )
}
