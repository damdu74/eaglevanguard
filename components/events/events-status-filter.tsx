"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Props {
  isStaff: boolean
  currentStatus: string
}

export function EventsStatusFilter({ isStaff, currentStatus }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") {
      params.delete("status")
    } else {
      params.set("status", value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Select value={currentStatus} onValueChange={handleChange}>
      <SelectTrigger className="w-40 h-9">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Tous</SelectItem>
        <SelectItem value="ONGOING">En cours</SelectItem>
        <SelectItem value="UPCOMING">À venir</SelectItem>
        <SelectItem value="COMPLETED">Terminé</SelectItem>
        {isStaff && <SelectItem value="DRAFT">Brouillon</SelectItem>}
        {isStaff && <SelectItem value="CANCELLED">Annulé</SelectItem>}
      </SelectContent>
    </Select>
  )
}
