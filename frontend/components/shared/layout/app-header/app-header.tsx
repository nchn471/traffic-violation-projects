"use client"

import type { ReactNode } from "react"
import { Shield, LogOut } from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import { ThemeToggle } from "@/components/shared/layout/theme-toggle"
import { Separator } from "@/components/shared/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shared/ui/avatar"
import { getRoleColor, getInitials, getAvatarUrl } from "./utils"
import type { OfficerUI } from "@/lib/types/ui/officer"

interface AppHeaderProps {
  title?: string
  showLogo?: boolean
  user?: OfficerUI
  onLogout?: () => void
  children?: ReactNode
}

export function AppHeader({
  title = "Traffic Violation Detection",
  showLogo = true,
  user,
  onLogout,
  children,
}: AppHeaderProps) {
  if (!user) return null

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-2.5">
            {showLogo && (
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary/20 to-primary/10 ring-1 ring-primary/20">
                <Shield className="h-4 w-4 text-primary" />
              </div>
            )}
            <h1 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
              {title}
            </h1>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-2 py-1">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={user.avatar || getAvatarUrl(user.name)}
                  alt={user.name}
                />
                <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-primary/20 to-primary/10">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium leading-none">
                  {typeof user.name === "string" ? user.name : "Unknown"}
                </span>
                <span className={`text-xs leading-none ${getRoleColor(user.role)}`}>
                  {user.role}
                </span>
              </div>
            </div>

            <Separator orientation="vertical" className="h-5" />

            <div className="flex items-center gap-1">
              <ThemeToggle />
              {onLogout && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLogout()} 
                  className="h-9 px-3 gap-2 text-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm">Logout</span>
                </Button>
              )}
              {children}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
