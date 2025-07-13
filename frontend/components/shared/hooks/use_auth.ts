import { useEffect, useRef, useState } from "react"
import { getCurrentOfficer, refreshAccessToken, logout } from "@/lib/api/v1/auth"
import type { Officer } from "@/lib/types/api/v1/officer"
import type { LoginResponse } from "@/lib/types/api/v1/auth"

export function useAuth(onLogout?: () => void) {
  const [user, setUser] = useState<Officer | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchUser = async () => {
      const currentUser = await getCurrentOfficer()
      if (!currentUser) {
        await logout()
        if (!cancelled) {
          setUser(null)
          onLogout?.()
        }
        return
      }

      if (!cancelled) setUser(currentUser)

      const refreshed: LoginResponse | null = await refreshAccessToken()
      if (refreshed) {
        const intervalTime = (refreshed.access_token_expires_in ?? 600) * 0.9 * 1000
        intervalRef.current = setInterval(async () => {
          const result = await refreshAccessToken()
          if (!result) {
            await logout()
            if (!cancelled) {
              setUser(null)
              onLogout?.()
            }
          }
        }, intervalTime)
      }
    }
    if (!user) {
      fetchUser()
    }

    return () => {
      cancelled = true
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [onLogout])

  return { user, setUser }
}
