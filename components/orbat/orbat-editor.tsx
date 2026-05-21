"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Edge,
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
import { NATO_TYPES, NATO_SIZES } from "./nato-symbol"
import { Plus, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface CommunityMember {
  id: string
  name: string
  image?: string | null
  role: string
}

const ROOT_ID = "root"

function makeRootNode(): Node {
  return {
    id: ROOT_ID,
    type: "unit",
    position: { x: 0, y: 0 },
    draggable: false,
    deletable: false,
    data: { label: "Commandement", type: "hq", size: "", isRoot: true, callsign: "", roles: [] },
  }
}

interface OrbatEditorProps {
  communitySlug: string
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
  roles: OrbatRole[]
}

export function OrbatEditor({
  communitySlug,
  initialNodes = [],
  initialEdges = [],
  readOnly = false,
}: OrbatEditorProps) {
  const hasRoot = initialNodes.some((n) => n.id === ROOT_ID)
  const baseNodes = hasRoot ? initialNodes : [makeRootNode(), ...initialNodes]

  const [nodes, setNodes, onNodesChange] = useNodesState(baseNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [saving, setSaving] = useState(false)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [members, setMembers] = useState<CommunityMember[]>([])

  // Fetch community members for role assignment
  useEffect(() => {
    fetch(`/api/communities/${communitySlug}/members`)
      .then((r) => r.json())
      .then((data) => setMembers(data.members ?? []))
      .catch(() => {})
  }, [communitySlug])

  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  nodesRef.current = nodes
  edgesRef.current = edges

  const addChildNode = useCallback((parentId: string) => {
    const parentNode = nodesRef.current.find((n) => n.id === parentId)
    if (!parentNode) return

    const siblingCount = edgesRef.current.filter((e) => e.source === parentId).length
    const offset = (siblingCount % 2 === 0 ? 1 : -1) * Math.ceil(siblingCount / 2) * 300
    const childId = `unit-${Date.now()}`

    setNodes((nds) => [
      ...nds,
      {
        id: childId,
        type: "unit",
        position: {
          x: parentNode.position.x + offset,
          y: parentNode.position.y + 180,
        },
        data: { label: "Nouvelle unité", type: "infantry", size: "", callsign: "", roles: [] },
      },
    ])

    setEdges((eds) => [
      ...eds,
      {
        id: `edge-${Date.now()}`,
        source: parentId,
        target: childId,
        type: "smoothstep",
      },
    ])

    setEditState({ nodeId: childId, label: "Nouvelle unité", type: "infantry", size: "", callsign: "", roles: [] })
  }, [setNodes, setEdges])

  const nodesWithCallbacks = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          readOnly,
          onAddChild: readOnly ? undefined : addChildNode,
        },
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodes, readOnly]
  )

  const nodeTypes = useMemo(() => ({ unit: OrbatUnitNode }), [])

  const removeSelected = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected || n.id === ROOT_ID))
    setEdges((eds) => eds.filter((e) => !e.selected))
  }, [setNodes, setEdges])

  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (readOnly) return
    setEditState({
      nodeId: node.id,
      label: node.data.label ?? "",
      type: node.data.type ?? "infantry",
      size: node.data.size ?? "",
      callsign: node.data.callsign ?? "",
      roles: node.data.roles ?? [],
    })
  }, [readOnly])

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
                roles: editState.roles,
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

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/orbat`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
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
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: "smoothstep" }}
          nodesConnectable={false}
        >
          <Background />
          <Controls />
          <MiniMap />

          {!readOnly && (
            <Panel position="top-right" className="flex gap-2">
              <Button size="sm" variant="outline" onClick={removeSelected}>
                <Trash2 className="mr-1 h-4 w-4" />
                Supprimer la sélection
              </Button>
              <Button size="sm" onClick={save} disabled={saving}>
                <Save className="mr-1 h-4 w-4" />
                {saving ? "Sauvegarde..." : "Sauvegarder"}
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
              {editState?.nodeId === ROOT_ID ? "Modifier le commandement" : "Modifier l&apos;unité"}
            </DialogTitle>
          </DialogHeader>
          {editState && (
            <div className="space-y-4">
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

              {/* Type */}
              <div className="space-y-1.5">
                <Label>Type d&apos;unité</Label>
                <Select value={editState.type} onValueChange={(v) => setEditState({ ...editState, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">
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
