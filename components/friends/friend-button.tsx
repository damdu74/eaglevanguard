"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus, UserCheck, UserX, Clock } from "lucide-react"

type FriendStatus =
  | { type: "none" }
  | { type: "sent"; friendshipId: string }
  | { type: "received"; friendshipId: string }
  | { type: "friends"; friendshipId: string }

interface FriendButtonProps {
  targetId: string
  initialStatus: FriendStatus
}

export function FriendButton({ targetId, initialStatus }: FriendButtonProps) {
  const [status, setStatus] = useState<FriendStatus>(initialStatus)
  const [loading, setLoading] = useState(false)

  async function sendRequest() {
    setLoading(true)
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: targetId }),
    })
    if (res.ok) {
      const data = await res.json()
      setStatus({ type: "sent", friendshipId: data.id })
    }
    setLoading(false)
  }

  async function accept() {
    if (status.type !== "received") return
    setLoading(true)
    const res = await fetch(`/api/friends/${status.friendshipId}`, { method: "PATCH" })
    if (res.ok) setStatus({ type: "friends", friendshipId: status.friendshipId })
    setLoading(false)
  }

  async function remove() {
    if (status.type === "none") return
    setLoading(true)
    const res = await fetch(`/api/friends/${status.friendshipId}`, { method: "DELETE" })
    if (res.ok) setStatus({ type: "none" })
    setLoading(false)
  }

  if (status.type === "none") {
    return (
      <Button onClick={sendRequest} disabled={loading} size="sm">
        <UserPlus className="h-4 w-4 mr-2" />
        Ajouter en ami
      </Button>
    )
  }

  if (status.type === "sent") {
    return (
      <Button onClick={remove} disabled={loading} size="sm" variant="outline">
        <Clock className="h-4 w-4 mr-2" />
        Demande envoyée
      </Button>
    )
  }

  if (status.type === "received") {
    return (
      <div className="flex gap-2">
        <Button onClick={accept} disabled={loading} size="sm">
          <UserCheck className="h-4 w-4 mr-2" />
          Accepter
        </Button>
        <Button onClick={remove} disabled={loading} size="sm" variant="outline">
          <UserX className="h-4 w-4 mr-2" />
          Refuser
        </Button>
      </div>
    )
  }

  return (
    <Button onClick={remove} disabled={loading} size="sm" variant="secondary">
      <UserCheck className="h-4 w-4 mr-2" />
      Ami
    </Button>
  )
}
