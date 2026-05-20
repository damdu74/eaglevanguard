import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { OrbatEditor } from "@/components/orbat/orbat-editor"

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata() {
  return { title: `ORBAT` }
}

export default async function OrbatPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    include: {
      orbat: true,
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">ORBAT — {community.name}</h1>
        <p className="text-sm text-muted-foreground">Ordre de bataille interactif</p>
      </div>
      <OrbatEditor
        communitySlug={params.slug}
        initialNodes={nodes}
        initialEdges={[]}
        readOnly={!canEdit}
      />
    </div>
  )
}
