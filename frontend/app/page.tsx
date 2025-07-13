"use client";

import { useEffect, useState } from "react";
import { LoginForm } from "@/components/features/auth/login-form";
import { HomeScreen } from "@/components/features/home-screen/home-screen";
import { getCurrentOfficer } from "@/lib/api/v1/auth";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentOfficer()

        if (user) {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen">
      {isAuthenticated ? (
        <HomeScreen onLogout={() => setIsAuthenticated(false)} />
      ) : (
        <LoginForm onLogin={() => setIsAuthenticated(true)} />
      )}
    </main>
  )
}
