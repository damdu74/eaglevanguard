import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ModerationPanel } from "@/components/moderation/moderation-panel"
import { LogsPanel } from "@/components/logs/logs-panel"
import { Eagle VanguardNav } from "@/components/eagle-vanguard/eagle-vanguard-nav"
import { checkEagle VanguardPermission } from "@/lib/eagle-vanguard-auth"

export const dynamic = "force-dynamic"
export const metadata = { title: "Modération — Eagle Vanguard" }

export default async function Eagle VanguardModerationPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isEagleVanguardTeam) redirect("/dashboard")

  const [canModerate, canViewLogs] = await Promise.all([
    checkEagle VanguardPermission(session.user.id, "GLOBAL_MODERATION"),
    checkEagle VanguardPermission(session.user.id, "VIEW_LOGS"),
  ])

  if (!canModerate && !canViewLogs) redirect("/eagle-vanguard/team")

  return (
    <div className="space-y-10 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Eagle Vanguard Team</h1>
        <p className="text-sm text-muted-foreground">Gestion du staff de la plateforme</p>
      </div>
      <Eagle VanguardNav />
      {canModerate
        ? <ModerationPanel mode="eagle-vanguard" isEagleVanguardTeam={true} showLogs={canViewLogs} />
        : <LogsPanel mode="eagle-vanguard" />
      }
    </div>
  )
}
