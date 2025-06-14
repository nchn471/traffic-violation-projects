"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Save, RefreshCw, Camera, MapPin, Layers, Route } from "lucide-react"

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

interface CameraConfigProps {
  onConfigChange?: (config: CameraParams) => void
  currentConfig?: CameraParams | null
}

export default function CameraConfig({ onConfigChange, currentConfig }: CameraConfigProps) {
  const [config, setConfig] = useState<CameraParams>({
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

  const [isLoading, setIsLoading] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    if (currentConfig) {
      setConfig(currentConfig)
    }
  }, [currentConfig])

  const handleSaveConfig = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (onConfigChange) {
        onConfigChange(config)
      }

      setLastSaved(new Date())

      // Save to localStorage for persistence
      localStorage.setItem("camera-config", JSON.stringify(config))
    } catch (error) {
      console.error("Failed to save config:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetConfig = () => {
    const defaultConfig: CameraParams = {
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
    }
    setConfig(defaultConfig)
  }

  const getDetectionTypeBadge = (type: string) => {
    const badges = {
      helmet: { variant: "destructive" as const, label: "Mũ bảo hiểm" },
      lane: { variant: "default" as const, label: "Làn đường" },
      speed: { variant: "secondary" as const, label: "Tốc độ" },
      red_light: { variant: "destructive" as const, label: "Đèn đỏ" },
    }

    const badge = badges[type as keyof typeof badges] || { variant: "outline" as const, label: type }
    return <Badge variant={badge.variant}>{badge.label}</Badge>
  }

  const formatCoordinates = (coords: number[][]) => {
    return coords.map((coord) => `[${coord.join(", ")}]`).join(", ")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Cấu hình Camera</h2>
            <p className="text-muted-foreground">Thiết lập thông số phát hiện vi phạm</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {lastSaved && (
            <span className="text-sm text-muted-foreground">Lưu lần cuối: {lastSaved.toLocaleTimeString("vi-VN")}</span>
          )}
          <Button variant="outline" onClick={handleResetConfig}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSaveConfig} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Đang lưu..." : "Lưu cấu hình"}
          </Button>
        </div>
      </div>

      {/* Current Config Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Camera className="w-5 h-5" />
            <span>Tóm tắt cấu hình hiện tại</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Vị trí:</span>
              </div>
              <p className="text-sm">{config.params.location}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Loại phát hiện:</span>
              </div>
              {getDetectionTypeBadge(config.params.detection_type)}
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Route className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Số làn:</span>
              </div>
              <Badge variant="outline">{config.params.lanes.length} làn</Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Video:</span>
              </div>
              <p className="text-sm font-mono truncate">{config.params.video}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Configuration */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="regions">Vùng phát hiện</TabsTrigger>
          <TabsTrigger value="lanes">Làn đường</TabsTrigger>
          <TabsTrigger value="raw">Raw Data</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cơ bản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="font-medium">Video source:</span>
                  <p className="text-sm font-mono bg-muted p-2 rounded mt-1">{config.params.video}</p>
                </div>
                <div>
                  <span className="font-medium">Vị trí:</span>
                  <p className="text-sm mt-1">{config.params.location}</p>
                </div>
                <div>
                  <span className="font-medium">Loại phát hiện:</span>
                  <div className="mt-1">{getDetectionTypeBadge(config.params.detection_type)}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thống kê vùng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>ROI points:</span>
                  <Badge variant="outline">{config.params.roi.length} điểm</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Stop line:</span>
                  <Badge variant="outline">{config.params.stop_line.length} điểm</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Light ROI:</span>
                  <Badge variant="outline">{config.params.light_roi.length} điểm</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Lanes:</span>
                  <Badge variant="outline">{config.params.lanes.length} làn</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="regions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">ROI (Region of Interest)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="secondary">{config.params.roi.length} điểm</Badge>
                  <div className="text-xs font-mono bg-muted p-2 rounded max-h-32 overflow-y-auto">
                    {formatCoordinates(config.params.roi)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Stop Line</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="secondary">{config.params.stop_line.length} điểm</Badge>
                  <div className="text-xs font-mono bg-muted p-2 rounded">
                    {formatCoordinates(config.params.stop_line)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Light ROI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="secondary">{config.params.light_roi.length} điểm</Badge>
                  <div className="text-xs font-mono bg-muted p-2 rounded">
                    {formatCoordinates(config.params.light_roi)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="lanes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {config.params.lanes.map((lane, index) => (
              <Card key={lane.id}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Làn {lane.id}</span>
                    <Badge variant="outline">{lane.polygon.length} điểm</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm font-medium">Phương tiện cho phép:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {lane.allow_labels.map((label) => (
                        <Badge key={label} variant="secondary" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Polygon:</span>
                    <div className="text-xs font-mono bg-muted p-2 rounded mt-1 max-h-20 overflow-y-auto">
                      {formatCoordinates(lane.polygon)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="raw" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Raw Configuration Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96">
                {JSON.stringify(config, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Alert */}
      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          Cấu hình sẽ được áp dụng cho camera sau khi lưu. Đảm bảo tọa độ các vùng phát hiện chính xác.
        </AlertDescription>
      </Alert>
    </div>
  )
}
