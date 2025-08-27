import { AppHeader } from "@/components/shared/layout/app-header/app-header"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    </div>
  )
}
