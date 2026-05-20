import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Users, Calendar, GitBranch } from "lucide-react"

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-24 text-center">
        <Badge variant="secondary" className="text-sm">
          N · E · X · U · S
        </Badge>
        <h1 className="text-5xl font-bold tracking-tight lg:text-7xl">
          Gérez votre communauté
          <br />
          <span className="text-primary">gaming</span>
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Organisez vos unités, planifiez vos opérations, gérez vos joueurs et
          construisez votre ORBAT avec la plateforme dédiée aux communautés
          de simulation militaire.
        </p>
        <div className="flex gap-4">
          <Button size="lg" asChild>
            <Link href="/auth/signin">Commencer</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/communities">Explorer les communautés</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/50 px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold">Fonctionnalités</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Shield,
                title: "Gestion des grades",
                desc: "Créez une hiérarchie personnalisée avec grades et insignes.",
              },
              {
                icon: GitBranch,
                title: "ORBAT interactif",
                desc: "Visualisez et éditez votre ordre de bataille avec React Flow.",
              },
              {
                icon: Calendar,
                title: "Opérations",
                desc: "Planifiez et gérez vos opérations et entraînements.",
              },
              {
                icon: Users,
                title: "Gestion des joueurs",
                desc: "Recrutez, organisez et suivez vos membres.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col gap-3 rounded-lg border bg-background p-6">
                <Icon className="h-8 w-8 text-primary" />
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
