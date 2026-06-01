import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ModerationPanel } from "@/components/moderation/moderation-panel"
import { LogsPanel } from "@/components/logs/logs-panel"
import { NexusNav } from "@/components/nexus/nexus-nav"
import { checkNexusPermission } from "@/lib/nexus-auth"

export const dynamic = "force-dynamic"
export const metadata = { title: "Modération — NEXUS" }

export default async function NexusModerationPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isNexusTeam) redirect("/dashboard")

  const [canModerate, canViewLogs] = await Promise.all([
    checkNexusPermission(session.user.id, "GLOBAL_MODERATION"),
    checkNexusPermission(session.user.id, "VIEW_LOGS"),
  ])

  if (!canModerate && !canViewLogs) redirect("/nexus/team")

  return (
    <div className="space-y-10 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">NEXUS Team</h1>
        <p className="text-sm text-muted-foreground">Gestion du staff de la plateforme</p>
      </div>
      <NexusNav />
      {canModerate
        ? <ModerationPanel mode="nexus" isNexusTeam={true} showLogs={canViewLogs} />
        : <LogsPanel mode="nexus" />
      }
    </div>
  )
}
