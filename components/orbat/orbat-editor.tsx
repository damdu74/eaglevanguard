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

// Dimensions du layout hiérarchique (px canvas)
const LY_NODE_W      = 360
const LY_H_GAP       = 40
const LY_SLOT_W      = LY_NODE_W + LY_H_GAP
const LY_ROOT_H      = 140
const LY_GAME_H      = 60
const LY_V_GAP       = 60
const LY_GAME_Y      = Math.round((LY_ROOT_H + LY_V_GAP) / 20) * 20           // 200
const LY_UNIT_Y      = Math.round((LY_GAME_Y + LY_GAME_H + 20) / 20) * 20 // 280
const LY_ROOT_CX     = LY_NODE_W / 2                                            // 180
const LY_MAX_COL     = 10   // max unités par colonne sous un groupe de jeu
const LY_UNIT_ROW_H  = 100  // pas vertical entre nœuds d'une même colonne (≈ hauteur nœud + gap)

type CommunityUnit = { id: string; name: string; game?: string | null }

function snapVal(v: number) {
  return Math.round(v / SNAP_GRID[0]) * SNAP_GRID[0]
}

/** Calcule le layout hiérarchique complet et crée les nœuds manquants. */
function buildGameLayout(
  nds: Node[],
  units: CommunityUnit[],
  unitRootData?: Record<string, Record<string, unknown>>
): Node[] {
  const games = Array.from(new Set(units.filter((u) => u.game).map((u) => u.game as string)))
  if (!games.length) return nds

  const result = [...nds]

  // Créer les nœuds pour les nouvelles unités (pas encore dans le graphe)
  const existingRpIds = new Set(result.filter((n) => n.data?.rpUnitId).map((n) => n.data.rpUnitId as string))
  for (const u of units.filter((u) => u.game)) {
    if (existingRpIds.has(u.id)) continue
    const rootData = unitRootData?.[u.id]
    result.push({
      id: `unit-${u.id}`,
      type: "unit",
      position: { x: 0, y: LY_UNIT_Y },
      data: {
        label: rootData?.label ? String(rootData.label) : u.name,
        type: rootData?.type ? String(rootData.type) : "",
        size: rootData?.size ? String(rootData.size) : "",
        callsign: rootData?.callsign ? String(rootData.callsign) : "",
        imageUrl: rootData?.imageUrl ? String(rootData.imageUrl) : "",
        modifier: rootData?.modifier ? String(rootData.modifier) : "",
        roles: Array.isArray(rootData?.roles) ? rootData.roles : [],
        rpUnitId: u.id,
      },
    })
  }

  // Calculer les sous-arbres par jeu (colonnes verticales de LY_MAX_COL unités max)
  const gameInfos = games.map((game) => {
    const unitIds  = new Set(units.filter((u) => u.game === game).map((u) => u.id))
    const count    = result.filter((n) => n.type === "unit" && unitIds.has(n.data?.rpUnitId)).length
    const numCols  = Math.max(1, Math.ceil(count / LY_MAX_COL))
    const subtreeW = numCols * LY_NODE_W + (numCols - 1) * LY_H_GAP
    return { game, gameNodeId: `game-${game}`, count, numCols, subtreeW }
  })

  const totalW = gameInfos.reduce((s, g) => s + g.subtreeW, 0) + (gameInfos.length - 1) * LY_H_GAP
  let curX = LY_ROOT_CX - totalW / 2

  for (const gi of gameInfos) {
    const centerX = curX + gi.subtreeW / 2
    curX += gi.subtreeW + LY_H_GAP

    const gameX = snapVal(centerX - LY_NODE_W / 2)

    // Créer ou repositionner le nœud game-group
    const gameIdx = result.findIndex((n) => n.id === gi.gameNodeId)
    if (gameIdx >= 0) {
      result[gameIdx] = { ...result[gameIdx], position: { x: gameX, y: LY_GAME_Y } }
    } else {
      result.push({ id: gi.gameNodeId, type: "game-group", position: { x: gameX, y: LY_GAME_Y }, data: { label: GAME_LABELS[gi.game] ?? gi.game } })
    }

    // Redistribuer les unités en colonnes verticales (LY_MAX_COL max par colonne, nouvelle colonne à droite)
    if (gi.count > 0) {
      const unitIds   = new Set(units.filter((u) => u.game === gi.game).map((u) => u.id))
      const linked    = result
        .filter((n) => n.type === "unit" && unitIds.has(n.data?.rpUnitId))
        .sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y)
      const subLeft   = centerX - gi.subtreeW / 2

      for (let ui = 0; ui < linked.length; ui++) {
        const col   = Math.floor(ui / LY_MAX_COL)
        const row   = ui % LY_MAX_COL
        const unitX = snapVal(subLeft + col * LY_SLOT_W)
        const unitY = snapVal(LY_UNIT_Y + row * LY_UNIT_ROW_H)
        const idx   = result.findIndex((n) => n.id === linked[ui].id)
        if (idx >= 0) result[idx] = { ...result[idx], position: { x: unitX, y: unitY } }
      }
    }
  }

  return result
}

/** Ajoute les liens automatiques manquants (racine→jeu→unités). */
function buildAutoEdges(eds: Edge[], nds: Node[], units: CommunityUnit[]): Edge[] {
  const games = Array.from(new Set(units.filter((u) => u.game).map((u) => u.game as string)))
  if (!games.length) return eds

  let changed = false
  const next = [...eds]

  for (const game of games) {
    const gameNodeId = `game-${game}`
    if (!next.find((e) => e.source === ROOT_ID && e.target === gameNodeId)) {
      next.push({ id: `auto-root-${gameNodeId}`, source: ROOT_ID, sourceHandle: "bottom", target: gameNodeId, targetHandle: "top", type: "orbat" } as Edge)
      changed = true
    }
    const unitIds = new Set(units.filter((u) => u.game === game).map((u) => u.id))
    for (const n of nds.filter((n) => n.type === "unit" && unitIds.has(n.data?.rpUnitId))) {
      if (!next.find((e) => e.source === gameNodeId && e.target === n.id)) {
        next.push({ id: `auto-${gameNodeId}-${n.id}`, source: gameNodeId, sourceHandle: "bottom", target: n.id, targetHandle: "top", type: "orbat" } as Edge)
        changed = true
      }
    }
  }

  return changed ? next : eds
}

/** Positionne les nœuds manuels en grille sous la hiérarchie auto-générée. */
function buildManualNodesLayout(nds: Node[]): Node[] {
  const manualNodes = nds.filter((n) => !!n.data?.manualNode)
  if (!manualNodes.length) return nds

  const autoNodes = nds.filter((n) => !n.data?.manualNode && n.id !== ROOT_ID && n.type !== "game-group")
  const maxAutoY = autoNodes.length > 0 ? Math.max(...autoNodes.map((n) => n.position.y)) : LY_GAME_Y
  const baseY = snapVal(maxAutoY + 400)

  const PER_ROW = 3
  const result = [...nds]

  manualNodes.forEach((node, i) => {
    const row = Math.floor(i / PER_ROW)
    const col = i % PER_ROW
    const rowStart = row * PER_ROW
    const rowCount = Math.min(PER_ROW, manualNodes.length - rowStart)
    const rowW = rowCount * LY_NODE_W + (rowCount - 1) * LY_H_GAP
    const rowStartX = snapVal(LY_ROOT_CX - rowW / 2)
    const idx = result.findIndex((n) => n.id === node.id)
    if (idx >= 0) {
      result[idx] = {
        ...result[idx],
        position: {
          x: snapVal(rowStartX + col * LY_SLOT_W),
          y: snapVal(baseY + row * LY_UNIT_ROW_H),
        },
      }
    }
  })

  return result
}

function makeRootNode(label = "Commandement", imageUrl = "", communityRoot = false): Node {
  return {
    id: ROOT_ID,
    type: "unit",
    position: { x: 0, y: 0 },
    draggable: false,
    deletable: false,
    data: { label, type: "", size: "", isRoot: true, communityRoot, callsign: "", imageUrl, roles: [] },
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
  fromParam?: string
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
      type:     String(root.type     ?? node.data.type ?? ""),
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
  manualNode?: boolean
  isNewNode?: boolean
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
  fromParam,
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

  const [nodes, setNodes, onNodesChange] = useNodesState(baseNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialEdges.map((e) => ({ ...e, type: "orbat" }))
  )
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [liveUnits, setLiveUnits] = useState<CommunityUnit[]>(communityUnits ?? [])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)


  // Layout hiérarchique au montage (ORBAT général uniquement)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isCommunityOrbat) return
    const units = liveUnitsRef.current
    let newNodes = nodesRef.current
    if (units.some((u) => u.game)) {
      newNodes = buildGameLayout(newNodes, units, unitRootData)
    }
    newNodes = buildManualNodesLayout(newNodes)
    setNodes(newNodes)
    setEdges((eds) => buildAutoEdges(eds, newNodes, units))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  // Refs pour accéder aux états courants dans les callbacks asynchrones
  const membersRef   = useRef<CommunityMember[]>([])
  membersRef.current = members
  const liveUnitsRef = useRef<CommunityUnit[]>(communityUnits ?? [])
  liveUnitsRef.current = liveUnits

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

  // Polling des données racines des unités (ORBAT général uniquement)
  // Met à jour label, image, rôles de chaque nœud d'unité depuis l'ORBAT de l'unité
  useEffect(() => {
    if (!isCommunityOrbat) return

    const fetchUnitRoots = () => {
      fetch(`/api/communities/${communitySlug}/orbat/unit-roots`)
        .then((r) => r.json())
        .then(({ unitRootData: fresh }: { unitRootData: Record<string, Record<string, unknown>> }) => {
          if (!fresh) return
          setNodes((nds) =>
            nds.map((n) => {
              if (!n.data?.rpUnitId) return n
              const merged = mergeUnitRoot(n, fresh)
              // Re-appliquer les grades courants sur les rôles fraîchement chargés
              const currentMembers = membersRef.current
              const roles = (merged.data.roles as OrbatRole[] ?? []).map((role) => {
                if (!role.memberId) return role
                const m = currentMembers.find((mb) => mb.id === role.memberId)
                if (!m) return role
                return {
                  ...role,
                  memberName:    m.name          ?? role.memberName,
                  characterName: m.characterName ?? m.name ?? role.characterName,
                  gradeLabel:    m.gradeLabel    ?? "",
                  gradeIcon:     m.gradeIcon     ?? "",
                  gradeAbbrev:   m.gradeAbbrev   ?? "",
                }
              })
              return { ...merged, data: { ...merged.data, roles } }
            })
          )
        })
        .catch(() => {})
    }

    fetchUnitRoots()
    const interval = setInterval(fetchUnitRoots, 15000)
    const onVisibility = () => { if (document.visibilityState === "visible") fetchUnitRoots() }
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communitySlug])

  // Polling des unités de la communauté : détecte les nouvelles unités créées depuis un autre onglet
  useEffect(() => {
    if (!isCommunityOrbat) return

    const fetchUnits = () => {
      fetch(`/api/communities/${communitySlug}/rp/units`)
        .then((r) => r.json())
        .then(({ units }: { units: CommunityUnit[] }) => {
          if (!units) return
          const currentIds = new Set(liveUnitsRef.current.map((u) => u.id))
          if (units.some((u) => !currentIds.has(u.id))) {
            setLiveUnits(units)
          }
        })
        .catch(() => {})
    }

    const interval = setInterval(fetchUnits, 15000)
    const onVisibility = () => { if (document.visibilityState === "visible") fetchUnits() }
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communitySlug])

  // Re-layout automatique quand de nouvelles unités sont détectées
  useEffect(() => {
    if (!isCommunityOrbat) return
    const currentRpIds = new Set(
      nodesRef.current.filter((n) => n.data?.rpUnitId).map((n) => n.data.rpUnitId as string)
    )
    const hasNewUnits = liveUnits.some((u) => u.game && !currentRpIds.has(u.id))
    if (!hasNewUnits) return

    let newNodes = buildGameLayout(nodesRef.current, liveUnits, unitRootData)
    newNodes = buildManualNodesLayout(newNodes)
    setNodes(newNodes)
    setEdges((eds) => buildAutoEdges(eds, newNodes, liveUnits))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveUnits])

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
        data: { label: "Nouvelle unité", type: "", size: "", callsign: "", imageUrl: "", modifier: "", roles: [], rpUnitId: null, manualNode: true },
      },
    ])
    setEditState({ nodeId: newId, nodeType: "unit", initialRoleCount: 0, label: "Nouvelle unité", type: "", size: "", callsign: "", imageUrl: "", modifier: "", roles: [], rpUnitId: "", manualNode: true, isNewNode: true })
  }, [setNodes])

const toggleLock = useCallback((nodeId: string) => {
    setNodes((nds) =>
      nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, locked: !n.data.locked } } : n)
    )
  }, [setNodes])

  const openEdit = useCallback((nodeId: string) => {
    const node = nodesRef.current.find((n) => n.id === nodeId)
    if (!node || node.data?.communityRoot || node.type === "game-group") return

    const roles = node.data.roles ?? []
    setEditState({
      nodeId,
      nodeType: "unit",
      initialRoleCount: roles.length,
      label: node.data.label ?? "",
      type: node.data.type ?? "",
      size: node.data.size ?? "",
      callsign: node.data.callsign ?? "",
      imageUrl: node.data.imageUrl ?? "",
      modifier: node.data.modifier ?? "",
      roles,
      rpUnitId: node.data.rpUnitId ?? "",
      manualNode: !!node.data.manualNode,
    })
  }, [])

  const nodesWithCallbacks = useMemo(
    () =>
      nodes.map((n) => {
        const isGameGroup = n.type === "game-group"
        return {
          ...n,
          draggable: isCommunityOrbat || isGameGroup || n.id === ROOT_ID ? false : !n.data.locked,
          deletable: !isGameGroup && n.id !== ROOT_ID && (!isCommunityOrbat || !!n.data?.manualNode),
          selectable: !isGameGroup,
          data: {
            ...n.data,
            readOnly,
            communitySlug,
            communityOrbat: isCommunityOrbat,
            hideHandles: isCommunityOrbat,
            fromParam: fromParam ?? (isCommunityOrbat ? "orbat-general" : undefined),
            onToggleLock: readOnly || isGameGroup || isCommunityOrbat ? undefined : toggleLock,
            onEdit: readOnly || isGameGroup ? undefined : openEdit,
          },
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodes, readOnly, isCommunityOrbat, communitySlug, fromParam]
  )

  const nodeTypes = useMemo(() => ({ unit: OrbatUnitNode, "game-group": OrbatGameNode }), [])
  const edgeTypes = useMemo(() => ({ orbat: OrbatEdge }), [])

  const removeSelected = useCallback(() => {
    setNodes((nds) => {
      const filtered = nds.filter((n) => {
        if (!n.selected) return true
        if (n.id === ROOT_ID || n.type === "game-group") return true
        if (isCommunityOrbat && !n.data?.manualNode) return true
        return false
      })
      return isCommunityOrbat ? buildManualNodesLayout(filtered) : filtered
    })
    if (!isCommunityOrbat) setEdges((eds) => eds.filter((e) => !e.selected))
  }, [setNodes, setEdges, isCommunityOrbat])

  const applyEdit = useCallback(() => {
    if (!editState) return

    const isNew = !!editState.isNewNode
    const ROLE_ROW_H = 28
    const deltaRoles = editState.roles.length - editState.initialRoleCount
    const shift = isCommunityOrbat ? 0 : deltaRoles * ROLE_ROW_H
    const editedY = nodesRef.current.find((n) => n.id === editState.nodeId)?.position.y ?? 0

    setNodes((nds) => {
      const mapped = nds.map((n) => {
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
      return (isCommunityOrbat && isNew) ? buildManualNodesLayout(mapped) : mapped
    })
    setEditState(null)
  }, [editState, setNodes])

  const cancelEdit = useCallback(() => {
    if (editState?.isNewNode) {
      setNodes((nds) => nds.filter((n) => n.id !== editState.nodeId))
    }
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
          type:     n.data?.type     ?? "",
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

  const unitAlreadyUsed = isCommunityOrbat && !!editState?.rpUnitId && nodes.some(
    (n) => n.id !== editState?.nodeId && n.data?.rpUnitId === editState?.rpUnitId
  )

  return (
    <>
      <div className="h-[72vh] w-full rounded-lg border">
        <ReactFlow
          nodes={nodesWithCallbacks}
          edges={edges}
          onNodesChange={readOnly ? undefined : onNodesChange}
          onEdgesChange={readOnly || isCommunityOrbat ? undefined : onEdgesChange}
          onConnect={readOnly || isCommunityOrbat ? undefined : onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: "orbat" }}
          nodesConnectable={!readOnly && !isCommunityOrbat}
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
                Nouveau nœud
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

          {!readOnly && !isCommunityOrbat && (
            <Panel position="bottom-center">
              <p className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded border">
                Survolez une unité → <strong>+</strong> pour ajouter un subordonné · Double-clic pour modifier
              </p>
            </Panel>
          )}
        </ReactFlow>
      </div>

      <Dialog open={!!editState} onOpenChange={(open) => { if (!open) cancelEdit() }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editState?.nodeId === ROOT_ID ? "Modifier le commandement" : "Modifier l'unité"}
            </DialogTitle>
          </DialogHeader>
          {editState && (
            <div className="space-y-4">
              {isCommunityOrbat ? (
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
                  {unitAlreadyUsed && (
                    <p className="text-xs text-destructive font-medium">
                      Cette unité est déjà présente dans l&apos;organigramme.
                    </p>
                  )}
                  {!unitAlreadyUsed && (
                    <p className="text-xs text-muted-foreground">
                      Les informations (nom, image, symbole, postes) sont récupérées automatiquement depuis la case principale de l&apos;ORBAT de cette unité.
                    </p>
                  )}
                </div>
              ) : (
                /* Nœud manuel en ORBAT général ou ORBAT d'unité : formulaire complet */
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
            <Button variant="outline" onClick={cancelEdit}>Annuler</Button>
            <Button onClick={applyEdit} disabled={unitAlreadyUsed}>Appliquer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  )
}
