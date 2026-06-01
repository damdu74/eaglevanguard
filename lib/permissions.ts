import type { MemberRole } from "@prisma/client"

export const COMMUNITY_PERMISSIONS = [
  "MANAGE_MEMBERS",       // kick, changer le rôle des membres
  "MANAGE_EVENTS",        // créer, modifier, annuler des événements
  "MANAGE_APPLICATIONS",  // accepter / refuser des candidatures
  "MANAGE_POSTS",         // publier / supprimer des annonces
  "MODERATE",             // accès à la page modération
  "VIEW_LOGS",            // accès aux logs d'activité
  "MANAGE_SETTINGS",      // modifier les paramètres de la communauté
  "MANAGE_RANKS",         // gérer les grades de la communauté
] as const

export type CommunityPermission = typeof COMMUNITY_PERMISSIONS[number]

export const PERMISSION_LABELS: Record<CommunityPermission, string> = {
  MANAGE_MEMBERS:      "Gérer les membres",
  MANAGE_EVENTS:       "Gérer les événements",
  MANAGE_APPLICATIONS: "Gérer les candidatures",
  MANAGE_POSTS:        "Publier des annonces",
  MODERATE:            "Modération",
  VIEW_LOGS:           "Voir les logs",
  MANAGE_SETTINGS:     "Paramètres de la communauté",
  MANAGE_RANKS:        "Gérer les grades",
}

interface MembershipLike {
  role: MemberRole
  rank?: { permissions: string[] } | null
}

export function hasCommunityPermission(
  membership: MembershipLike | null | undefined,
  permission: CommunityPermission
): boolean {
  if (!membership) return false
  if (membership.role === "OWNER") return true
  return membership.rank?.permissions.includes(permission) ?? false
}

export function isStaff(membership: MembershipLike | null | undefined): boolean {
  if (!membership) return false
  if (membership.role === "OWNER") return true
  return (membership.rank?.permissions.length ?? 0) > 0
}

export const ROLE_LABELS: Record<MemberRole, string> = {
  OWNER:   "Propriétaire",
  MEMBER:  "Membre",
  RECRUIT: "Nouveau Membre",
}

// ─── NEXUS TEAM PERMISSIONS ───────────────────────────────────────────────────

export const NEXUS_PERMISSIONS = [
  "MANAGE_TEAM",         // ajouter/retirer des membres NEXUS, changer leurs rôles
  "MANAGE_RANKS",        // créer/modifier/supprimer les rangs NEXUS
  "GLOBAL_MODERATION",   // accès à la modération globale (WARN, KICK, BAN)
  "BAN_PLATFORM",        // bannir/débannir de la plateforme
  "VIEW_LOGS",           // voir les logs d'activité globaux
] as const

export type NexusPermission = typeof NEXUS_PERMISSIONS[number]

export const NEXUS_PERMISSION_LABELS: Record<NexusPermission, string> = {
  MANAGE_TEAM:       "Gérer l'équipe NEXUS",
  MANAGE_RANKS:      "Gérer les rangs et fonctions",
  GLOBAL_MODERATION: "Modération globale",
  BAN_PLATFORM:      "Bannir de la plateforme",
  VIEW_LOGS:         "Voir les logs globaux",
}

interface NexusRankLike {
  permissions: string[]
  isProtected: boolean
}

export function hasNexusPermission(
  nexusRank: NexusRankLike | null | undefined,
  permission: NexusPermission
): boolean {
  if (!nexusRank) return false
  if (nexusRank.isProtected) return true
  return nexusRank.permissions.includes(permission)
}
