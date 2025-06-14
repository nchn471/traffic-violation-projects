"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
  }

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className="w-full justify-start">
        <Sun className="h-4 w-4 mr-2" />
        <span>Giao diện</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start hover:bg-accent hover:text-accent-foreground"
        >
          {resolvedTheme === "dark" ? <Moon className="h-4 w-4 mr-2" /> : <Sun className="h-4 w-4 mr-2" />}
          <span>Giao diện</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40" side="top">
        <DropdownMenuItem
          onClick={() => handleThemeChange("light")}
          className="cursor-pointer focus:bg-accent focus:text-accent-foreground"
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>Sáng</span>
          {theme === "light" && <span className="ml-auto text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange("dark")}
          className="cursor-pointer focus:bg-accent focus:text-accent-foreground"
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>Tối</span>
          {theme === "dark" && <span className="ml-auto text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange("system")}
          className="cursor-pointer focus:bg-accent focus:text-accent-foreground"
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span>Hệ thống</span>
          {theme === "system" && <span className="ml-auto text-primary">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
