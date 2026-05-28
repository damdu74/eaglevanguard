"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { RichTextContent } from "@/components/ui/rich-text-content"
import { Pin, Pencil, Trash2, Plus, X, Check } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

type Author = {
  id: string
  steamName: string | null
  discordName: string | null
  name: string | null
  customAvatar: string | null
  steamAvatar: string | null
  discordAvatar: string | null
  image: string | null
}

type Post = {
  id: string
  title: string
  content: string
  isPinned: boolean
  createdAt: string
  updatedAt: string
  author: Author
}

interface Props {
  communitySlug: string
  initialPosts: Post[]
  isStaff: boolean
  currentUserId: string | null
}

function authorAvatar(a: Author) {
  return a.customAvatar ?? a.steamAvatar ?? a.discordAvatar ?? a.image ?? undefined
}

function authorName(a: Author) {
  return a.steamName ?? a.discordName ?? a.name ?? "Membre"
}

export function NewsManager({ communitySlug, initialPosts, isStaff, currentUserId }: Props) {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")
  const [newPinned, setNewPinned] = useState(false)
  const [saving, setSaving] = useState(false)

  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [editPinned, setEditPinned] = useState(false)

  async function handleCreate() {
    if (!newTitle.trim() || !newContent.trim()) return
    setSaving(true)
    const res = await fetch(`/api/communities/${communitySlug}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim(), content: newContent, isPinned: newPinned }),
    })
    if (res.ok) {
      const post: Post = await res.json()
      setPosts((prev) => {
        const next = [post, ...prev]
        return next.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      })
      setNewTitle("")
      setNewContent("")
      setNewPinned(false)
      setShowCreate(false)
    }
    setSaving(false)
  }

  function startEdit(post: Post) {
    setEditingId(post.id)
    setEditTitle(post.title)
    setEditContent(post.content)
    setEditPinned(post.isPinned)
  }

  async function handleEdit(postId: string) {
    setSaving(true)
    const res = await fetch(`/api/communities/${communitySlug}/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle.trim(), content: editContent, isPinned: editPinned }),
    })
    if (res.ok) {
      const updated: Post = await res.json()
      setPosts((prev) => {
        const next = prev.map((p) => (p.id === postId ? updated : p))
        return next.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      })
      setEditingId(null)
    }
    setSaving(false)
  }

  async function handleDelete(postId: string) {
    if (!confirm("Supprimer cette annonce ?")) return
    const res = await fetch(`/api/communities/${communitySlug}/posts/${postId}`, { method: "DELETE" })
    if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  return (
    <div className="space-y-4">
      {isStaff && !showCreate && (
        <Button onClick={() => setShowCreate(true)} variant="outline" className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle annonce
        </Button>
      )}

      {showCreate && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Nouvelle annonce</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNewPinned((v) => !v)}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${newPinned ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground border"}`}
                >
                  <Pin className="h-3 w-3" />
                  {newPinned ? "Épinglée" : "Épingler"}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <Input
              placeholder="Titre de l'annonce"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <RichTextEditor
              value={newContent}
              onChange={setNewContent}
              placeholder="Contenu de l'annonce…"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Annuler</Button>
              <Button size="sm" onClick={handleCreate} disabled={saving || !newTitle.trim() || !newContent.trim()}>
                Publier
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {posts.length === 0 && !showCreate && (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground text-sm">
          Aucune annonce pour le moment.
        </div>
      )}

      {posts.map((post) => {
        const canEdit = isStaff || post.author.id === currentUserId
        const isEditing = editingId === post.id

        return (
          <Card key={post.id} className={post.isPinned ? "border-primary/40" : ""}>
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                    <AvatarImage src={authorAvatar(post.author)} />
                    <AvatarFallback className="text-xs">
                      {authorName(post.author).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    {isEditing ? (
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="font-semibold h-8 mb-1"
                      />
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        {post.isPinned && <Pin className="h-3.5 w-3.5 text-primary shrink-0" />}
                        <p className="font-semibold text-sm">{post.title}</p>
                        {post.isPinned && <Badge variant="outline" className="text-xs">Épinglée</Badge>}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {authorName(post.author)} ·{" "}
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                </div>
                {canEdit && !isEditing && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(post)}
                      className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(post.id)}
                      className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {isEditing ? (
                <div className="space-y-3">
                  <RichTextEditor value={editContent} onChange={setEditContent} />
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setEditPinned((v) => !v)}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${editPinned ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground border"}`}
                    >
                      <Pin className="h-3 w-3" />
                      {editPinned ? "Épinglée" : "Épingler"}
                    </button>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                        <X className="h-3.5 w-3.5 mr-1" />Annuler
                      </Button>
                      <Button size="sm" onClick={() => handleEdit(post.id)} disabled={saving}>
                        <Check className="h-3.5 w-3.5 mr-1" />Enregistrer
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <RichTextContent html={post.content} className="text-sm" />
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
