import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Navbar } from "@/components/layout/navbar"
import { Sidebar } from "@/components/layout/sidebar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/auth/signin")

  const pendingFriendsCount = session.user?.id
    ? await prisma.friendship.count({
        where: { receiverId: session.user.id as string, status: "PENDING" },
      })
    : 0

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={session.user} pendingFriendsCount={pendingFriendsCount} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
