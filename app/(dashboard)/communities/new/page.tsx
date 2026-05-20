import { CreateCommunityForm } from "@/components/community/create-community-form"

export const metadata = { title: "Nouvelle communauté" }

export default function NewCommunityPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Créer une communauté</h1>
        <p className="text-muted-foreground">Créez votre communauté MILSIM et invitez vos membres.</p>
      </div>
      <CreateCommunityForm />
    </div>
  )
}
