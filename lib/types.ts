import type {
  User,
  Community,
  Membership,
  Rank,
  Unit,
  Event,
  MemberRole,
  EventStatus,
  ApplicationStatus,
} from "@prisma/client"

export type CommunityWithStats = Community & {
  _count: {
    memberships: number
    events: number
  }
}

export type MembershipWithDetails = Membership & {
  user: Pick<User, "id" | "name" | "image">
  rank: Rank | null
  unit: Unit | null
}

export type CommunityWithMemberships = Community & {
  memberships: MembershipWithDetails[]
  ranks: Rank[]
  units: Unit[]
}

export type EventWithParticipants = Event & {
  _count: { participants: number }
  participants?: Array<{
    userId: string
    status: string
    user: Pick<User, "id" | "name" | "image">
  }>
}

export type { MemberRole, EventStatus, ApplicationStatus }
