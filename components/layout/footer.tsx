import Link from "next/link"
import { Shield } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-background py-4 px-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5" />
          <span>© {new Date().getFullYear()} NEXUS — Plateforme MILSIM</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/legal/mentions-legales" className="hover:text-foreground transition-colors">
            Mentions légales
          </Link>
          <Link href="/legal/confidentialite" className="hover:text-foreground transition-colors">
            Confidentialité
          </Link>
          <Link href="/legal/cgu" className="hover:text-foreground transition-colors">
            CGU
          </Link>
        </nav>
      </div>
    </footer>
  )
}
