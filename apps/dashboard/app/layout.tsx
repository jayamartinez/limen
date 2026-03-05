// app/layout.tsx
import "./globals.css"
import Providers from "./providers"
import Image from "next/image"
import Link from "next/link"

import { BarChart3, History, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { CustomWalletButton } from "@/components/CustomWalletButton"
import { Toaster } from "sonner"

const navItems = [
  { href: "/", label: "Consensus", icon: BarChart3 },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
]

export const metadata = {
  title: "Limen.Trade",
  description: "AI Consensus Signals via x402",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="min-h-screen bg-[#0B0D10] text-white">
            <nav className="border-b border-[#F4C542]/20 bg-[#0B0D10] sticky top-0 z-50">
              <div className="px-6 py-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                  <Image src="/logo.jpg" alt="Limen Trade" width={32} height={32} className="rounded" />
                  <span className="text-base font-mono font-bold">
                    Limen<span className="text-[#F4C542]">.Trade</span>
                  </span>
                </Link>
                <div className="flex items-center gap-2">
                  <CustomWalletButton />
                </div>
              </div>
            </nav>

            <div className="flex">
              <aside className="w-56 border-r border-[#F4C542]/20 min-h-[calc(100vh-57px)] bg-[#0B0D10] sticky top-[57px]">
                <nav className="p-4 space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = typeof window !== "undefined" && window.location.pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 border transition-colors font-mono text-sm",
                          isActive
                            ? "border-[#F4C542]/40 bg-[#F4C542]/5 text-[#F4C542]"
                            : "border-transparent text-gray-400 hover:text-white hover:border-[#F4C542]/20"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>
              </aside>

              <main className="flex-1 p-8">
                <Toaster
                  position="top-center"
                  theme="dark"
                  toastOptions={{
                    style: { background: "#0B0D10", border: "1px solid #F4C542", color: "#F4C542" },
                  }}
                />
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}
