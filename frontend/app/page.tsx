"use client"

import { useState, useEffect, useRef } from "react"
import LoginPage from "@/components/login-page"
import DashboardTab from "@/components/dashboard-tab"
import ViolationsList from "@/components/violations-list"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Camera,
  Wifi,
  WifiOff,
  Play,
  Pause,
  AlertTriangle,
  Car,
  Clock,
  MapPin,
  Settings,
  Download,
  RefreshCw,
} from "lucide-react"

interface Violation {
  id: string
  type: string
  timestamp: string
  location: string
  confidence: number
  imageUrl: string
  vehicleInfo?: {
    licensePlate?: string
    vehicleType: string
    speed?: number
  }
}

export default function TrafficViolationApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentTab, setCurrentTab] = useState("monitoring")
  const [user, setUser] = useState<{ name: string; role: string } | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [violations, setViolations] = useState<Violation[]>([])
  const [currentFrame, setCurrentFrame] = useState<string>("")
  const [stats, setStats] = useState({
    totalViolations: 0,
    todayViolations: 0,
    activeAlerts: 0,
  })

  const wsRef = useRef<WebSocket | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Check authentication status on mount
  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated")
    const userData = localStorage.getItem("userData")

    if (authStatus === "true" && userData) {
      setIsAuthenticated(true)
      setUser(JSON.parse(userData))
    }
  }, [])

  // WebSocket connection
  useEffect(() => {
    if (!isAuthenticated) return

    // Simulate connection
    setIsConnected(true)

    // Simulate fake violations every 10 seconds
    const interval = setInterval(() => {
      const fakeViolation: Violation = {
        id: Date.now().toString(),
        type: ["speeding", "red_light", "no_helmet"][Math.floor(Math.random() * 3)],
        timestamp: new Date().toISOString(),
        location: "Camera " + Math.floor(Math.random() * 5 + 1),
        confidence: 0.8 + Math.random() * 0.2,
        imageUrl: "/placeholder.svg?height=200&width=300",
        vehicleInfo: {
          licensePlate: `29A-${Math.floor(Math.random() * 90000 + 10000)}`,
          vehicleType: ["car", "motorcycle", "truck"][Math.floor(Math.random() * 3)],
          speed: Math.floor(Math.random() * 40 + 30),
        },
      }

      setViolations((prev) => [fakeViolation, ...prev.slice(0, 49)])
      setStats((prev) => ({
        ...prev,
        totalViolations: prev.totalViolations + 1,
        todayViolations: prev.todayViolations + 1,
        activeAlerts: prev.activeAlerts + 1,
      }))
    }, 10000)

    return () => clearInterval(interval)
  }, [isAuthenticated])

  const toggleStreaming = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const command = isStreaming ? "stop_stream" : "start_stream"
      wsRef.current.send(JSON.stringify({ command }))
      setIsStreaming(!isStreaming)
    }
  }

  const reconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close()
    }
    // Reconnect after a short delay
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("vi-VN")
  }

  const getViolationColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "speeding":
        return "destructive"
      case "red_light":
        return "destructive"
      case "wrong_lane":
        return "secondary"
      case "no_helmet":
        return "outline"
      default:
        return "default"
    }
  }

  const getViolationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "speeding":
        return <Car className="w-4 h-4" />
      case "red_light":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  const handleLogin = (userData: { name: string; role: string }) => {
    setIsAuthenticated(true)
    setUser(userData)
    localStorage.setItem("isAuthenticated", "true")
    localStorage.setItem("userData", JSON.stringify(userData))
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUser(null)
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("userData")
    setCurrentTab("monitoring")
  }

  const getTabTitle = () => {
    switch (currentTab) {
      case "monitoring":
        return "Monitoring"
      case "dashboard":
        return "Dashboard"
      case "violations":
        return "Danh sách vi phạm"
      default:
        return "Monitoring"
    }
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar currentTab={currentTab} onTabChange={setCurrentTab} user={user} onLogout={handleLogout} />
        <div className="flex-1">
          <header className="border-b bg-white px-6 py-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold">{getTabTitle()}</h1>
            </div>
          </header>
          <main className="p-6">
            {currentTab === "monitoring" && (
              <div className="min-h-screen bg-gray-50 p-4">
                <div className="max-w-7xl mx-auto space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Camera className="w-8 h-8 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-900">Hệ thống phát hiện vi phạm giao thông</h1>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isConnected ? (
                          <Badge variant="default" className="bg-green-500">
                            <Wifi className="w-4 h-4 mr-1" />
                            Đã kết nối
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <WifiOff className="w-4 h-4 mr-1" />
                            Mất kết nối
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={reconnectWebSocket}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Kết nối lại
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Cài đặt
                      </Button>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng vi phạm</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.totalViolations}</div>
                        <p className="text-xs text-muted-foreground">Từ khi bắt đầu hoạt động</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Vi phạm hôm nay</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.todayViolations}</div>
                        <p className="text-xs text-muted-foreground">Cập nhật theo thời gian thực</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cảnh báo đang hoạt động</CardTitle>
                        <Car className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.activeAlerts}</div>
                        <p className="text-xs text-muted-foreground">Cần xử lý</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Video Stream */}
                    <div className="lg:col-span-2">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle>Camera trực tiếp</CardTitle>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant={isStreaming ? "destructive" : "default"}
                                size="sm"
                                onClick={toggleStreaming}
                                disabled={!isConnected}
                              >
                                {isStreaming ? (
                                  <>
                                    <Pause className="w-4 h-4 mr-2" />
                                    Dừng
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4 mr-2" />
                                    Phát
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                            {currentFrame ? (
                              <img
                                src={`data:image/jpeg;base64,${currentFrame}`}
                                alt="Camera feed"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-white">
                                <div className="text-center">
                                  <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                  <p className="text-lg">
                                    {isConnected ? "Nhấn Phát để bắt đầu stream" : "Đang kết nối camera..."}
                                  </p>
                                </div>
                              </div>
                            )}

                            {isStreaming && (
                              <div className="absolute top-4 left-4">
                                <Badge variant="destructive" className="animate-pulse">
                                  ● LIVE
                                </Badge>
                              </div>
                            )}
                          </div>

                          {!isConnected && (
                            <Alert className="mt-4">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                Không thể kết nối đến camera. Vui lòng kiểm tra kết nối WebSocket.
                              </AlertDescription>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Violations List */}
                    <div>
                      <Card className="h-fit">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle>Vi phạm gần đây</CardTitle>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              Xuất
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-96">
                            {violations.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Chưa phát hiện vi phạm nào</p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {violations.map((violation, index) => (
                                  <div key={violation.id}>
                                    <div className="flex items-start space-x-3">
                                      <div className="flex-shrink-0">{getViolationIcon(violation.type)}</div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                          <Badge variant={getViolationColor(violation.type)} className="text-xs">
                                            {violation.type}
                                          </Badge>
                                          <span className="text-xs text-muted-foreground">
                                            {formatTime(violation.timestamp)}
                                          </span>
                                        </div>
                                        <div className="mt-1">
                                          <div className="flex items-center text-sm text-muted-foreground">
                                            <MapPin className="w-3 h-3 mr-1" />
                                            {violation.location}
                                          </div>
                                          <div className="text-sm">
                                            Độ tin cậy: {(violation.confidence * 100).toFixed(1)}%
                                          </div>
                                          {violation.vehicleInfo && (
                                            <div className="text-sm text-muted-foreground">
                                              {violation.vehicleInfo.licensePlate && (
                                                <div>Biển số: {violation.vehicleInfo.licensePlate}</div>
                                              )}
                                              <div>Loại xe: {violation.vehicleInfo.vehicleType}</div>
                                              {violation.vehicleInfo.speed && (
                                                <div>Tốc độ: {violation.vehicleInfo.speed} km/h</div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    {index < violations.length - 1 && <Separator className="mt-4" />}
                                  </div>
                                ))}
                              </div>
                            )}
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {currentTab === "dashboard" && <DashboardTab />}
            {currentTab === "violations" && <ViolationsList />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
