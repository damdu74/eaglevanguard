import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Shield, Users, Calendar, GitBranch, ChevronRight } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-white">

      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 backdrop-blur px-6 py-2 z-50">
        <Link href="/" className="flex items-center">
          <Image src="/icon.png" alt="NEXUS" width={36} height={36} priority />
        </Link>
        <div className="flex gap-3">
          <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-zinc-800" asChild>
            <Link href="/communities">Communautés</Link>
          </Button>
          <Button className="bg-violet-600 hover:bg-violet-700" asChild>
            <Link href="/auth/signin">Connexion</Link>
          </Button>
        </div>
      </header>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-auto">

        {/* Hero */}
        <section className="relative flex flex-col items-center gap-10 px-4 pt-14 pb-28 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(109,40,217,0.18),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_50%_60%,rgba(109,40,217,0.06),transparent)]" />

          <Image
            src="/logo.png"
            alt="NEXUS"
            width={300}
            height={230}
            priority
            className="relative z-10 drop-shadow-[0_0_40px_rgba(139,92,246,0.4)]"
          />

          <div className="relative z-10 space-y-5 max-w-3xl">
            <h1 className="text-5xl font-bold tracking-tight lg:text-7xl leading-tight">
              La plateforme des
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-violet-400 bg-clip-text text-transparent">
                unités MILSIM
              </span>
            </h1>
            <p className="text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
              Recrutez, organisez et commandez votre unité ARMA 3.
              Grades, ORBAT, opérations et gestion des membres — tout en un.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap gap-4 justify-center">
            <Button size="lg" className="bg-violet-600 hover:bg-violet-700 gap-2 px-8" asChild>
              <Link href="/auth/signin">
                Rejoindre NEXUS
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              asChild
            >
              <Link href="/communities">Explorer les communautés</Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-zinc-800 bg-zinc-900/40 px-4 py-24">
          <div className="mx-auto max-w-5xl space-y-14">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-white">Conçu pour les unités sérieuses</h2>
              <p className="text-zinc-400 max-w-xl mx-auto">
                Tous les outils dont votre communauté MILSIM a besoin, dans une seule plateforme.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {[
                {
                  icon: Shield,
                  color: "text-violet-400",
                  bg: "bg-violet-500/10 border-violet-500/20",
                  title: "Grades & Promotions",
                  desc: "Définissez votre hiérarchie avec des grades personnalisés. Les recrues sont automatiquement promus membres après 7 jours d'activité.",
                },
                {
                  icon: GitBranch,
                  color: "text-blue-400",
                  bg: "bg-blue-500/10 border-blue-500/20",
                  title: "ORBAT Interactif",
                  desc: "Construisez votre ordre de bataille avec un éditeur visuel drag & drop. Assignez vos membres à chaque nœud de la structure.",
                },
                {
                  icon: Calendar,
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10 border-emerald-500/20",
                  title: "Opérations & Événements",
                  desc: "Planifiez missions et entraînements, gérez les inscriptions et suivez la participation de vos membres en temps réel.",
                },
                {
                  icon: Users,
                  color: "text-orange-400",
                  bg: "bg-orange-500/10 border-orange-500/20",
                  title: "Gestion des membres",
                  desc: "Système de candidatures avec messagerie intégrée, notifications en temps réel et gestion fine des rôles et permissions.",
                },
              ].map(({ icon: Icon, color, bg, title, desc }) => (
                <div
                  key={title}
                  className="flex gap-5 rounded-xl border border-zinc-800 bg-zinc-900 p-6 hover:border-zinc-700 transition-colors"
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${bg}`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-semibold text-white">{title}</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-800 bg-zinc-950 py-4 px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              <span>© {new Date().getFullYear()} NEXUS — Plateforme MILSIM</span>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/legal/mentions-legales" className="hover:text-zinc-300 transition-colors">
                Mentions légales
              </Link>
              <Link href="/legal/confidentialite" className="hover:text-zinc-300 transition-colors">
                Confidentialité
              </Link>
              <Link href="/legal/cgu" className="hover:text-zinc-300 transition-colors">
                CGU
              </Link>
            </nav>
          </div>
        </footer>

      </div>
    </div>
  )
}
