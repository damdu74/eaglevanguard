export const metadata = { title: "Politique de confidentialité" }

export default function ConfidentialitePage() {
  return (
    <article className="prose prose-sm dark:prose-invert max-w-none">
      <h1>Politique de confidentialité</h1>
      <p className="text-muted-foreground text-sm">Dernière mise à jour : mai 2026</p>

      <h2>Données collectées</h2>
      <p>Lors de votre utilisation de NEXUS, nous collectons les données suivantes :</p>
      <ul>
        <li><strong>Via Steam</strong> : identifiant Steam (SteamID), pseudo Steam, avatar Steam.</li>
        <li><strong>Via Discord (optionnel)</strong> : identifiant Discord, pseudo Discord, avatar Discord.</li>
        <li><strong>Données de profil</strong> : bio, avatar personnalisé, préférences de visibilité.</li>
        <li><strong>Données de navigation</strong> : logs serveur standards (adresse IP, navigateur) conservés par l&apos;hébergeur Vercel.</li>
      </ul>

      <h2>Finalité du traitement</h2>
      <p>Ces données sont utilisées exclusivement pour :</p>
      <ul>
        <li>Créer et gérer votre compte sur la plateforme.</li>
        <li>Permettre votre participation aux communautés et événements.</li>
        <li>Envoyer des notifications internes à la plateforme.</li>
        <li>Assurer la sécurité et le bon fonctionnement du service.</li>
      </ul>

      <h2>Base légale</h2>
      <p>
        Le traitement repose sur votre consentement (article 6.1.a du RGPD), exprimé lors de
        votre connexion via Steam ou Discord.
      </p>

      <h2>Conservation des données</h2>
      <p>
        Vos données sont conservées tant que votre compte est actif. En cas de suppression de compte,
        l&apos;ensemble de vos données personnelles est supprimé dans un délai de 30 jours.
      </p>

      <h2>Partage des données</h2>
      <p>
        Vos données ne sont jamais vendues ni cédées à des tiers. Elles peuvent être partagées
        uniquement avec les services techniques nécessaires au fonctionnement de la plateforme
        (Vercel pour l&apos;hébergement, Neon pour la base de données).
      </p>

      <h2>Vos droits</h2>
      <p>Conformément au RGPD, vous disposez des droits suivants :</p>
      <ul>
        <li><strong>Droit d&apos;accès</strong> : consulter les données vous concernant.</li>
        <li><strong>Droit de rectification</strong> : corriger des données inexactes.</li>
        <li><strong>Droit à l&apos;effacement</strong> : demander la suppression de votre compte et de vos données.</li>
        <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format lisible.</li>
      </ul>
      <p>
        Pour exercer ces droits, contactez-nous à :{" "}
        <a href="mailto:contact@nexus-milsim.fr">contact@nexus-milsim.fr</a>
      </p>

      <h2>Cookies</h2>
      <p>
        NEXUS utilise uniquement des cookies strictement nécessaires au fonctionnement de la session
        d&apos;authentification. Aucun cookie publicitaire ou de traçage tiers n&apos;est utilisé.
      </p>
    </article>
  )
}
