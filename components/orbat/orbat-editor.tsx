"use client"

import { useCallback, useEffect, useState } from "react"
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
import { OrbatUnitNode } from "./orbat-unit-node"
import { Save, Trash2 } from "lucide-react"
import { toast } from "sonner"

const nodeTypes = { unit: OrbatUnitNode }

const UNIT_TYPES = [
  { value: "hq", label: "⭐ QG" },
  { value: "infantry", label: "⚔️ Infanterie" },
  { value: "armor", label: "🛡️ Blindé" },
  { value: "aviation", label: "✈️ Aviation" },
  { value: "artillery", label: "💥 Artillerie" },
  { value: "logistics", label: "🔧 Logistique" },
  { value: "recon", label: "👁️ Reconnaissance" },
  { value: "medical", label: "➕ Médical" },
]

const ROOT_ID = "root"
const ROOT_NODE: Node = {
  id: ROOT_ID,
  type: "unit",
  position: { x: 0, y: 0 },
  draggable: false,
  deletable: false,
  data: { label: "Commandement", type: "hq", isRoot: true, callsign: "" },
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
  callsign: string
}

function buildNodesWithCallbacks(
  nodes: Node[],
  readOnly: boolean,
  onAddChild: (id: string) => void
): Node[] {
  return nodes.map((n) => ({
    ...n,
    data: { ...n.data, readOnly, onAddChild: readOnly ? undefined : onAddChild },
  }))
}

export function OrbatEditor({
  communitySlug,
  initialNodes = [],
  initialEdges = [],
  readOnly = false,
}: OrbatEditorProps) {
  const hasRoot = initialNodes.some((n) => n.id === ROOT_ID)
  const baseNodes = hasRoot ? initialNodes : [ROOT_NODE, ...initialNodes]

  const [nodes, setNodes, onNodesChange] = useNodesState(baseNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [saving, setSaving] = useState(false)
  const [editState, setEditState] = useState<EditState | null>(null)

  const addChildNode = useCallback((parentId: string) => {
    const parentNode = nodes.find((n) => n.id === parentId)
    if (!parentNode) return

    const siblings = edges.filter((e) => e.source === parentId)
    const siblingCount = siblings.length
    const childId = `unit-${Date.now()}`

    const offsetX = (siblingCount - Math.floor(siblingCount / 2)) * 200 - (siblingCount % 2 === 0 ? 100 : 0)

    const newNode: Node = {
      id: childId,
      type: "unit",
      position: {
        x: parentNode.position.x + offsetX,
        y: parentNode.position.y + 160,
      },
      data: { label: "Nouvelle unité", type: "infantry", callsign: "" },
    }

    const newEdge: Edge = {
      id: `edge-${Date.now()}`,
      source: parentId,
      target: childId,
      type: "smoothstep",
    }

    setNodes((nds) => [...nds, newNode])
    setEdges((eds) => [...eds, newEdge])

    // Ouvrir le dialog d'édition immédiatement
    setEditState({ nodeId: childId, label: "Nouvelle unité", type: "infantry", callsign: "" })
  }, [nodes, edges, setNodes, setEdges])

  // Injecter les callbacks dans les données des nœuds
  useEffect(() => {
    setNodes((nds) => buildNodesWithCallbacks(nds, readOnly, addChildNode))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, addChildNode])

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
      callsign: node.data.callsign ?? "",
    })
  }, [readOnly])

  const applyEdit = useCallback(() => {
    if (!editState) return
    setNodes((nds) =>
      nds.map((n) =>
        n.id === editState.nodeId
          ? { ...n, data: { ...n.data, label: editState.label, type: editState.type, callsign: editState.callsign } }
          : n
      )
    )
    setEditState(null)
  }, [editState, setNodes])

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
          nodes={nodes}
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
                Survolez une unité → cliquez <strong>+</strong> pour ajouter un subordonné · Double-clic pour modifier
              </p>
            </Panel>
          )}
        </ReactFlow>
      </div>

      <Dialog open={!!editState} onOpenChange={(open) => { if (!open) setEditState(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editState?.nodeId === ROOT_ID ? "Modifier le commandement" : "Modifier l'unité"}
            </DialogTitle>
          </DialogHeader>
          {editState && (
            <div className="space-y-4">
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
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={editState.type}
                  onValueChange={(v) => setEditState({ ...editState, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Callsign <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                <Input
                  value={editState.callsign}
                  onChange={(e) => setEditState({ ...editState, callsign: e.target.value })}
                  placeholder="Ex: Alpha-1"
                  onKeyDown={(e) => e.key === "Enter" && applyEdit()}
                />
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
