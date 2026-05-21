import Link from "next/link"
import { Shield } from "lucide-react"
import { Footer } from "@/components/layout/footer"

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <header className="shrink-0 border-b bg-background px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-bold w-fit">
          <Shield className="h-5 w-5 text-primary" />
          NEXUS
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
