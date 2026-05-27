import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { OrbatEditor } from "@/components/orbat/orbat-editor"

export const dynamic = "force-dynamic"

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata() {
  return { title: "ORBAT" }
}

export default async function OrbatPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.isNexusTeam) redirect(`/communities/${params.slug}`)

  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    include: {
      orbat: true,
      orbatEdges: true,
      memberships: session?.user?.id
        ? { where: { userId: session.user.id as string } }
        : false,
    },
  })

  if (!community) notFound()

  const membership = community.memberships?.[0]
  const canEdit = membership && ["OWNER", "ADMIN", "MODERATOR"].includes(membership.role)

  const nodes = community.orbat.map((n) => ({
    id: n.nodeId,
    type: n.type,
    position: { x: n.positionX, y: n.positionY },
    data: n.data ?? { label: n.label },
  }))

  const edges = community.orbatEdges.map((e) => ({
    id: e.edgeId,
    source: e.source,
    target: e.target,
    ...(e.data as object ?? {}),
  }))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">ORBAT — {community.name}</h1>
        <p className="text-sm text-muted-foreground">Ordre de bataille interactif</p>
      </div>
      <OrbatEditor
        communitySlug={params.slug}
        initialNodes={nodes}
        initialEdges={edges}
        readOnly={!canEdit}
      />
    </div>
  )
}
