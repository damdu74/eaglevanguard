import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SettingsForm } from "@/components/settings/settings-form"

export const metadata = { title: "Paramètres" }

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/auth/signin")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { bio: true, visibility: true, theme: true },
  })

  if (!user) redirect("/auth/signin")

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Paramètres</h1>
      <SettingsForm bio={user.bio ?? ""} visibility={user.visibility} theme={user.theme} />
    </div>
  )
}
