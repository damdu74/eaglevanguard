import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      isNexusTeam?: boolean
    } & DefaultSession["user"]
  }
}
