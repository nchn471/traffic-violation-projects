"use client"

import { RefreshCw } from "lucide-react"
import { Button } from "@/components/shared/ui/button"

interface TabHeaderProps {
  title: string
  description?: string
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function TabHeader({ title, description, onRefresh, isRefreshing = false }: TabHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>

      {onRefresh && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="gap-2 bg-transparent"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      )}
    </div>
  )
}
