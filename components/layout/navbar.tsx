"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Shield, LogOut, Settings, User, Bell } from "lucide-react"
import type { Session } from "next-auth"

interface NavbarProps {
  user: Session["user"]
  pendingFriendsCount?: number
}

export function Navbar({ user, pendingFriendsCount = 0 }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="flex h-14 items-center px-4 gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold">
          <Shield className="h-5 w-5 text-primary" />
          NEXUS
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-4">
          <Link
            href="/dashboard"
            className="rounded-md px-3 py-1.5 text-sm hover:bg-muted transition-colors"
          >
            Tableau de bord
          </Link>
          <Link
            href="/communities"
            className="rounded-md px-3 py-1.5 text-sm hover:bg-muted transition-colors"
          >
            Communautés
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/players/friends"
            className="relative flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted transition-colors"
            title={pendingFriendsCount > 0 ? `${pendingFriendsCount} demande${pendingFriendsCount > 1 ? "s" : ""} d'ami` : "Notifications"}
          >
            <Bell className="h-4 w-4" />
            {pendingFriendsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                {pendingFriendsCount > 9 ? "9+" : pendingFriendsCount}
              </span>
            )}
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.image ?? ""} alt={user?.name ?? ""} />
                  <AvatarFallback>{user?.name?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/profile" className="flex w-full items-center gap-2">
                  <User className="h-4 w-4" />
                  Profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/settings" className="flex w-full items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Paramètres
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center gap-2 text-destructive focus:text-destructive"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
