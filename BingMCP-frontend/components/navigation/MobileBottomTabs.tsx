"use client"

import Link from "next/link"
import { LayoutDashboard, MessageSquare } from "lucide-react"
import type { ComponentType } from "react"

export type MobileTabRoute = "chat" | "dashboard"

export type MobileBottomTabsProps = {
  activeRoute: MobileTabRoute
}

const tabs: Array<{
  href: string
  key: MobileTabRoute
  label: string
  icon: ComponentType<{ className?: string }>
}> = [
  {
    href: "/",
    key: "chat",
    label: "Chat",
    icon: MessageSquare,
  },
  {
    href: "/dashboard",
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
]

export function MobileBottomTabs({ activeRoute }: MobileBottomTabsProps) {
  return (
    <nav
      className="mobile-device-only mobile-nav-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden"
      aria-label="Primary mobile navigation"
    >
      <div className="mx-auto flex h-[var(--mobile-nav-height)] w-full max-w-screen-md items-center gap-2 px-3">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.key === activeRoute

          return (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/12 text-primary"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
