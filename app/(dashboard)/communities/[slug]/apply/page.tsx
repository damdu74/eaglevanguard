import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ApplyForm } from "@/components/community/apply-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps) {
  const community = await prisma.community.findUnique({ where: { slug: params.slug } })
  return { title: community ? `Candidater — ${community.name}` : "Candidature" }
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  ACCEPTED: "Acceptée",
  REJECTED: "Refusée",
  WITHDRAWN: "Retirée",
}

export default async function ApplyPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/auth/signin")

  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true, slug: true, description: true, game: true },
  })
  if (!community) notFound()

  const membership = await prisma.membership.findFirst({
    where: { communityId: community.id, userId: session.user.id as string },
  })
  if (membership) redirect(`/communities/${params.slug}`)

  const existingApplication = await prisma.application.findUnique({
    where: { communityId_userId: { communityId: community.id, userId: session.user.id as string } },
  })

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <Link
          href={`/communities/${params.slug}`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour à la communauté
        </Link>
        <h1 className="text-2xl font-bold">Candidater</h1>
        <p className="text-sm text-muted-foreground">{community.name}</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{community.name}</CardTitle>
            <Badge variant="outline" className="text-xs">{community.game}</Badge>
          </div>
          {community.description && (
            <CardDescription>{community.description}</CardDescription>
          )}
        </CardHeader>
      </Card>

      {existingApplication && existingApplication.status !== "WITHDRAWN" ? (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <p className="text-sm font-medium">
              Statut de votre candidature :{" "}
              <span className="text-primary">
                {STATUS_LABELS[existingApplication.status] ?? existingApplication.status}
              </span>
            </p>
            {existingApplication.message && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Votre message</p>
                <p className="text-sm">{existingApplication.message}</p>
              </div>
            )}
            {existingApplication.response && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Réponse de la communauté</p>
                <p className="text-sm">{existingApplication.response}</p>
              </div>
            )}
            {existingApplication.status === "PENDING" && (
              <ApplyForm communitySlug={params.slug} mode="withdraw" />
            )}
          </CardContent>
        </Card>
      ) : (
        <ApplyForm communitySlug={params.slug} mode="apply" />
      )}
    </div>
  )
}
