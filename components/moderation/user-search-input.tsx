"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface UserResult {
  id: string
  steamName: string | null
  discordName: string | null
  name: string | null
  customAvatar: string | null
  steamAvatar: string | null
  discordAvatar: string | null
  image: string | null
}

export interface SelectedUser {
  id: string
  displayName: string
}

interface Props {
  value: SelectedUser | null
  onChange: (user: SelectedUser | null) => void
  placeholder?: string
  forMod?: boolean
}

function getDisplayName(u: UserResult) {
  return u.steamName ?? u.discordName ?? u.name ?? "Utilisateur"
}

function getAvatar(u: UserResult) {
  return u.customAvatar ?? u.steamAvatar ?? u.discordAvatar ?? u.image ?? undefined
}

export function UserSearchInput({ value, onChange, placeholder = "Rechercher un utilisateur...", forMod = false }: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<UserResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ q: query })
        if (forMod) params.set("forMod", "true")
        const res = await fetch(`/api/users/search?${params}`)
        if (res.ok) {
          const data: UserResult[] = await res.json()
          setResults(data)
          setOpen(true)
        }
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [query, forMod])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (value) {
    return (
      <div className="flex items-center gap-2 h-9 px-3 border rounded-md bg-muted/30">
        <span className="text-sm flex-1 truncate">{value.displayName}</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          className="h-9 pl-8"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
      </div>
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover shadow-md overflow-hidden">
          {loading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Recherche...</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Aucun résultat</div>
          ) : (
            <ul>
              {results.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left transition-colors"
                    onClick={() => {
                      onChange({ id: u.id, displayName: getDisplayName(u) })
                      setQuery("")
                      setOpen(false)
                    }}
                  >
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarImage src={getAvatar(u)} />
                      <AvatarFallback className="text-[10px]">{getDisplayName(u)[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{getDisplayName(u)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
