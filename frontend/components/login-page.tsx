"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Camera, Eye, EyeOff } from "lucide-react"
import apiClient from "@/lib/api"
import { ApiStatus } from "@/components/api-status"

interface LoginPageProps {
  onLogin: (userData: { name: string; role: string }) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const loginResponse = await apiClient.login({ username, password })

      if (loginResponse.error) {
        setError(loginResponse.error)
        return
      }

      // Get user info after successful login
      const userResponse = await apiClient.getCurrentUser()

      if (userResponse.error) {
        setError("Đăng nhập thành công nhưng không thể lấy thông tin người dùng")
        return
      }

      if (userResponse.data) {
        onLogin({
          name: userResponse.data.name,
          role: userResponse.data.role,
        })
      }
    } catch (error) {
      setError("Có lỗi xảy ra khi đăng nhập")
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 theme-transition">
      <div className="absolute top-4 right-4 w-40">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md glass-effect theme-transition animate-fade-in">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="gradient-bg p-3 rounded-full">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Đăng nhập hệ thống</CardTitle>
          <CardDescription>Hệ thống phát hiện vi phạm giao thông</CardDescription>
        </CardHeader>
        <CardContent>
          <ApiStatus />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <Input
                id="username"
                type="text"
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="theme-transition"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="theme-transition"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="animate-slide-up">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full theme-transition" disabled={isLoading}>
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg theme-transition">
            <p className="text-sm text-muted-foreground mb-2">Liên hệ quản trị viên để được cấp tài khoản</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
