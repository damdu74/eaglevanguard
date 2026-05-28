"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { List, CalendarDays } from "lucide-react"

const STORAGE_KEY = "nexus_events_view"

interface Props {
  currentView: "list" | "calendar"
}

export function EventsViewToggle({ currentView }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  // À l'hydratation, applique la préférence sauvegardée si différente de l'URL courante
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem(STORAGE_KEY) as "list" | "calendar" | null
    if (saved && saved !== currentView) {
      if (saved === "calendar") {
        router.replace(`${pathname}?view=calendar`)
      } else {
        router.replace(pathname)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function switchTo(view: "list" | "calendar") {
    localStorage.setItem(STORAGE_KEY, view)
    if (view === "calendar") {
      router.push(`${pathname}?view=calendar`)
    } else {
      router.push(pathname)
    }
  }

  if (!mounted) return null

  return (
    <div className="flex items-center rounded-md border">
      <button
        type="button"
        onClick={() => switchTo("list")}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-l-md transition-colors ${
          currentView === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <List className="h-3.5 w-3.5" />
        Liste
      </button>
      <button
        type="button"
        onClick={() => switchTo("calendar")}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-r-md transition-colors ${
          currentView === "calendar" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <CalendarDays className="h-3.5 w-3.5" />
        Calendrier
      </button>
    </div>
  )
}
