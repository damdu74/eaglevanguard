import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SettingsForm } from "@/components/settings/settings-form"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export const metadata = { title: "Paramètres" }

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/auth/signin")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { theme: true },
  })

  if (!user) redirect("/auth/signin")

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/dashboard" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1">
          <ChevronLeft className="h-4 w-4" />
          Retour au tableau de bord
        </Link>
        <h1 className="text-2xl font-bold">Paramètres</h1>
      </div>
      <SettingsForm theme={user.theme} />
    </div>
  )
}
