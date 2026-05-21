import Link from "next/link"
import Image from "next/image"
import { Footer } from "@/components/layout/footer"

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex shrink-0 items-center border-b bg-background px-6 py-2 z-50">
        <Link href="/" className="flex items-center">
          <Image src="/icon.png" alt="NEXUS" width={36} height={36} />
        </Link>
      </header>
      <main className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto w-full px-6 py-10">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  )
}
