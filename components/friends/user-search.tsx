"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, UserPlus, Loader2 } from "lucide-react"
import { useDebounce } from "@/lib/hooks/use-debounce"

interface SearchUser {
  id: string
  steamName: string | null
  discordName: string | null
  name: string | null
  customAvatar: string | null
  steamAvatar: string | null
  discordAvatar: string | null
  image: string | null
}

function displayName(u: SearchUser) {
  return u.steamName ?? u.discordName ?? u.name ?? "Joueur"
}
function displayAvatar(u: SearchUser) {
  return u.customAvatar ?? u.steamAvatar ?? u.discordAvatar ?? u.image ?? ""
}

export function UserSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchUser[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState<Set<string>>(new Set())
  const [added, setAdded] = useState<Set<string>>(new Set())
  const debouncedQuery = useDebounce(query, 300)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults([]); return }
    setLoading(true)
    fetch(`/api/users/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data) => setResults(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [debouncedQuery])

  async function addFriend(userId: string) {
    setAdding((prev) => new Set(prev).add(userId))
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
    if (res.ok) setAdded((prev) => new Set(prev).add(userId))
    setAdding((prev) => { const s = new Set(prev); s.delete(userId); return s })
  }

  return (
    <div className="space-y-3" ref={ref}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un joueur…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2">
          {results.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={displayAvatar(u)} />
                  <AvatarFallback>{displayName(u).slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{displayName(u)}</span>
              </div>
              <Button
                size="sm"
                variant={added.has(u.id) ? "secondary" : "outline"}
                disabled={adding.has(u.id) || added.has(u.id)}
                onClick={() => addFriend(u.id)}
              >
                {adding.has(u.id) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : added.has(u.id) ? (
                  "Demande envoyée"
                ) : (
                  <><UserPlus className="h-4 w-4 mr-1" />Ajouter</>
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      {!loading && query.length >= 2 && results.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-3">Aucun joueur trouvé.</p>
      )}
    </div>
  )
}
