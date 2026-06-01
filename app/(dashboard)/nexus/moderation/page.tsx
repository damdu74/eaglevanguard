import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ModerationPanel } from "@/components/moderation/moderation-panel"
import { NexusNav } from "@/components/nexus/nexus-nav"

export const dynamic = "force-dynamic"
export const metadata = { title: "Modération — NEXUS" }

export default async function NexusModerationPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isNexusTeam) redirect("/dashboard")

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">NEXUS Team</h1>
        <p className="text-sm text-muted-foreground">Gestion du staff de la plateforme</p>
      </div>
      <NexusNav />
      <ModerationPanel
        mode="nexus"
        isNexusTeam={true}
      />
    </div>
  )
}
