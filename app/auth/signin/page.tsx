import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { SignInButtons } from "@/components/auth/sign-in-buttons"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield } from "lucide-react"

export const metadata = { title: "Connexion" }

export default async function SignInPage() {
  const session = await getServerSession(authOptions)
  if (session) redirect("/dashboard")

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>NEXUS</CardTitle>
          <CardDescription>Connectez-vous pour accéder à votre communauté</CardDescription>
        </CardHeader>
        <CardContent>
          <SignInButtons />
        </CardContent>
      </Card>
    </main>
  )
}
