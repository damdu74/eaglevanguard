export const metadata = { title: "Mentions légales" }

export default function MentionsLegalesPage() {
  return (
    <article className="prose prose-sm dark:prose-invert max-w-none">
      <h1>Mentions légales</h1>
      <p className="text-muted-foreground text-sm">Dernière mise à jour : mai 2026</p>

      <h2>Éditeur du site</h2>
      <p>
        Le site <strong>NEXUS</strong> est édité à titre personnel et non commercial.<br />
        Contact : <a href="mailto:contact@nexus-milsim.fr">contact@nexus-milsim.fr</a>
      </p>

      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par :<br />
        <strong>Vercel Inc.</strong><br />
        340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis<br />
        <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a>
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des contenus présents sur NEXUS (textes, graphismes, logo, structure) sont protégés
        par le droit d&apos;auteur. Toute reproduction, même partielle, est interdite sans autorisation préalable.
      </p>

      <h2>Limitation de responsabilité</h2>
      <p>
        NEXUS est une plateforme communautaire. Les contenus publiés par les utilisateurs (descriptions,
        messages, candidatures) n&apos;engagent que leurs auteurs. L&apos;éditeur ne peut être tenu responsable
        des contenus générés par les membres.
      </p>

      <h2>Loi applicable</h2>
      <p>
        Le présent site est soumis au droit français. Tout litige relatif à son utilisation sera
        soumis aux juridictions françaises compétentes.
      </p>
    </article>
  )
}
