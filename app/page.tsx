import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Shield, Users, Calendar, GitBranch, ChevronRight, Crosshair, Clock } from "lucide-react"

const features = [
  {
    icon: Users,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    title: "Recrutement",
    desc: "Publiez vos critères, recevez les candidatures et communiquez directement avec vos candidats depuis la plateforme.",
  },
  {
    icon: Shield,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    title: "Grades & Hiérarchie",
    desc: "Créez votre propre système de grades avec couleurs personnalisées. Les recrues sont promus automatiquement après 7 jours.",
  },
  {
    icon: GitBranch,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    title: "ORBAT Interactif",
    desc: "Construisez votre ordre de bataille avec un éditeur visuel drag & drop. Assignez vos membres à chaque poste.",
  },
  {
    icon: Calendar,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
    title: "Opérations & Événements",
    desc: "Planifiez vos missions et entraînements, gérez les inscriptions et suivez la participation en temps réel.",
  },
]

const games = [
  {
    name: "Arma 3",
    tag: "Disponible",
    available: true,
    desc: "Simulation militaire — MILSIM, Zeus, campagnes coopératives.",
  },
  {
    name: "DayZ",
    tag: "Bientôt",
    available: false,
    desc: "Survie post-apocalyptique — factions, zones contrôlées, événements.",
  },
  {
    name: "Squad",
    tag: "Bientôt",
    available: false,
    desc: "FPS tactique — escouades, commandement, coordination terrain.",
  },
  {
    name: "Hell Let Loose",
    tag: "Bientôt",
    available: false,
    desc: "Simulation WW2 — unités historiques, stratégie, commandement.",
  },
]

export default function HomePage() {
  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-white">

      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 backdrop-blur px-6 py-2 z-50">
        <Link href="/" className="flex items-center">
          <Image src="/icon.png" alt="NEXUS" width={36} height={36} priority />
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-zinc-400 hover:text-white" asChild>
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
        <section className="relative flex flex-col items-center gap-10 px-4 pt-16 pb-24 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(109,40,217,0.20),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_70%,rgba(109,40,217,0.07),transparent)]" />

          <Image
            src="/logo.png"
            alt="NEXUS"
            width={280}
            height={215}
            priority
            className="relative z-10 drop-shadow-[0_0_50px_rgba(139,92,246,0.45)]"
          />

          <div className="relative z-10 space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-300 mb-2">
              <Crosshair className="h-3 w-3" />
              Plateforme communautaire jeux vidéo
            </div>
            <h1 className="text-5xl font-bold tracking-tight lg:text-6xl leading-tight">
              Créez, gérez et faites{" "}
              <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-violet-400 bg-clip-text text-transparent">
                grandir
              </span>
              <br />
              votre communauté
            </h1>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              NEXUS centralise le recrutement, la hiérarchie, l&apos;ORBAT et les événements de votre communauté dans une seule plateforme pensée pour les joueurs sérieux.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap gap-4 justify-center">
            <Button size="lg" className="bg-violet-600 hover:bg-violet-700 gap-2 px-8" asChild>
              <Link href="/auth/signin">
                Créer ma communauté
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

        {/* Jeux supportés */}
        <section className="border-t border-zinc-800 px-4 py-16">
          <div className="mx-auto max-w-5xl space-y-10">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Jeux supportés</h2>
              <p className="text-zinc-500 text-sm">Un jeu disponible aujourd&apos;hui, d&apos;autres arrivent prochainement.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {games.map(({ name, tag, available, desc }) => (
                <div
                  key={name}
                  className={`relative rounded-xl border p-5 transition-colors ${
                    available
                      ? "border-violet-500/40 bg-violet-500/5 hover:border-violet-500/60"
                      : "border-zinc-800 bg-zinc-900/30 opacity-50"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-white">{name}</span>
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                        available
                          ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                          : "text-zinc-500 border-zinc-700 bg-zinc-800/50"
                      }`}>
                        {!available && <Clock className="h-2.5 w-2.5" />}
                        {tag}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-zinc-800 bg-zinc-900/30 px-4 py-16">
          <div className="mx-auto max-w-5xl space-y-10">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Tout ce dont votre communauté a besoin</h2>
              <p className="text-zinc-500 text-sm max-w-xl mx-auto">
                Des outils pensés pour les communautés organisées — recrutement, structure, planification.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {features.map(({ icon: Icon, color, bg, title, desc }) => (
                <div
                  key={title}
                  className="flex gap-5 rounded-xl border border-zinc-800 bg-zinc-900 p-6 hover:border-zinc-700 transition-colors"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${bg}`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-semibold text-white text-sm">{title}</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-zinc-800 px-4 py-16 text-center">
          <div className="mx-auto max-w-xl space-y-5">
            <h2 className="text-2xl font-bold text-white">Prêt à lancer votre communauté ?</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Rejoignez NEXUS et donnez à votre communauté une base solide pour recruter, s&apos;organiser et progresser.
            </p>
            <Button size="lg" className="bg-violet-600 hover:bg-violet-700 gap-2 px-8" asChild>
              <Link href="/auth/signin">
                Commencer gratuitement
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="shrink-0 border-t border-zinc-800 bg-zinc-950 py-4 px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.png" alt="NEXUS" width={16} height={16} className="inline-block" />
            <span>© {new Date().getFullYear()} NEXUS — Plateforme communautaire</span>
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
  )
}
