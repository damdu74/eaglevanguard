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
import { NATO_TYPES, NATO_SIZES, NATO_MODIFIERS } from "./nato-symbol"
import { Download, Loader2, Plus, Save, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { toPng } from "html-to-image"

interface CommunityMember {
  id: string
  name: string
  image?: string | null
  role: string
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

function snapVal(v: number) {
  return Math.round(v / SNAP_GRID[0]) * SNAP_GRID[0]
}

function makeRootNode(label = "Commandement"): Node {
  return {
    id: ROOT_ID,
    type: "unit",
    position: { x: 0, y: 0 },
    draggable: false,
    deletable: false,
    data: { label, type: "hq", size: "", isRoot: true, callsign: "", imageUrl: "", roles: [] },
  }
}

interface OrbatEditorProps {
  communitySlug: string
  unitId?: string
  rootLabel?: string
  communityUnits?: { id: string; name: string }[]
  initialNodes?: Node[]
  initialEdges?: Edge[]
  readOnly?: boolean
}

interface EditState {
  nodeId: string
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
  communityUnits,
  initialNodes = [],
  initialEdges = [],
  readOnly = false,
}: OrbatEditorProps) {
  const apiBase = unitId
    ? `/api/communities/${communitySlug}/rp/units/${unitId}/orbat`
    : `/api/communities/${communitySlug}/orbat`

  const hasRoot = initialNodes.some((n) => n.id === ROOT_ID)
  const baseNodes = (hasRoot ? initialNodes : [makeRootNode(rootLabel), ...initialNodes])
    .map((n) => rootLabel && n.id === ROOT_ID ? { ...n, data: { ...n.data, label: rootLabel } } : n)

  const [nodes, setNodes, onNodesChange] = useNodesState(baseNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialEdges.map((e) => ({ ...e, type: "orbat" }))
  )
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch community members for role assignment
  useEffect(() => {
    fetch(`/api/communities/${communitySlug}/members`)
      .then((r) => r.json())
      .then((data) => setMembers(data.members ?? []))
      .catch(() => {})
  }, [communitySlug])

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
    setEditState({ nodeId: newId, label: "Nouvelle unité", type: "infantry", size: "", callsign: "", imageUrl: "", modifier: "", roles: [], rpUnitId: "" })
  }, [setNodes])

  const toggleLock = useCallback((nodeId: string) => {
    setNodes((nds) =>
      nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, locked: !n.data.locked } } : n)
    )
  }, [setNodes])

  const openEdit = useCallback((nodeId: string) => {
    const node = nodesRef.current.find((n) => n.id === nodeId)
    if (!node) return
    setEditState({
      nodeId,
      label: node.data.label ?? "",
      type: node.data.type ?? "infantry",
      size: node.data.size ?? "",
      callsign: node.data.callsign ?? "",
      imageUrl: node.data.imageUrl ?? "",
      modifier: node.data.modifier ?? "",
      roles: node.data.roles ?? [],
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

  const nodeTypes = useMemo(() => ({ unit: OrbatUnitNode }), [])
  const edgeTypes = useMemo(() => ({ orbat: OrbatEdge }), [])

  const removeSelected = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected || n.id === ROOT_ID))
    setEdges((eds) => eds.filter((e) => !e.selected))
  }, [setNodes, setEdges])

  const applyEdit = useCallback(() => {
    if (!editState) return
    setNodes((nds) =>
      nds.map((n) =>
        n.id === editState.nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                label: editState.label,
                type: editState.type,
                size: editState.size,
                callsign: editState.callsign,
                imageUrl: editState.imageUrl,
                modifier: editState.modifier,
                roles: editState.roles,
                rpUnitId: editState.rpUnitId || null,
              },
            }
          : n
      )
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
              {editState?.nodeId === ROOT_ID ? "Modifier le commandement" : "Modifier l'unité"}
            </DialogTitle>
          </DialogHeader>
          {editState && (
            <div className="space-y-4">
              {/* Image */}
              <div className="space-y-2">
                <Label>{"Image de l'unité"}</Label>
                {/* Aperçu centré au-dessus */}
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
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploading
                        ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Téléversement...</>
                        : <><Upload className="mr-2 h-3.5 w-3.5" />Depuis le PC</>
                      }
                    </Button>
                    <div className="relative flex items-center gap-2">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-[10px] text-muted-foreground">ou URL</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <Input
                      value={editState.imageUrl}
                      onChange={(e) => setEditState({ ...editState, imageUrl: e.target.value })}
                      placeholder="https://..."
                      className="text-xs h-8"
                    />
                </div>
              </div>

              {/* Unité liée — ORBAT général uniquement, hors racine */}
              {communityUnits && communityUnits.length > 0 && editState.nodeId !== ROOT_ID && (
                <div className="space-y-1.5">
                  <Label>Unité liée <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                  <Select
                    value={editState.rpUnitId || "__none__"}
                    onValueChange={(v) => {
                      if (v === "__none__") {
                        setEditState({ ...editState, rpUnitId: "" })
                      } else {
                        const unit = communityUnits.find((u) => u.id === v)
                        setEditState({
                          ...editState,
                          rpUnitId: v,
                          label: (!editState.label || editState.label === "Nouvelle unité") && unit ? unit.name : editState.label,
                        })
                      }
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Aucune</SelectItem>
                      {communityUnits.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Nom */}
              <div className="space-y-1.5">
                <Label>Nom</Label>
                <Input
                  value={editState.label}
                  onChange={(e) => setEditState({ ...editState, label: e.target.value })}
                  placeholder="Ex: 1ère Section"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && applyEdit()}
                />
              </div>

              {/* Échelon */}
              <div className="space-y-1.5">
                <Label>Échelon <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                <Select
                  value={editState.size || "__none__"}
                  onValueChange={(v) => setEditState({ ...editState, size: v === "__none__" ? "" : v })}
                >
                  <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Aucun</SelectItem>
                    {NATO_SIZES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.marker} — {s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <Label>Symbole de base</Label>
                <Select
                  value={editState.type || "__none__"}
                  onValueChange={(v) => setEditState({ ...editState, type: v === "__none__" ? "" : v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="__none__">Aucun</SelectItem>
                    {Array.from(new Set(NATO_TYPES.map((t) => t.category))).map((cat) => (
                      <div key={cat}>
                        <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{cat}</div>
                        {NATO_TYPES.filter((t) => t.category === cat).map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Symbole complémentaire */}
              <div className="space-y-1.5">
                <Label>Symbole complémentaire <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                <Select
                  value={editState.modifier || "__none__"}
                  onValueChange={(v) => setEditState({ ...editState, modifier: v === "__none__" ? "" : v })}
                >
                  <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Aucun</SelectItem>
                    {NATO_MODIFIERS.map((mod) => (
                      <SelectItem key={mod.value} value={mod.value}>{mod.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Callsign */}
              <div className="space-y-1.5">
                <Label>Callsign <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                <Input
                  value={editState.callsign}
                  onChange={(e) => setEditState({ ...editState, callsign: e.target.value })}
                  placeholder="Ex: Alpha-1"
                  onKeyDown={(e) => e.key === "Enter" && applyEdit()}
                />
              </div>

              {/* Postes */}
              <div className="space-y-2">
                <Label>Postes</Label>
                {editState.roles.length === 0 && (
                  <p className="text-xs text-muted-foreground">Aucun poste défini.</p>
                )}
                {editState.roles.map((role, i) => (
                  <div key={role.id} className="flex gap-2 items-center">
                    <Input
                      value={role.title}
                      onChange={(e) => updateRole(i, { title: e.target.value })}
                      placeholder="Titre du poste"
                      className="text-xs h-8 flex-1"
                    />
                    <Select
                      value={role.memberId || "__vacant__"}
                      onValueChange={(v) => {
                        if (v === "__vacant__") {
                          updateRole(i, { memberId: "", memberName: "" })
                        } else {
                          const m = members.find((m) => m.id === v)
                          updateRole(i, { memberId: v, memberName: m?.name ?? "" })
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Vacant" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__vacant__">Vacant</SelectItem>
                        {members.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeRole(i)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={addRole}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Ajouter un poste
                </Button>
              </div>
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
