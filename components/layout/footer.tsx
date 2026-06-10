import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-background py-4 px-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-light.png" alt="Eagle Vanguard" width={16} height={16} className="inline-block dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-dark.png"  alt="Eagle Vanguard" width={16} height={16} className="hidden dark:inline-block" />
          <span>© {new Date().getFullYear()} Eagle Vanguard — Plateforme communautaire</span>
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
