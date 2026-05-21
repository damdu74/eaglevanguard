"use client"

import { useRouter, usePathname } from "next/navigation"
import { useCallback, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface Props {
  initialQuery: string
}

export function PlayersSearch({ initialQuery }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      startTransition(() => {
        if (value.trim().length >= 2) {
          router.push(`${pathname}?q=${encodeURIComponent(value.trim())}`)
        } else {
          router.push(pathname)
        }
      })
    },
    [router, pathname]
  )

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        defaultValue={initialQuery}
        onChange={handleChange}
        placeholder="Rechercher un joueur…"
        className="pl-9"
      />
    </div>
  )
}
