"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { NotificationBell } from "@/components/layout/notification-bell"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/releases", label: "Releases" },
  { href: "/requests", label: "Requests" },
]

export function AppHeader() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  // (app)/layout.tsx only renders this once status === "authenticated", but
  // that's not visible to TypeScript across the component boundary.
  if (!user) return null

  return (
    <header className="sticky top-0 z-50 flex flex-col gap-3 border-b border-border/50 bg-background/70 px-4 py-4 shadow-md shadow-foreground/5 backdrop-blur-xl backdrop-saturate-150 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex flex-wrap items-center gap-4">
        <span className="font-heading text-base font-bold tracking-tight">ShipIt</span>
        <div className="hidden h-5 w-px bg-muted-foreground/40 sm:block" aria-hidden="true" />
        <nav className="flex items-center gap-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm text-muted-foreground hover:text-foreground",
                pathname === link.href && "font-medium text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <ThemeToggle />
        <NotificationBell userId={user.id} />
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <span>{user.name}</span>
          {/* One badge per role actually held (BE §0's `roles` is a set, not
              a single value) — a single-role account shows one, a dual-role
              account shows both, never a switcher between them. */}
          {user.roles.map((role) => (
            <Badge key={role} variant="secondary">
              {role}
            </Badge>
          ))}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            await logout()
            router.replace("/login")
          }}
        >
          Log out
        </Button>
      </div>
    </header>
  )
}
