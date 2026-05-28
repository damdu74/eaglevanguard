"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type CalendarEvent = {
  id: string
  title: string
  type: string
  status: string
  startDate: string
}

interface Props {
  events: CalendarEvent[]
  communitySlug: string
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted-foreground",
  PUBLISHED: "bg-primary",
  ONGOING: "bg-green-500",
  COMPLETED: "bg-zinc-400",
  CANCELLED: "bg-destructive",
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  ONGOING: "En cours",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
  ARCHIVED: "Archivé",
}

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

export function EventCalendar({ events, communitySlug }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
    setSelectedDay(null)
  }

  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
    setSelectedDay(null)
  }

  const firstDay = new Date(year, month, 1)
  // Lundi = 0 index (ISO: getDay() returns 0=Sun, 1=Mon…)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7

  // Group events by day
  const eventsByDay = new Map<number, CalendarEvent[]>()
  for (const event of events) {
    const d = new Date(event.startDate)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!eventsByDay.has(day)) eventsByDay.set(day, [])
      eventsByDay.get(day)!.push(event)
    }
  }

  const selectedEvents = selectedDay ? (eventsByDay.get(selectedDay) ?? []) : []

  return (
    <div className="space-y-4">
      {/* Header navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="font-semibold">{MONTHS[month]} {year}</p>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Grid */}
      <div className="rounded-lg border overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b bg-muted/40">
          {DAYS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7">
          {Array.from({ length: totalCells }).map((_, i) => {
            const dayNum = i - startOffset + 1
            const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth
            const isToday = isCurrentMonth && dayNum === today.getDate() && month === today.getMonth() && year === today.getFullYear()
            const isSelected = isCurrentMonth && dayNum === selectedDay
            const dayEvents = isCurrentMonth ? (eventsByDay.get(dayNum) ?? []) : []

            return (
              <button
                key={i}
                type="button"
                disabled={!isCurrentMonth || dayEvents.length === 0}
                onClick={() => {
                  if (!isCurrentMonth) return
                  setSelectedDay(dayNum === selectedDay ? null : dayNum)
                }}
                className={cn(
                  "min-h-[64px] sm:min-h-[80px] p-1.5 text-left border-b border-r transition-colors",
                  "last:border-r-0 [&:nth-child(7n)]:border-r-0",
                  !isCurrentMonth && "bg-muted/20 text-muted-foreground/40",
                  isCurrentMonth && dayEvents.length > 0 && "cursor-pointer hover:bg-muted/50",
                  isCurrentMonth && dayEvents.length === 0 && "cursor-default",
                  isSelected && "bg-primary/5",
                )}
              >
                <span className={cn(
                  "text-xs font-medium inline-flex h-6 w-6 items-center justify-center rounded-full",
                  isToday && "bg-primary text-primary-foreground",
                  isSelected && !isToday && "bg-muted text-foreground",
                )}>
                  {isCurrentMonth ? dayNum : ""}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayEvents.slice(0, 2).map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center gap-1"
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", STATUS_COLORS[e.status] ?? "bg-primary")} />
                      <span className="text-[10px] leading-tight truncate hidden sm:block">{e.title}</span>
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <p className="text-[10px] text-muted-foreground pl-2.5">+{dayEvents.length - 2}</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day events */}
      {selectedDay && selectedEvents.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">
            {selectedDay} {MONTHS[month]} {year}
          </p>
          {selectedEvents.map((e) => (
            <Link
              key={e.id}
              href={`/communities/${communitySlug}/events/${e.id}`}
              className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={cn("h-2 w-2 rounded-full shrink-0", STATUS_COLORS[e.status] ?? "bg-primary")} />
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{e.type}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">
                {STATUS_LABELS[e.status] ?? e.status}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
