import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = "force-dynamic"
export const metadata = { title: "Tableau de bord" }

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const displayName = session!.user!.name ?? "Soldat"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Bienvenue, {displayName}</p>
      </div>
    </div>
  )
}
