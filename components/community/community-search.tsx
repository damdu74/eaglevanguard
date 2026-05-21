"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  games: string[]
}

export function CommunitySearch({ games }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const q = searchParams.get("q") ?? ""
  const game = searchParams.get("game") ?? ""

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete("page")
      startTransition(() => router.push(`${pathname}?${params.toString()}`))
    },
    [router, pathname, searchParams]
  )

  const hasFilters = q || game

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Rechercher une communauté..."
          defaultValue={q}
          className="pl-9"
          onChange={(e) => update("q", e.target.value)}
        />
      </div>

      {games.length > 0 && (
        <select
          value={game}
          onChange={(e) => update("game", e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="">Tous les jeux</option>
          {games.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      )}

      {hasFilters && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            startTransition(() => router.push(pathname))
          }}
          title="Effacer les filtres"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
