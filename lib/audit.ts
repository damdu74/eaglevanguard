import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export type AuditAction =
  // Comptes
  | "USER_CREATED"
  // Communautés
  | "COMMUNITY_CREATED"
  | "COMMUNITY_DELETED"
  | "COMMUNITY_UPDATED"
  // Membres
  | "MEMBER_JOINED"
  | "MEMBER_LEFT"
  | "MEMBER_KICKED"
  | "MEMBER_ROLE_CHANGED"
  | "MEMBER_RANK_CHANGED"
  // Candidatures
  | "APPLICATION_SUBMITTED"
  | "APPLICATION_ACCEPTED"
  | "APPLICATION_REJECTED"
  | "APPLICATION_WITHDRAWN"
  // Événements
  | "EVENT_CREATED"
  | "EVENT_UPDATED"
  | "EVENT_DELETED"
  | "EVENT_STATUS_CHANGED"
  // Modération
  | "MODERATION_WARN"
  | "MODERATION_KICK"
  | "MODERATION_BAN_COMMUNITY"
  | "MODERATION_BAN_PLATFORM"
  | "MODERATION_UNBAN"
  | "MODERATION_RESOLVED"
  // Eagle Vanguard Team
  | "Eagle Vanguard_MEMBER_ADDED"
  | "Eagle Vanguard_MEMBER_REMOVED"
  | "Eagle Vanguard_RANK_CREATED"
  | "Eagle Vanguard_RANK_UPDATED"
  | "Eagle Vanguard_RANK_DELETED"
  // Posts
  | "POST_CREATED"
  | "POST_DELETED"
  // Grades communauté
  | "RANK_CREATED"
  | "RANK_DELETED"

interface CreateAuditLogParams {
  action: AuditAction
  description: string
  actorId?: string | null
  targetId?: string | null
  communityId?: string | null
  metadata?: Prisma.InputJsonValue
}

export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        description: params.description,
        actorId: params.actorId ?? null,
        targetId: params.targetId ?? null,
        communityId: params.communityId ?? null,
        metadata: params.metadata ?? undefined,
      },
    })
  } catch {
    // Ne jamais faire planter une route à cause d'un log raté
  }
}
