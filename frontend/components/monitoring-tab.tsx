"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import CameraConfig from "@/components/camera-config"
import VideoCanvas from "@/components/video-canvas"
import { Camera, Wifi, WifiOff, Play, Pause, AlertTriangle, RefreshCw, Cog } from "lucide-react"

interface CameraParams {
  params: {
    video: string
    location: string
    roi: number[][]
    stop_line: number[][]
    light_roi: number[][]
    detection_type: string
    lanes: Array<{
      id: number
      polygon: number[][]
      allow_labels: string[]
    }>
  }
}

export default function MonitoringTab() {
  const [isConnected, setIsConnected] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentFrame, setCurrentFrame] = useState<string>("")
  const [showConfig, setShowConfig] = useState(false)
  const [cameraConfig, setCameraConfig] = useState<CameraParams>({
    params: {
      video: "videos/La-Khê-Hà_Đông.mp4",
      location: "Lê Duẩn, Nguyễn Thái Học",
      roi: [
        [73, 718],
        [342, 330],
        [1061, 323],
        [1076, 331],
        [1019, 394],
        [1009, 453],
        [1026, 509],
        [1052, 572],
        [1096, 649],
        [1141, 717],
      ],
      stop_line: [
        [154, 566],
        [1066, 541],
      ],
      light_roi: [
        [650, 5],
        [700, 5],
        [700, 50],
        [650, 50],
      ],
      detection_type: "helmet",
      lanes: [
        {
          id: 1,
          polygon: [
            [76, 717],
            [274, 417],
            [543, 422],
            [492, 719],
          ],
          allow_labels: ["car", "truck"],
        },
        {
          id: 2,
          polygon: [
            [492, 719],
            [543, 422],
            [758, 440],
            [790, 717],
          ],
          allow_labels: ["motorcycle", "bicycle"],
        },
        {
          id: 3,
          polygon: [
            [790, 717],
            [758, 440],
            [1009, 429],
            [1172, 719],
          ],
          allow_labels: ["car", "motorcycle", "truck", "bicycle"],
        },
      ],
    },
  })

  const wsRef = useRef<WebSocket | null>(null)

  // Load saved config on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem("camera-config")
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig)
        setCameraConfig(parsedConfig)
      } catch (error) {
        console.error("Failed to load saved config:", error)
      }
    }
  }, [])

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        wsRef.current = new WebSocket("ws://localhost:8080/camera-stream")

        wsRef.current.onopen = () => {
          setIsConnected(true)
          console.log("WebSocket connected")

          // Send current config if available
          if (cameraConfig) {
            wsRef.current?.send(
              JSON.stringify({
                type: "config",
                data: cameraConfig,
              }),
            )
          }
        }

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)

            if (data.type === "frame") {
              setCurrentFrame(data.imageData)
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error)
          }
        }

        wsRef.current.onclose = () => {
          setIsConnected(false)
          setIsStreaming(false)
          console.log("WebSocket disconnected")
        }

        wsRef.current.onerror = (error) => {
          console.error("WebSocket error:", error)
          setIsConnected(false)
        }
      } catch (error) {
        console.error("Failed to connect WebSocket:", error)
      }
    }

    connectWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [cameraConfig])

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
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  const handleConfigChange = (config: CameraParams) => {
    setCameraConfig(config)

    // Send config to WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "config",
          data: config,
        }),
      )
      console.log("Config sent to WebSocket:", config)
    }
  }

  if (showConfig) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Cấu hình Camera</h2>
          <Button variant="outline" onClick={() => setShowConfig(false)}>
            <Camera className="w-4 h-4 mr-2" />
            Quay lại Monitoring
          </Button>
        </div>
        <CameraConfig onConfigChange={handleConfigChange} currentConfig={cameraConfig} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Camera className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Camera Monitoring</h2>
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
          <Button variant="outline" size="sm" onClick={() => setShowConfig(true)}>
            <Cog className="w-4 h-4 mr-2" />
            Cấu hình Camera
          </Button>
        </div>
      </div>

      {/* Current Config Info */}
      {cameraConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cấu hình hiện tại</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Vị trí:</span>
                <p className="text-muted-foreground">{cameraConfig.params.location}</p>
              </div>
              <div>
                <span className="font-medium">Loại phát hiện:</span>
                <Badge variant="secondary" className="ml-2">
                  {cameraConfig.params.detection_type}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Số làn:</span>
                <Badge variant="outline" className="ml-2">
                  {cameraConfig.params.lanes.length} làn
                </Badge>
              </div>
              <div>
                <span className="font-medium">Video:</span>
                <p className="text-muted-foreground font-mono text-xs truncate">{cameraConfig.params.video}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video Stream */}
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
          <div className="relative bg-black rounded-lg overflow-hidden">
            <VideoCanvas
              currentFrame={currentFrame}
              isStreaming={isStreaming}
              isConnected={isConnected}
              cameraConfig={cameraConfig}
            />

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
              <AlertDescription>Không thể kết nối đến camera. Vui lòng kiểm tra kết nối WebSocket.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
