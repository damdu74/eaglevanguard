"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function SignInButtons() {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-3">
      <Button
        className="w-full gap-2"
        onClick={() => router.push("/api/auth/steam")}
      >
        <Image src="/steam-logo.svg" alt="Steam" width={20} height={20} />
        Continuer avec Steam
      </Button>
    </div>
  )
}
