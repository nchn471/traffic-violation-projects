"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Plus } from "lucide-react"

interface CameraConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (config: any) => void
  currentConfig: any
}

export default function CameraConfigDialog({ open, onOpenChange, onSave, currentConfig }: CameraConfigDialogProps) {
  const [config, setConfig] = useState({
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

  const vehicleTypes = ["car", "truck", "motorcycle", "bicycle", "bus", "person"]

  useEffect(() => {
    if (currentConfig) {
      setConfig(currentConfig)
    }
  }, [currentConfig])

  const handleSave = () => {
    onSave(config)
  }

  const addLane = () => {
    const newLane = {
      id: config.params.lanes.length + 1,
      polygon: [
        [0, 0],
        [100, 0],
        [100, 100],
        [0, 100],
      ],
      allow_labels: ["car"],
    }
    setConfig({
      ...config,
      params: {
        ...config.params,
        lanes: [...config.params.lanes, newLane],
      },
    })
  }

  const removeLane = (index: number) => {
    const newLanes = config.params.lanes.filter((_, i) => i !== index)
    setConfig({
      ...config,
      params: {
        ...config.params,
        lanes: newLanes,
      },
    })
  }

  const updateLane = (index: number, field: string, value: any) => {
    const newLanes = [...config.params.lanes]
    newLanes[index] = { ...newLanes[index], [field]: value }
    setConfig({
      ...config,
      params: {
        ...config.params,
        lanes: newLanes,
      },
    })
  }

  const toggleVehicleType = (laneIndex: number, vehicleType: string) => {
    const lane = config.params.lanes[laneIndex]
    const newAllowLabels = lane.allow_labels.includes(vehicleType)
      ? lane.allow_labels.filter((type) => type !== vehicleType)
      : [...lane.allow_labels, vehicleType]

    updateLane(laneIndex, "allow_labels", newAllowLabels)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cấu hình Camera</DialogTitle>
          <DialogDescription>Thiết lập các thông số cho camera và vùng phát hiện vi phạm</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Cơ bản</TabsTrigger>
            <TabsTrigger value="regions">Vùng phát hiện</TabsTrigger>
            <TabsTrigger value="lanes">Làn đường</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="video">Đường dẫn video</Label>
                <Input
                  id="video"
                  value={config.params.video}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      params: { ...config.params, video: e.target.value },
                    })
                  }
                  placeholder="videos/example.mp4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Vị trí</Label>
                <Input
                  id="location"
                  value={config.params.location}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      params: { ...config.params, location: e.target.value },
                    })
                  }
                  placeholder="Tên đường, khu vực"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="detection_type">Loại phát hiện</Label>
              <Select
                value={config.params.detection_type}
                onValueChange={(value) =>
                  setConfig({
                    ...config,
                    params: { ...config.params, detection_type: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại phát hiện" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lane">Làn đường</SelectItem>
                  <SelectItem value="speed">Tốc độ</SelectItem>
                  <SelectItem value="red_light">Đèn đỏ</SelectItem>
                  <SelectItem value="helmet">Mũ bảo hiểm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="regions" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roi">ROI (Region of Interest)</Label>
                <Textarea
                  id="roi"
                  value={JSON.stringify(config.params.roi)}
                  onChange={(e) => {
                    try {
                      const roi = JSON.parse(e.target.value)
                      setConfig({
                        ...config,
                        params: { ...config.params, roi },
                      })
                    } catch (error) {
                      // Invalid JSON, ignore
                    }
                  }}
                  placeholder="[[x1, y1], [x2, y2], ...]"
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">Vùng quan tâm - định dạng JSON array các tọa độ [x, y]</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stop_line">Stop Line</Label>
                <Textarea
                  id="stop_line"
                  value={JSON.stringify(config.params.stop_line)}
                  onChange={(e) => {
                    try {
                      const stop_line = JSON.parse(e.target.value)
                      setConfig({
                        ...config,
                        params: { ...config.params, stop_line },
                      })
                    } catch (error) {
                      // Invalid JSON, ignore
                    }
                  }}
                  placeholder="[[x1, y1], [x2, y2]]"
                  rows={2}
                />
                <p className="text-sm text-muted-foreground">Vạch dừng - 2 điểm tạo thành đường thẳng</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="light_roi">Light ROI</Label>
                <Textarea
                  id="light_roi"
                  value={JSON.stringify(config.params.light_roi)}
                  onChange={(e) => {
                    try {
                      const light_roi = JSON.parse(e.target.value)
                      setConfig({
                        ...config,
                        params: { ...config.params, light_roi },
                      })
                    } catch (error) {
                      // Invalid JSON, ignore
                    }
                  }}
                  placeholder="[[x1, y1], [x2, y1], [x2, y2], [x1, y2]]"
                  rows={2}
                />
                <p className="text-sm text-muted-foreground">Vùng đèn giao thông - 4 điểm tạo thành hình chữ nhật</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="lanes" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Cấu hình làn đường</h3>
              <Button onClick={addLane} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Thêm làn
              </Button>
            </div>

            <div className="space-y-4">
              {config.params.lanes.map((lane, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Làn {lane.id}</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeLane(index)}
                        disabled={config.params.lanes.length <= 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Polygon tọa độ</Label>
                      <Textarea
                        value={JSON.stringify(lane.polygon)}
                        onChange={(e) => {
                          try {
                            const polygon = JSON.parse(e.target.value)
                            updateLane(index, "polygon", polygon)
                          } catch (error) {
                            // Invalid JSON, ignore
                          }
                        }}
                        placeholder="[[x1, y1], [x2, y2], [x3, y3], [x4, y4]]"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Loại phương tiện được phép</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {vehicleTypes.map((vehicleType) => (
                          <div key={vehicleType} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${index}-${vehicleType}`}
                              checked={lane.allow_labels.includes(vehicleType)}
                              onCheckedChange={() => toggleVehicleType(index, vehicleType)}
                            />
                            <Label htmlFor={`${index}-${vehicleType}`} className="text-sm">
                              {vehicleType}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {lane.allow_labels.map((label) => (
                          <Badge key={label} variant="secondary" className="text-xs">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave}>Lưu cấu hình</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
