"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Loader2, ArrowRightLeft } from "lucide-react"
import Image from "next/image"

interface Member {
  id: string
  name: string
  image: string | null
}

interface Props {
  slug: string
  members: Member[]
}

export function TransferOwnershipForm({ slug, members }: Props) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState("")
  const [confirmName, setConfirmName] = useState("")
  const [loading, setLoading] = useState(false)

  const selectedMember = members.find((m) => m.id === selectedId)
  const isReady = selectedMember && confirmName === selectedMember.name

  async function handleTransfer() {
    if (!isReady) return
    setLoading(true)
    try {
      const res = await fetch(`/api/communities/${slug}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: selectedId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error((json.error as string) ?? "Erreur")
      toast.success(`La communauté a été transférée à ${selectedMember!.name}`)
      router.push(`/communities/${slug}`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-orange-500/40">
      <CardHeader>
        <CardTitle className="text-orange-500 flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5" />
          Transférer la propriété
        </CardTitle>
        <CardDescription>
          Transmettez la communauté à un autre membre. Vous deviendrez membre simple et ne pourrez plus effectuer les actions réservées au fondateur.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Separator />

        <div className="space-y-1">
          <Label>Nouveau fondateur</Label>
          <Select onValueChange={(v) => { setSelectedId(v); setConfirmName("") }}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez un membre" />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  <div className="flex items-center gap-2">
                    {m.image ? (
                      <Image src={m.image} alt={m.name} width={20} height={20} className="rounded-full object-cover" />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-xs">
                        {m.name[0]?.toUpperCase()}
                      </div>
                    )}
                    {m.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedMember && (
          <div className="space-y-2">
            <Label htmlFor="confirm-transfer">
              Tapez{" "}
              <span className="font-mono font-semibold">{selectedMember.name}</span>{" "}
              pour confirmer le transfert
            </Label>
            <Input
              id="confirm-transfer"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={selectedMember.name}
            />
          </div>
        )}

        <div className="flex justify-end">
          <Button
            variant="outline"
            className="border-orange-500 text-orange-500 hover:bg-orange-500/10 hover:text-orange-500"
            onClick={handleTransfer}
            disabled={!isReady || loading}
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Transfert en cours…</>
            ) : (
              <><ArrowRightLeft className="mr-2 h-4 w-4" />Transférer la propriété</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
