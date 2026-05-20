"use client"

import { useCallback, useState } from "react"
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  Panel,
} from "reactflow"
import "reactflow/dist/style.css"
import { Button } from "@/components/ui/button"
import { OrbatUnitNode } from "./orbat-unit-node"
import { Save, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

const nodeTypes = { unit: OrbatUnitNode }

interface OrbatEditorProps {
  communitySlug: string
  initialNodes?: Node[]
  initialEdges?: Edge[]
  readOnly?: boolean
}

const DEFAULT_NODE: Omit<Node, "id"> = {
  type: "unit",
  position: { x: 250, y: 50 },
  data: { label: "Nouvelle unité", type: "infantry", callsign: "" },
}

export function OrbatEditor({
  communitySlug,
  initialNodes = [],
  initialEdges = [],
  readOnly = false,
}: OrbatEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [saving, setSaving] = useState(false)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const addNode = useCallback(() => {
    const id = `unit-${Date.now()}`
    setNodes((nds) => [
      ...nds,
      {
        ...DEFAULT_NODE,
        id,
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 200 + 100,
        },
      },
    ])
  }, [setNodes])

  const removeSelected = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected))
    setEdges((eds) => eds.filter((e) => !e.selected))
  }, [setNodes, setEdges])

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
    <div className="h-[70vh] w-full rounded-lg border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={readOnly ? undefined : onNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onConnect={readOnly ? undefined : onConnect}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <MiniMap />

        {!readOnly && (
          <Panel position="top-right" className="flex gap-2">
            <Button size="sm" variant="outline" onClick={addNode}>
              <Plus className="mr-1 h-4 w-4" />
              Unité
            </Button>
            <Button size="sm" variant="outline" onClick={removeSelected}>
              <Trash2 className="mr-1 h-4 w-4" />
              Supprimer
            </Button>
            <Button size="sm" onClick={save} disabled={saving}>
              <Save className="mr-1 h-4 w-4" />
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </Panel>
        )}
      </ReactFlow>
    </div>
  )
}
