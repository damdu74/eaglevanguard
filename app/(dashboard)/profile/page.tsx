import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LinkDiscordButton } from "@/components/profile/link-discord-button"
import { AvatarUpload } from "@/components/profile/avatar-upload"
import Image from "next/image"

export const metadata = { title: "Profil" }

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propriétaire",
  ADMIN: "Administrateur",
  MODERATOR: "Modérateur",
  MEMBER: "Membre",
  RECRUIT: "Recrue",
}

export default async function ProfilePage({ searchParams }: { searchParams: { discord_linked?: string; error?: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/auth/signin")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: { include: { community: true }, take: 5 },
    },
  })

  if (!user) redirect("/auth/signin")

  const displayName = user.steamName ?? user.discordName ?? user.name ?? "Joueur"
  const displayAvatar = user.customAvatar ?? user.steamAvatar ?? user.discordAvatar ?? user.image

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Mon profil</h1>

      {searchParams.discord_linked && (
        <div className="rounded-md bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-600">
          Compte Discord lié avec succès.
        </div>
      )}
      {searchParams.error && (
        <div className="rounded-md bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600">
          Erreur lors du liage Discord. Réessayez.
        </div>
      )}

      {/* Identity */}
      <Card>
        <CardHeader>
          <CardTitle>Identité</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <AvatarUpload currentImage={displayAvatar} displayName={displayName} />
          <div>
            <p className="text-lg font-semibold">{displayName}</p>
            <p className="text-sm text-muted-foreground">
              Membre depuis le {new Date(user.createdAt).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Linked accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Comptes liés</CardTitle>
          <CardDescription>Connectez vos comptes Steam et Discord.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/steam-logo.svg" alt="Steam" width={24} height={24} />
              <div>
                <p className="font-medium">Steam</p>
                {user.steamName && <p className="text-sm text-muted-foreground">{user.steamName}</p>}
              </div>
            </div>
            {user.steamId ? <Badge variant="secondary">Lié</Badge> : <Badge variant="outline">Non lié</Badge>}
          </div>
          <div className="border-t" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/discord-logo.svg" alt="Discord" width={24} height={24} />
              <div>
                <p className="font-medium">Discord</p>
                {user.discordName && <p className="text-sm text-muted-foreground">{user.discordName}</p>}
              </div>
            </div>
            {user.discordId ? <Badge variant="secondary">Lié</Badge> : <LinkDiscordButton />}
          </div>
        </CardContent>
      </Card>

      {/* Communities */}
      {user.memberships.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mes communautés</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {user.memberships.map((m) => (
              <div key={m.communityId} className="flex items-center justify-between">
                <p className="font-medium">{m.community.name}</p>
                <Badge variant="outline">{ROLE_LABELS[m.role] ?? m.role}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

    </div>
  )
}
