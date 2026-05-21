import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { SignInButtons } from "@/components/auth/sign-in-buttons"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Footer } from "@/components/layout/footer"
import { Shield } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export const metadata = { title: "Connexion" }

export default async function SignInPage() {
  const session = await getServerSession(authOptions)
  if (session) redirect("/dashboard")

  return (
    <div className="flex h-screen flex-col">
      <header className="shrink-0 border-b bg-background px-6 py-4">
        <Link href="/" className="flex items-center w-fit">
          <Image src="/icon.png" alt="NEXUS" width={36} height={36} />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center overflow-auto px-4">
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
      <Footer />
    </div>
  )
}
