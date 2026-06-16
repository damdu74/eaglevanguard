import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Navbar } from "@/components/layout/navbar"
import { Sidebar } from "@/components/layout/sidebar"
import { Footer } from "@/components/layout/footer"

const MEMBER_ONLY_PATHS = ["/dashboard", "/candidatures"]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/auth/signin")

  const userId = session.user?.id as string | undefined

  const [pendingFriendsCount, pendingApplicationsCount, membershipCount] = userId
    ? await Promise.all([
        prisma.friendship.count({ where: { receiverId: userId, status: "PENDING" } }),
        prisma.application.count({
          where: {
            status: "PENDING",
            community: {
              memberships: {
                some: {
                  userId,
                  OR: [
                    { role: "OWNER" },
                    { rank: { permissions: { has: "MANAGE_APPLICATIONS" } } },
                  ],
                },
              },
            },
          },
        }),
        prisma.membership.count({ where: { userId } }),
      ]).catch(() => [0, 0, 0] as [number, number, number])
    : [0, 0, 0]

  const hasMembership = membershipCount > 0
  const isEagleVanguardTeam = session.user?.isEagleVanguardTeam

  if (!hasMembership && !isEagleVanguardTeam) {
    const headersList = await headers()
    const pathname = headersList.get("x-pathname") ?? ""
    const allowed = MEMBER_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
    if (!allowed) redirect("/candidatures")
  }

  return (
    <div className="flex h-screen flex-col">
      <Navbar user={session.user} pendingFriendsCount={pendingFriendsCount} pendingApplicationsCount={pendingApplicationsCount} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isEagleVanguardTeam={session.user?.isEagleVanguardTeam} hasMembership={hasMembership} />
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
