"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Option {
  value: string
  label: string
}

const ALL_OPTIONS: Option[] = [
  { value: "all",       label: "Tous les états" },
  { value: "ONGOING",   label: "En cours" },
  { value: "PUBLISHED", label: "Publié" },
  { value: "DRAFT",     label: "Brouillon" },
  { value: "COMPLETED", label: "Terminé" },
  { value: "CANCELLED", label: "Annulé" },
]

const MEMBER_OPTIONS: Option[] = [
  { value: "all",       label: "Tous les états" },
  { value: "ONGOING",   label: "En cours" },
  { value: "PUBLISHED", label: "Publié" },
  { value: "COMPLETED", label: "Terminé" },
]

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

  const options = isStaff ? ALL_OPTIONS : MEMBER_OPTIONS

  return (
    <Select value={currentStatus} onValueChange={handleChange}>
      <SelectTrigger className="w-40 h-9">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
