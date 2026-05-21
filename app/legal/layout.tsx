import Link from "next/link"
import Image from "next/image"
import { Footer } from "@/components/layout/footer"
import { ChevronLeft } from "lucide-react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const backHref = session ? "/dashboard" : "/"
  const backLabel = session ? "Tableau de bord" : "Accueil"

  return (
    <div className="flex h-screen flex-col">
      <header className="flex shrink-0 items-center justify-between border-b bg-background px-6 py-2 z-50">
        <Link href="/" className="flex items-center">
          <Image src="/icon.png" alt="NEXUS" width={36} height={36} />
        </Link>
        <Link
          href={backHref}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      </header>
      <main className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto w-full px-6 py-10">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  )
}
