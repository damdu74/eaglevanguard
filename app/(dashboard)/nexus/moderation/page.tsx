import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ModerationPanel } from "@/components/moderation/moderation-panel"

export const dynamic = "force-dynamic"
export const metadata = { title: "Modération — NEXUS" }

export default async function NexusModerationPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isNexusTeam) redirect("/dashboard")

  return (
    <ModerationPanel
      mode="nexus"
      currentUserId={session.user.id}
      isNexusTeam={true}
    />
  )
}
