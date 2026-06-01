import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NexusNav } from "@/components/nexus/nexus-nav"
import { LogsPanel } from "@/components/logs/logs-panel"
import { checkNexusPermission } from "@/lib/nexus-auth"

export const dynamic = "force-dynamic"
export const metadata = { title: "Logs — NEXUS" }

export default async function NexusLogsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isNexusTeam) redirect("/dashboard")
  if (!await checkNexusPermission(session.user.id, "VIEW_LOGS")) redirect("/nexus/team")

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">NEXUS Team</h1>
        <p className="text-sm text-muted-foreground">Gestion du staff de la plateforme</p>
      </div>
      <NexusNav />
      <LogsPanel mode="nexus" />
    </div>
  )
}
