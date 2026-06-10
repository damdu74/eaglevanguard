import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { CreateCommunityForm } from "@/components/community/create-community-form"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export const metadata = { title: "Nouvelle communauté" }

export default async function NewCommunityPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isEagleVanguardTeam) redirect("/communities")

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/communities" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1">
          <ChevronLeft className="h-4 w-4" />
          Communautés
        </Link>
        <h1 className="text-2xl font-bold">Créer une communauté</h1>
        <p className="text-muted-foreground">Créez votre communauté MILSIM et invitez vos membres.</p>
      </div>
      <CreateCommunityForm />
    </div>
  )
}
