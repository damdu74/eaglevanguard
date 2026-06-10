import Link from "next/link"
import Image from "next/image"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const factions = [
  { flag: "🇺🇸", name: "US Army", unit: "1st Infantry Division" },
  { flag: "🇺🇸", name: "US Army", unit: "101st Airborne" },
  { flag: "🇺🇸", name: "US Army", unit: "5th Ranger Battalion" },
  { flag: "🇬🇧", name: "UK Army", unit: "3rd Infantry Division" },
  { flag: "🇫🇷", name: "FFI", unit: "L'Aube Liberté" },
  { flag: "🇫🇷", name: "FFL", unit: "Régiment de marche du Tchad" },
  { flag: "🇫🇷", name: "FFL", unit: "2e Division Blindée" },
  { flag: "🇩🇪", name: "Wehrmacht", unit: "716. Infanterie‑Division" },
  { flag: "🇩🇪", name: "Wehrmacht", unit: "21. Panzer-Division" },
]

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="flex min-h-screen flex-col bg-[#0f1a0c] text-white">

      {/* Barre fixe du haut */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-black/40 px-6 py-3" style={{ backgroundColor: "#2a3d1a" }}>
        <Link href="/" className="flex items-center">
          <Image src="/icon-dark.png" alt="Eagle Vanguard" width={36} height={36} priority className="object-contain" />
        </Link>
        <div>
          {session ? (
            <Link href="/dashboard" className="inline-flex items-center border border-[#e8003c]/50 bg-[#e8003c]/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#e8003c]/20">
              Tableau de bord
            </Link>
          ) : (
            <Link href="/auth/signin" className="inline-flex items-center border border-[#e8003c]/50 bg-[#e8003c]/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#e8003c]/20">
              Connexion
            </Link>
          )}
        </div>
      </header>

      {/* Contenu scrollable */}
      <main className="flex-1 pt-[56px] pb-[48px]">

        {/* HERO */}
        <section className="relative flex flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(232,0,60,0.07),transparent)]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#e8003c]/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#e8003c]/10 to-transparent" />

          <div className="relative z-10 flex flex-col items-center gap-6">
            <Image src="/logo-dark.png" alt="Eagle Vanguard" width={200} height={200} priority className="object-contain drop-shadow-[0_0_40px_rgba(232,0,60,0.12)]" />
            <div>
              <h1 className="text-4xl font-black tracking-widest text-white sm:text-5xl">EAGLE VANGUARD</h1>
              <p className="mt-1 text-sm font-semibold tracking-[0.4em] uppercase text-[#e8003c]">1944 RP — Spearhead</p>
            </div>
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-[#e8003c] to-transparent" />
            <p className="max-w-xl text-sm text-white/40 tracking-widest uppercase">DLC Spearhead 1944 requis</p>
            <Link href="/auth/signin" className="mt-2 inline-flex items-center border border-[#e8003c]/50 bg-[#e8003c]/10 px-8 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#e8003c]/25">
              Rejoindre l&apos;aventure
            </Link>
          </div>
        </section>

        {/* BIENVENUE */}
        <section className="border-t border-white/5 px-6 py-16">
          <div className="mx-auto max-w-3xl space-y-6">
            <SectionLabel label="Bienvenue" />
            <h2 className="text-2xl font-bold text-white">Campagne <span className="text-[#e8003c]">Spearhead 1944</span></h2>
            <p className="text-sm leading-relaxed text-white/60">
              Bienvenue dans la campagne <strong className="text-white">"Spearhead 1944"</strong>, une expérience de jeu immersive qui vous plongera au cœur de l'action pendant la campagne de Normandie en 1944.
            </p>
            <p className="text-sm leading-relaxed text-white/60">
              La campagne de Normandie, qui a eu lieu du <strong className="text-white">6 juin au 25 août 1944</strong>, est l'un des événements les plus marquants de la Seconde Guerre mondiale. Elle a vu les forces alliées débarquer en Normandie, en France occupée par l'Allemagne nazie, dans le cadre de l'opération Overlord. Cette opération a été cruciale pour libérer l'Europe de l'oppression nazie et a été un tournant majeur dans le conflit.
            </p>
          </div>
        </section>

        {/* ROLEPLAY */}
        <section className="border-t border-white/5 bg-white/[0.02] px-6 py-16">
          <div className="mx-auto max-w-3xl space-y-6">
            <SectionLabel label="Roleplay" />
            <h2 className="text-2xl font-bold text-white">Cadre <span className="text-[#e8003c]">RP Vocal</span></h2>
            <p className="text-sm leading-relaxed text-white/60">
              Cette campagne s'inscrit dans un cadre de <strong className="text-white">RP vocal</strong>, où chaque joueur incarnera plusieurs personnages évoluant dans le contexte de la Seconde Guerre mondiale, durant la Campagne de Normandie en 1944.
            </p>
            <p className="text-sm leading-relaxed text-white/60">
              L'objectif est de plonger pleinement dans un univers immersif, mêlant <strong className="text-white">réalisme militaire</strong> et jeu de rôle. Vous serez amenés à vivre différentes situations : missions annexes, patrouilles, opérations, activités de garnison, ou encore interactions entre soldats, civils et résistants.
            </p>
            <p className="text-sm leading-relaxed text-white/60">
              Le tout se déroule dans un cadre <strong className="text-white">Milsim sur Arma 3</strong>, où la discipline et la cohérence tactique restent essentielles. Le RP vient simplement enrichir l'expérience en donnant plus de profondeur à vos personnages et à l'histoire que nous écrirons ensemble.
            </p>
          </div>
        </section>

        {/* FACTIONS */}
        <section className="border-t border-white/5 px-6 py-16">
          <div className="mx-auto max-w-3xl space-y-8">
            <div className="space-y-2">
              <SectionLabel label="Factions & Personnages" />
              <h2 className="text-2xl font-bold text-white">9 Factions, <span className="text-[#e8003c]">9 points de vue</span></h2>
              <p className="text-sm text-white/60">Pour rendre cette expérience encore plus immersive, créez des personnages uniques que vous incarnerez dans chaque armée.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {factions.map(({ flag, name, unit }) => (
                <div key={unit} className="flex items-center gap-3 border border-white/8 bg-white/[0.03] px-4 py-3 hover:border-[#e8003c]/30 transition-colors">
                  <span className="text-xl">{flag}</span>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#7a8a2a]">{name}</p>
                    <p className="text-sm font-semibold text-white">{unit}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MODS & DLC */}
        <section className="border-t border-white/5 bg-white/[0.02] px-6 py-16">
          <div className="mx-auto max-w-3xl space-y-6">
            <SectionLabel label="Mods & DLC" />
            <h2 className="text-2xl font-bold text-white">DLC <span className="text-[#e8003c]">Spearhead 1944</span> — Obligatoire</h2>
            <p className="text-sm leading-relaxed text-white/60">
              La campagne utilise le <strong className="text-white">DLC Spearhead 1944</strong>, obligatoire pour intégrer le projet. Ce DLC apporte une énorme plus-value immersive, grâce à ses modèles haute définition, ses maps de qualité, et un niveau de détail nettement supérieur à celui des anciens mods WW2.
            </p>
            <p className="text-sm leading-relaxed text-white/60">
              Arma 3 n'étant plus tout jeune, Spearhead 1944 permet de redonner vie au jeu en offrant une expérience visuelle et sonore bien plus réaliste et moderne, tant au niveau des armes, des uniformes que de l'environnement.
            </p>
            <ul className="space-y-2 text-sm text-white/60">
              {[
                "Animations — postures, transitions, gestuelles immersives",
                "Refonte sonore et effets visuels (VFX)",
                "Essentiels Milsim : Task Force Radio et ACE",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#e8003c]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* NOUS REJOINDRE */}
        <section className="border-t border-white/5 px-6 py-20 text-center">
          <div className="mx-auto max-w-2xl space-y-6">
            <SectionLabel label="Nous rejoindre" center />
            <h2 className="text-3xl font-black tracking-tight text-white">
              Rejoignez l&apos;aventure,{" "}
              <span className="text-[#e8003c]">soldat.</span>
            </h2>
            <p className="text-sm leading-relaxed text-white/60">
              Vous possédez le DLC Spearhead 1944 ? Plongez au cœur de la Normandie en 1944, aux côtés de passionnés d'histoire, de Milsim et de Roleplay. Vivez l'immersion d'une campagne unique, incarnez des soldats, résistants ou blindés, dans le tumulte de la Seconde Guerre mondiale.
            </p>
            <p className="text-xs uppercase tracking-widest text-white/30">La Normandie vous attend.</p>
            <Link
              href={session ? "/dashboard" : "/auth/signin"}
              className="inline-flex items-center border border-[#e8003c]/60 bg-[#e8003c]/15 px-10 py-4 text-xs font-bold uppercase tracking-[0.25em] text-white transition-colors hover:bg-[#e8003c]/25"
            >
              Direction les tickets
            </Link>
          </div>
        </section>

      </main>

      {/* Barre fixe du bas */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-black/40 px-6 py-3" style={{ backgroundColor: "#2a3d1a" }}>
        <span className="text-[10px] uppercase tracking-widest text-white/40">
          © {new Date().getFullYear()} Eagle Vanguard
        </span>
        <nav className="flex items-center gap-5 text-[10px] uppercase tracking-widest text-white/30">
          <Link href="/legal/mentions-legales" className="hover:text-white/60 transition-colors">Mentions légales</Link>
          <span className="text-white/10">·</span>
          <Link href="/legal/confidentialite" className="hover:text-white/60 transition-colors">Confidentialité</Link>
          <span className="text-white/10">·</span>
          <Link href="/legal/cgu" className="hover:text-white/60 transition-colors">CGU</Link>
        </nav>
      </footer>

    </div>
  )
}

function SectionLabel({ label, center }: { label: string; center?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${center ? "justify-center" : ""}`}>
      <div className="h-px w-6 bg-[#e8003c]" />
      <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#e8003c]">{label}</span>
      <div className="h-px w-6 bg-[#e8003c]" />
    </div>
  )
}
