"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import ReactFlow, {
  addEdge,
  Background,
  ConnectionMode,
  Controls,
  getSmoothStepPath,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type EdgeProps,
  type Node,
  Panel,
} from "reactflow"
import "reactflow/dist/style.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { OrbatUnitNode, type OrbatRole } from "./orbat-unit-node"
import { OrbatGameNode } from "./orbat-game-node"
import { NATO_TYPES, NATO_SIZES, NATO_MODIFIERS } from "./nato-symbol"
import { Download, Loader2, Plus, Save, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { toPng } from "html-to-image"

interface CommunityMember {
  id: string
  name: string
  image?: string | null
  role: string
  characterName?: string | null
  gradeLabel?: string | null
  gradeIcon?: string | null
  gradeAbbrev?: string | null
}

function OrbatEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected }: EdgeProps) {
  const [path] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    borderRadius: 0,
  })

  return (
    <path
      id={id}
      d={path}
      className="react-flow__edge-path"
      style={{
        stroke: selected ? "hsl(var(--primary))" : "hsl(var(--foreground))",
        strokeWidth: selected ? 2 : 1.5,
        fill: "none",
      }}
    />
  )
}

const ROOT_ID = "root"
const SNAP_GRID: [number, number] = [20, 20]
const GAME_LABELS: Record<string, string> = { arma3: "Arma 3" }

function snapVal(v: number) {
  return Math.round(v / SNAP_GRID[0]) * SNAP_GRID[0]
}

function makeRootNode(label = "Commandement", imageUrl = "", communityRoot = false): Node {
  return {
    id: ROOT_ID,
    type: "unit",
    position: { x: 0, y: 0 },
    draggable: false,
    deletable: false,
    data: { label, type: "hq", size: "", isRoot: true, communityRoot, callsign: "", imageUrl, roles: [] },
  }
}

interface OrbatEditorProps {
  communitySlug: string
  unitId?: string
  rootLabel?: string
  communityLogoUrl?: string | null
  communityUnits?: { id: string; name: string; game?: string | null }[]
  unitRootData?: Record<string, Record<string, unknown>>
  initialNodes?: Node[]
  initialEdges?: Edge[]
  readOnly?: boolean
}

function mergeUnitRoot(node: Node, unitRootData?: Record<string, Record<string, unknown>>): Node {
  const rpUnitId = node.data?.rpUnitId
  if (!rpUnitId || !unitRootData?.[rpUnitId]) return node
  const root = unitRootData[rpUnitId]
  return {
    ...node,
    data: {
      ...node.data,
      label:    String(root.label    ?? node.data.label ?? ""),
      imageUrl: String(root.imageUrl ?? ""),
      type:     String(root.type     ?? node.data.type ?? "infantry"),
      size:     String(root.size     ?? ""),
      callsign: String(root.callsign ?? ""),
      modifier: String(root.modifier ?? ""),
      roles:    Array.isArray(root.roles) ? root.roles : [],
    },
  }
}

interface EditState {
  nodeId: string
  nodeType: string
  initialRoleCount: number
  label: string
  type: string
  size: string
  callsign: string
  imageUrl: string
  modifier: string
  roles: OrbatRole[]
  rpUnitId: string
}

export function OrbatEditor({
  communitySlug,
  unitId,
  rootLabel,
  communityLogoUrl,
  communityUnits,
  unitRootData,
  initialNodes = [],
  initialEdges = [],
  readOnly = false,
}: OrbatEditorProps) {
  const apiBase = unitId
    ? `/api/communities/${communitySlug}/rp/units/${unitId}/orbat`
    : `/api/communities/${communitySlug}/orbat`

  const isCommunityOrbat = !unitId
  const hasRoot = initialNodes.some((n) => n.id === ROOT_ID)
  const baseNodes = (hasRoot ? initialNodes : [makeRootNode(rootLabel, communityLogoUrl ?? "", isCommunityOrbat), ...initialNodes])
    .map((n) => {
      if (n.id === ROOT_ID) {
        return {
          ...n,
          data: {
            ...n.data,
            label: rootLabel ?? n.data.label,
            ...(isCommunityOrbat && { imageUrl: communityLogoUrl ?? "", communityRoot: true }),
          },
        }
      }
      return isCommunityOrbat ? mergeUnitRoot(n, unitRootData) : n
    })

  // Injection automatique des nœuds game-group pour l'ORBAT général
  const baseEdgeList = initialEdges.map((e) => ({ ...e, type: "orbat" }))
  let augmentedNodes = baseNodes
  let augmentedEdges = baseEdgeList

  if (isCommunityOrbat) {
    const units = communityUnits ?? []
    const games = Array.from(new Set(units.filter((u) => u.game).map((u) => u.game as string)))
    const extraNodes: Node[] = []
    const extraEdges: Edge[] = []

    for (const game of games) {
      const gameNodeId = `game-${game}`
      const unitIdsForGame = new Set(units.filter((u) => u.game === game).map((u) => u.id))
      const unitNodesForGame = baseNodes.filter((n) => unitIdsForGame.has(n.data?.rpUnitId))

      if (!baseNodes.find((n) => n.id === gameNodeId)) {
        const avgX = unitNodesForGame.length
          ? unitNodesForGame.reduce((sum, n) => sum + n.position.x, 0) / unitNodesForGame.length
          : 380
        const minY = unitNodesForGame.length
          ? Math.min(...unitNodesForGame.map((n) => n.position.y))
          : 200
        extraNodes.push({
          id: gameNodeId,
          type: "game-group",
          position: { x: snapVal(avgX), y: snapVal(Math.max(minY - 200, 80)) },
          data: { label: GAME_LABELS[game] ?? game },
        })
      }

      // Racine → groupe jeu (bottom → top)
      if (!baseEdgeList.find((e) => e.source === ROOT_ID && e.target === gameNodeId)) {
        extraEdges.push({ id: `auto-root-${gameNodeId}`, source: ROOT_ID, sourceHandle: "bottom", target: gameNodeId, targetHandle: "top", type: "orbat" } as Edge)
      }

      // Groupe jeu → unités (bottom → top)
      for (const n of unitNodesForGame) {
        if (!baseEdgeList.find((e) => e.source === gameNodeId && e.target === n.id)) {
          extraEdges.push({ id: `auto-${gameNodeId}-${n.id}`, source: gameNodeId, sourceHandle: "bottom", target: n.id, targetHandle: "top", type: "orbat" } as Edge)
        }
      }
    }

    augmentedNodes = [...baseNodes, ...extraNodes]
    augmentedEdges = [...baseEdgeList, ...extraEdges] as typeof baseEdgeList
  }

  const [nodes, setNodes, onNodesChange] = useNodesState(augmentedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(augmentedEdges)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch members : personnages de l'unité si unitId, sinon tous les membres
  // Re-fetch toutes les 15s + dès que l'onglet redevient visible
  useEffect(() => {
    const url = unitId
      ? `/api/communities/${communitySlug}/rp/units/${unitId}/characters`
      : `/api/communities/${communitySlug}/members`

    const fetchMembers = () => {
      fetch(url)
        .then((r) => r.json())
        .then((data) => setMembers(data.members ?? []))
        .catch(() => {})
    }

    fetchMembers()
    const interval = setInterval(fetchMembers, 15000)
    const onVisibility = () => { if (document.visibilityState === "visible") fetchMembers() }
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [communitySlug, unitId])

  // Sync les données de grade dans les rôles existants dès que les membres sont chargés
  useEffect(() => {
    if (members.length === 0) return
    setNodes((nds) =>
      nds.map((n) => {
        const roles: OrbatRole[] = n.data.roles ?? []
        if (roles.length === 0) return n
        const updated = roles.map((role) => {
          if (!role.memberId) return role
          const m = members.find((mb) => mb.id === role.memberId)
          if (!m) return role
          return {
            ...role,
            memberName:    m.name           ?? role.memberName,
            characterName: m.characterName  ?? m.name ?? role.characterName,
            gradeLabel:    m.gradeLabel     ?? "",
            gradeIcon:     m.gradeIcon      ?? "",
            gradeAbbrev:   m.gradeAbbrev    ?? "",
          }
        })
        return { ...n, data: { ...n.data, roles: updated } }
      })
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editState) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch(`/api/communities/${communitySlug}/orbat/upload`, {
        method: "POST",
        body: form,
      })
      if (!res.ok) throw new Error()
      const { url } = await res.json()
      setEditState((prev) => prev ? { ...prev, imageUrl: url } : prev)
    } catch {
      toast.error("Erreur lors du téléversement")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  nodesRef.current = nodes
  edgesRef.current = edges

  const addNode = useCallback(() => {
    const newId = `unit-${Date.now()}`
    const last = nodesRef.current[nodesRef.current.length - 1]
    const position = last
      ? { x: snapVal(last.position.x + 380), y: snapVal(last.position.y) }
      : { x: snapVal(380), y: snapVal(0) }

    setNodes((nds) => [
      ...nds,
      {
        id: newId,
        type: "unit",
        position,
        data: { label: "Nouvelle unité", type: "infantry", size: "", callsign: "", imageUrl: "", modifier: "", roles: [], rpUnitId: null },
      },
    ])
    setEditState({ nodeId: newId, nodeType: "unit", initialRoleCount: 0, label: "Nouvelle unité", type: "infantry", size: "", callsign: "", imageUrl: "", modifier: "", roles: [], rpUnitId: "" })
  }, [setNodes])

const toggleLock = useCallback((nodeId: string) => {
    setNodes((nds) =>
      nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, locked: !n.data.locked } } : n)
    )
  }, [setNodes])

  const openEdit = useCallback((nodeId: string) => {
    const node = nodesRef.current.find((n) => n.id === nodeId)
    if (!node || node.data?.communityRoot) return

    if (node.type === "game-group") {
      setEditState({ nodeId, nodeType: "game-group", initialRoleCount: 0, label: node.data.label ?? "", type: "", size: "", callsign: "", imageUrl: "", modifier: "", roles: [], rpUnitId: "" })
      return
    }

    const roles = node.data.roles ?? []
    setEditState({
      nodeId,
      nodeType: "unit",
      initialRoleCount: roles.length,
      label: node.data.label ?? "",
      type: node.data.type ?? "infantry",
      size: node.data.size ?? "",
      callsign: node.data.callsign ?? "",
      imageUrl: node.data.imageUrl ?? "",
      modifier: node.data.modifier ?? "",
      roles,
      rpUnitId: node.data.rpUnitId ?? "",
    })
  }, [])

  const nodesWithCallbacks = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        draggable: n.id === ROOT_ID ? false : !n.data.locked,
        selectable: true,
        data: {
          ...n.data,
          readOnly,
          communitySlug,
          onToggleLock: readOnly ? undefined : toggleLock,
          onEdit: readOnly ? undefined : openEdit,
        },
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodes, readOnly]
  )

  const nodeTypes = useMemo(() => ({ unit: OrbatUnitNode, "game-group": OrbatGameNode }), [])
  const edgeTypes = useMemo(() => ({ orbat: OrbatEdge }), [])

  const removeSelected = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected || n.id === ROOT_ID))
    setEdges((eds) => eds.filter((e) => !e.selected))
  }, [setNodes, setEdges])

  const applyEdit = useCallback(() => {
    if (!editState) return

    if (editState.nodeType === "game-group") {
      setNodes((nds) =>
        nds.map((n) => n.id === editState.nodeId ? { ...n, data: { ...n.data, label: editState.label } } : n)
      )
      setEditState(null)
      return
    }

    const ROLE_ROW_H = 28
    const deltaRoles = editState.roles.length - editState.initialRoleCount
    const shift = deltaRoles * ROLE_ROW_H

    // Y du nœud édité : tout ce qui est strictement en dessous doit décaler
    const editedY = nodesRef.current.find((n) => n.id === editState.nodeId)?.position.y ?? 0

    setNodes((nds) =>
      nds.map((n) => {
        const isEdited = n.id === editState.nodeId
        const shouldShift = shift !== 0 && !isEdited && n.position.y > editedY
        if (!isEdited) {
          return shouldShift ? { ...n, position: { ...n.position, y: snapVal(n.position.y + shift) } } : n
        }
        const updatedNode: Node = {
          ...n,
          data: {
            ...n.data,
            label:    editState.label,
            type:     editState.type,
            size:     editState.size,
            callsign: editState.callsign,
            imageUrl: editState.imageUrl,
            modifier: editState.modifier,
            roles:    editState.roles,
            rpUnitId: editState.rpUnitId || null,
          },
        }
        return isCommunityOrbat ? mergeUnitRoot(updatedNode, unitRootData) : updatedNode
      })
    )
    setEditState(null)
  }, [editState, setNodes])

  const updateRole = (index: number, patch: Partial<OrbatRole>) => {
    if (!editState) return
    const newRoles = editState.roles.map((r, i) => i === index ? { ...r, ...patch } : r)
    setEditState({ ...editState, roles: newRoles })
  }

  const addRole = () => {
    if (!editState) return
    setEditState({
      ...editState,
      roles: [...editState.roles, { id: `role-${Date.now()}`, title: "", memberId: "", memberName: "" }],
    })
  }

  const removeRole = (index: number) => {
    if (!editState) return
    setEditState({ ...editState, roles: editState.roles.filter((_, i) => i !== index) })
  }

  const exportPng = async () => {
    const el = document.querySelector<HTMLElement>(".react-flow__viewport")
    if (!el) return
    setExporting(true)
    try {
      const dataUrl = await toPng(el, { cacheBust: true, backgroundColor: "#09090b" })
      const link = document.createElement("a")
      link.download = `orbat-${communitySlug}.png`
      link.href = dataUrl
      link.click()
    } catch {
      toast.error("Erreur lors de l'export")
    } finally {
      setExporting(false)
    }
  }

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({ ...params, type: "orbat" }, eds))
  }, [setEdges])

  const save = async () => {
    setSaving(true)
    try {
      const cleanNodes = nodesRef.current.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: {
          label:    n.data?.label    ?? "",
          type:     n.data?.type     ?? "infantry",
          size:     n.data?.size     ?? "",
          callsign: n.data?.callsign ?? "",
          imageUrl: n.data?.imageUrl ?? "",
          modifier: n.data?.modifier ?? "",
          roles:    n.data?.roles    ?? [],
          isRoot:   n.data?.isRoot   ?? false,
          locked:   n.data?.locked   ?? false,
          rpUnitId: n.data?.rpUnitId ?? null,
        },
      }))
      const res = await fetch(apiBase, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes: cleanNodes, edges }),
      })
      if (!res.ok) throw new Error("Save failed")
      toast.success("ORBAT sauvegardé")
    } catch {
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="h-[72vh] w-full rounded-lg border">
        <ReactFlow
          nodes={nodesWithCallbacks}
          edges={edges}
          onNodesChange={readOnly ? undefined : onNodesChange}
          onEdgesChange={readOnly ? undefined : onEdgesChange}
          onConnect={readOnly ? undefined : onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: "orbat" }}
          nodesConnectable={!readOnly}
          connectionMode={ConnectionMode.Loose}
          snapToGrid={!readOnly}
          snapGrid={SNAP_GRID}
          translateExtent={[[-Infinity, -100], [Infinity, Infinity]]}
        >
          <Background gap={SNAP_GRID[0]} />
          <Controls />
          <MiniMap />

          {!readOnly && (
            <Panel position="top-right" className="flex gap-2">
              <Button size="sm" onClick={addNode} className="bg-green-600 hover:bg-green-700 text-white border-0">
                <Plus className="mr-1 h-4 w-4" />
                Ajouter
              </Button>
              <Button size="sm" variant="outline" onClick={removeSelected}>
                <Trash2 className="mr-1 h-4 w-4" />
                Supprimer la sélection
              </Button>
              <Button size="sm" onClick={save} disabled={saving}>
                <Save className="mr-1 h-4 w-4" />
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
              <Button size="sm" variant="outline" onClick={exportPng} disabled={exporting}>
                <Download className="mr-1 h-4 w-4" />
                {exporting ? "Export..." : "Exporter PNG"}
              </Button>
            </Panel>
          )}

          {!readOnly && (
            <Panel position="bottom-center">
              <p className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded border">
                Survolez une unité → <strong>+</strong> pour ajouter un subordonné · Double-clic pour modifier
              </p>
            </Panel>
          )}
        </ReactFlow>
      </div>

      <Dialog open={!!editState} onOpenChange={(open) => { if (!open) setEditState(null) }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editState?.nodeType === "game-group"
                ? "Groupe jeu"
                : editState?.nodeId === ROOT_ID
                ? "Modifier le commandement"
                : "Modifier l'unité"}
            </DialogTitle>
          </DialogHeader>
          {editState && (
            <div className="space-y-4">
              {editState.nodeType === "game-group" ? (
                <div className="space-y-1.5">
                  <Label>Nom du jeu</Label>
                  <Input
                    value={editState.label}
                    onChange={(e) => setEditState({ ...editState, label: e.target.value })}
                    placeholder="Ex: Arma 3, DCS World, Squad…"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && applyEdit()}
                  />
                </div>
              ) : isCommunityOrbat ? (
                /* ORBAT général : sélecteur d'unité uniquement */
                <div className="space-y-1.5">
                  <Label>Unité liée</Label>
                  <Select
                    value={editState.rpUnitId || "__none__"}
                    onValueChange={(v) => setEditState({ ...editState, rpUnitId: v === "__none__" ? "" : v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Aucune</SelectItem>
                      {(communityUnits ?? []).map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Les informations (nom, image, symbole, postes) sont récupérées automatiquement depuis la case principale de l&apos;ORBAT de cette unité.
                  </p>
                </div>
              ) : (
                /* ORBAT d'unité : formulaire complet */
                <>
                  {/* Image */}
                  <div className="space-y-2">
                    <Label>{"Image de l'unité"}</Label>
                    <div className="flex justify-center">
                      {editState.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={editState.imageUrl}
                          alt="Aperçu"
                          style={{ maxWidth: 96, maxHeight: 96, objectFit: "contain", display: "block" }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                        />
                      ) : (
                        <div className="h-24 w-24 rounded border border-dashed border-border bg-muted/30 flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">Aucune image</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                      <Button type="button" variant="outline" size="sm" className="w-full" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                        {uploading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Téléversement...</> : <><Upload className="mr-2 h-3.5 w-3.5" />Depuis le PC</>}
                      </Button>
                      <div className="relative flex items-center gap-2">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-[10px] text-muted-foreground">ou URL</span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                      <Input value={editState.imageUrl} onChange={(e) => setEditState({ ...editState, imageUrl: e.target.value })} placeholder="https://..." className="text-xs h-8" />
                    </div>
                  </div>

                  {/* Nom */}
                  <div className="space-y-1.5">
                    <Label>Nom</Label>
                    <Input value={editState.label} onChange={(e) => setEditState({ ...editState, label: e.target.value })} placeholder="Ex: 1ère Section" autoFocus onKeyDown={(e) => e.key === "Enter" && applyEdit()} />
                  </div>

                  {/* Échelon */}
                  <div className="space-y-1.5">
                    <Label>Échelon <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                    <Select value={editState.size || "__none__"} onValueChange={(v) => setEditState({ ...editState, size: v === "__none__" ? "" : v })}>
                      <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Aucun</SelectItem>
                        {NATO_SIZES.map((s) => <SelectItem key={s.value} value={s.value}>{s.marker} — {s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Type */}
                  <div className="space-y-1.5">
                    <Label>Symbole de base</Label>
                    <Select value={editState.type || "__none__"} onValueChange={(v) => setEditState({ ...editState, type: v === "__none__" ? "" : v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="max-h-72">
                        <SelectItem value="__none__">Aucun</SelectItem>
                        {Array.from(new Set(NATO_TYPES.map((t) => t.category))).map((cat) => (
                          <div key={cat}>
                            <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{cat}</div>
                            {NATO_TYPES.filter((t) => t.category === cat).map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Symbole complémentaire */}
                  <div className="space-y-1.5">
                    <Label>Symbole complémentaire <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                    <Select value={editState.modifier || "__none__"} onValueChange={(v) => setEditState({ ...editState, modifier: v === "__none__" ? "" : v })}>
                      <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Aucun</SelectItem>
                        {NATO_MODIFIERS.map((mod) => <SelectItem key={mod.value} value={mod.value}>{mod.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Callsign */}
                  <div className="space-y-1.5">
                    <Label>Callsign <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                    <Input value={editState.callsign} onChange={(e) => setEditState({ ...editState, callsign: e.target.value })} placeholder="Ex: Alpha-1" onKeyDown={(e) => e.key === "Enter" && applyEdit()} />
                  </div>

                  {/* Postes */}
                  <div className="space-y-2">
                    <Label>Postes</Label>
                    {editState.roles.length === 0 && <p className="text-xs text-muted-foreground">Aucun poste défini.</p>}
                    {editState.roles.map((role, i) => (
                      <div key={role.id} className="flex gap-2 items-center">
                        <Input value={role.title} onChange={(e) => updateRole(i, { title: e.target.value })} placeholder="Titre du poste" className="text-xs h-8 flex-1" />
                        <Select value={role.memberId || "__vacant__"} onValueChange={(v) => {
                          if (v === "__vacant__") { updateRole(i, { memberId: "", memberName: "", characterName: "", gradeLabel: "", gradeIcon: "" }) }
                          else {
                            const m = members.find((m) => m.id === v)
                            updateRole(i, { memberId: v, memberName: m?.name ?? "", characterName: m?.characterName ?? m?.name ?? "", gradeLabel: m?.gradeLabel ?? "", gradeIcon: m?.gradeIcon ?? "", gradeAbbrev: m?.gradeAbbrev ?? "" })
                          }
                        }}>
                          <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Vacant" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__vacant__">Vacant</SelectItem>
                            {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.characterName ? `${m.characterName}${m.gradeLabel ? ` (${m.gradeLabel})` : ""}` : m.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeRole(i)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={addRole}>
                      <Plus className="h-3.5 w-3.5 mr-1" />Ajouter un poste
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditState(null)}>Annuler</Button>
            <Button onClick={applyEdit}>Appliquer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
