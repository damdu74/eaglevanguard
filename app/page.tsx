import Link from "next/link"
import Image from "next/image"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="flex h-screen flex-col bg-[#0f1a0c] text-white">

      {/* Barre fixe du haut */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-black/40 px-6 py-3" style={{ backgroundImage: "url('/erbsenmuster.svg')", backgroundRepeat: "repeat", backgroundSize: "120px 80px" }}>
        <Link href="/" className="flex items-center gap-2">
          <Image src="/icon.png" alt="Eagle Vanguard" width={28} height={28} priority />
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">Eagle Vanguard</span>
        </Link>
        <div>
          {session ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center border border-[#e8003c]/50 bg-[#e8003c]/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#e8003c]/20"
            >
              Tableau de bord
            </Link>
          ) : (
            <Link
              href="/auth/signin"
              className="inline-flex items-center border border-[#e8003c]/50 bg-[#e8003c]/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#e8003c]/20"
            >
              Connexion
            </Link>
          )}
        </div>
      </header>

      {/* Contenu centré */}
      <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden">

        {/* Grain texture overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:url('data:image/svg+xml,%3Csvg viewBox%3D%220 0 256 256%22 xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cfilter id%3D%22noise%22%3E%3CfeTurbulence type%3D%22fractalNoise%22 baseFrequency%3D%220.9%22 numOctaves%3D%224%22 stitchTiles%3D%22stitch%22/%3E%3C/filter%3E%3Crect width%3D%22100%25%22 height%3D%22100%25%22 filter%3D%22url(%23noise)%22/%3E%3C/svg%3E')]" />

        {/* Radial glow rouge */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(232,0,60,0.08),transparent)]" />

        {/* Lignes horizontales décoratives */}
        <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-20 bg-gradient-to-r from-transparent via-[#e8003c]/20 to-transparent" />
        <div className="absolute top-1/2 left-0 right-0 h-px translate-y-20 bg-gradient-to-r from-transparent via-[#e8003c]/10 to-transparent" />

        {/* Titre */}
        <div className="relative z-10 flex flex-col items-center gap-5 text-center px-6">
          <p className="text-[10px] font-semibold tracking-[0.4em] uppercase text-[#7a8a2a]">
            Communauté — Milsim
          </p>
          <h1 className="text-6xl font-black tracking-tight sm:text-7xl lg:text-8xl leading-none">
            EAGLE <span className="text-[#e8003c]">VANGUARD</span>
          </h1>
          <div className="h-0.5 w-24 bg-[#e8003c]" />
          <p className="text-sm text-white/30 tracking-widest uppercase">
            Plateforme communautaire
          </p>
        </div>

      </main>

      {/* Barre fixe du bas */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-black/40 px-6 py-3" style={{ backgroundImage: "url('/erbsenmuster.svg')", backgroundRepeat: "repeat", backgroundSize: "120px 80px" }}>
        <span className="text-[10px] uppercase tracking-widest text-white/20">
          © {new Date().getFullYear()} Eagle Vanguard
        </span>
        <nav className="flex items-center gap-5 text-[10px] uppercase tracking-widest text-white/20">
          <Link href="/legal/mentions-legales" className="hover:text-white/40 transition-colors">Mentions légales</Link>
          <span className="text-white/10">·</span>
          <Link href="/legal/confidentialite" className="hover:text-white/40 transition-colors">Confidentialité</Link>
          <span className="text-white/10">·</span>
          <Link href="/legal/cgu" className="hover:text-white/40 transition-colors">CGU</Link>
        </nav>
      </footer>

    </div>
  )
}
