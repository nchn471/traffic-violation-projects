"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, Settings } from "lucide-react"
import apiClient, { type CameraOut, type CameraCreate, type CameraUpdate } from "@/lib/api"

interface CameraConfig {
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

export default function CameraManagement() {
  const [cameras, setCameras] = useState<CameraOut[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCamera, setSelectedCamera] = useState<CameraOut | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)
  const [createData, setCreateData] = useState<CameraCreate>({
    name: "",
    location: "",
    folder_path: "",
  })
  const [editData, setEditData] = useState<CameraUpdate>({})
  const [cameraConfig, setCameraConfig] = useState<CameraConfig>({
    video: "",
    location: "",
    roi: [],
    stop_line: [],
    light_roi: [],
    detection_type: "helmet",
    lanes: [],
  })
  const [videos, setVideos] = useState<string[]>([])

  const fetchCameras = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.getCameras()
      if (response.data) {
        setCameras(response.data)
      }
    } catch (error) {
      console.error("Error fetching cameras:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCameras()
  }, [])

  const handleCreateCamera = async () => {
    try {
      const response = await apiClient.createCamera(createData)
      if (response.data) {
        setCameras([...cameras, response.data])
        setIsCreateDialogOpen(false)
        setCreateData({ name: "", location: "", folder_path: "" })
      }
    } catch (error) {
      console.error("Error creating camera:", error)
    }
  }

  const handleUpdateCamera = async () => {
    if (!selectedCamera) return

    try {
      const response = await apiClient.updateCamera(selectedCamera.id, editData)
      if (response.data) {
        setCameras(cameras.map((c) => (c.id === selectedCamera.id ? response.data! : c)))
        setIsEditDialogOpen(false)
        setSelectedCamera(null)
        setEditData({})
      }
    } catch (error) {
      console.error("Error updating camera:", error)
    }
  }

  const handleDeleteCamera = async (cameraId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa camera này?")) return

    try {
      await apiClient.deleteCamera(cameraId)
      setCameras(cameras.filter((c) => c.id !== cameraId))
    } catch (error) {
      console.error("Error deleting camera:", error)
    }
  }

  const handleOpenConfig = async (camera: CameraOut) => {
    setSelectedCamera(camera)

    // Load videos for this camera
    try {
      const videosResponse = await apiClient.getCameraVideos(camera.id)
      if (videosResponse.data) {
        setVideos(videosResponse.data)
      }
    } catch (error) {
      console.error("Error fetching videos:", error)
    }

    // Load existing config or set default
    setCameraConfig({
      video: "",
      location: camera.location,
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
    })
    setIsConfigDialogOpen(true)
  }

  const handleSaveConfig = () => {
    if (!selectedCamera) return

    // Send config to WebSocket
    const wsMessage = {
      type: "camera_config",
      camera_id: selectedCamera.id,
      config: {
        params: cameraConfig,
      },
    }

    // Try to send to WebSocket if available
    try {
      const ws = new WebSocket("ws://localhost:8080/camera-stream")
      ws.onopen = () => {
        ws.send(JSON.stringify(wsMessage))
        console.log("Camera config sent to WebSocket:", wsMessage)
        ws.close()
      }
    } catch (error) {
      console.error("WebSocket connection failed:", error)
    }

    // Save to localStorage for persistence
    localStorage.setItem(`camera-config-${selectedCamera.id}`, JSON.stringify(cameraConfig))

    setIsConfigDialogOpen(false)
  }

  const openEditDialog = (camera: CameraOut) => {
    setSelectedCamera(camera)
    setEditData({
      name: camera.name,
      location: camera.location,
      folder_path: camera.folder_path,
    })
    setIsEditDialogOpen(true)
  }

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("vi-VN")
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quản lý Camera</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm Camera
        </Button>
      </div>

      {/* Cameras Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Camera ({cameras.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên Camera</TableHead>
                <TableHead>Vị trí</TableHead>
                <TableHead>Thư mục</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Cập nhật</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cameras.map((camera) => (
                <TableRow key={camera.id}>
                  <TableCell className="font-medium">{camera.name}</TableCell>
                  <TableCell>{camera.location}</TableCell>
                  <TableCell className="font-mono text-sm">{camera.folder_path}</TableCell>
                  <TableCell>{formatDateTime(camera.created_at)}</TableCell>
                  <TableCell>{formatDateTime(camera.updated_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenConfig(camera)}>
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(camera)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCamera(camera.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Camera Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm Camera mới</DialogTitle>
            <DialogDescription>Tạo camera mới cho hệ thống giám sát</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Tên Camera</Label>
              <Input
                id="create-name"
                value={createData.name}
                onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                placeholder="Nhập tên camera"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-location">Vị trí</Label>
              <Input
                id="create-location"
                value={createData.location}
                onChange={(e) => setCreateData({ ...createData, location: e.target.value })}
                placeholder="Nhập vị trí camera"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-folder">Thư mục lưu trữ</Label>
              <Input
                id="create-folder"
                value={createData.folder_path}
                onChange={(e) => setCreateData({ ...createData, folder_path: e.target.value })}
                placeholder="Nhập đường dẫn thư mục"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateCamera}>
              <Plus className="w-4 h-4 mr-2" />
              Tạo Camera
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Camera Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Camera</DialogTitle>
            <DialogDescription>Cập nhật thông tin camera {selectedCamera?.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Tên Camera</Label>
              <Input
                id="edit-name"
                value={editData.name || ""}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-location">Vị trí</Label>
              <Input
                id="edit-location"
                value={editData.location || ""}
                onChange={(e) => setEditData({ ...editData, location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-folder">Thư mục lưu trữ</Label>
              <Input
                id="edit-folder"
                value={editData.folder_path || ""}
                onChange={(e) => setEditData({ ...editData, folder_path: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateCamera}>
              <Edit className="w-4 h-4 mr-2" />
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Camera Config Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cấu hình Camera - {selectedCamera?.name}</DialogTitle>
            <DialogDescription>Thiết lập thông số phát hiện vi phạm cho camera</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Cơ bản</TabsTrigger>
              <TabsTrigger value="regions">Vùng phát hiện</TabsTrigger>
              <TabsTrigger value="lanes">Làn đường</TabsTrigger>
              <TabsTrigger value="advanced">Nâng cao</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Video nguồn</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={cameraConfig.video}
                    onChange={(e) => setCameraConfig({ ...cameraConfig, video: e.target.value })}
                  >
                    <option value="">Chọn video</option>
                    {videos.map((video) => (
                      <option key={video} value={video}>
                        {video}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Loại phát hiện</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={cameraConfig.detection_type}
                    onChange={(e) => setCameraConfig({ ...cameraConfig, detection_type: e.target.value })}
                  >
                    <option value="helmet">Mũ bảo hiểm</option>
                    <option value="red_light">Đèn đỏ</option>
                    <option value="speed">Tốc độ</option>
                    <option value="lane">Làn đường</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Vị trí</Label>
                <Input
                  value={cameraConfig.location}
                  onChange={(e) => setCameraConfig({ ...cameraConfig, location: e.target.value })}
                  placeholder="Nhập vị trí camera"
                />
              </div>
            </TabsContent>

            <TabsContent value="regions" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">ROI (Vùng quan tâm)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={JSON.stringify(cameraConfig.roi, null, 2)}
                      onChange={(e) => {
                        try {
                          const roi = JSON.parse(e.target.value)
                          setCameraConfig({ ...cameraConfig, roi })
                        } catch (error) {
                          // Invalid JSON, ignore
                        }
                      }}
                      rows={8}
                      className="font-mono text-xs"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Vạch dừng</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={JSON.stringify(cameraConfig.stop_line, null, 2)}
                      onChange={(e) => {
                        try {
                          const stop_line = JSON.parse(e.target.value)
                          setCameraConfig({ ...cameraConfig, stop_line })
                        } catch (error) {
                          // Invalid JSON, ignore
                        }
                      }}
                      rows={8}
                      className="font-mono text-xs"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Vùng đèn tín hiệu</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={JSON.stringify(cameraConfig.light_roi, null, 2)}
                      onChange={(e) => {
                        try {
                          const light_roi = JSON.parse(e.target.value)
                          setCameraConfig({ ...cameraConfig, light_roi })
                        } catch (error) {
                          // Invalid JSON, ignore
                        }
                      }}
                      rows={8}
                      className="font-mono text-xs"
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="lanes" className="space-y-4">
              <div className="space-y-4">
                {cameraConfig.lanes.map((lane, index) => (
                  <Card key={lane.id}>
                    <CardHeader>
                      <CardTitle className="text-base">Làn {lane.id}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Polygon</Label>
                        <Textarea
                          value={JSON.stringify(lane.polygon, null, 2)}
                          onChange={(e) => {
                            try {
                              const polygon = JSON.parse(e.target.value)
                              const newLanes = [...cameraConfig.lanes]
                              newLanes[index] = { ...lane, polygon }
                              setCameraConfig({ ...cameraConfig, lanes: newLanes })
                            } catch (error) {
                              // Invalid JSON, ignore
                            }
                          }}
                          rows={4}
                          className="font-mono text-xs"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Phương tiện cho phép</Label>
                        <div className="flex flex-wrap gap-2">
                          {["car", "motorcycle", "truck", "bicycle", "bus"].map((vehicle) => (
                            <label key={vehicle} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={lane.allow_labels.includes(vehicle)}
                                onChange={(e) => {
                                  const newLanes = [...cameraConfig.lanes]
                                  if (e.target.checked) {
                                    newLanes[index] = {
                                      ...lane,
                                      allow_labels: [...lane.allow_labels, vehicle],
                                    }
                                  } else {
                                    newLanes[index] = {
                                      ...lane,
                                      allow_labels: lane.allow_labels.filter((v) => v !== vehicle),
                                    }
                                  }
                                  setCameraConfig({ ...cameraConfig, lanes: newLanes })
                                }}
                              />
                              <span className="text-sm">{vehicle}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cấu hình JSON hoàn chỉnh</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={JSON.stringify(cameraConfig, null, 2)}
                    onChange={(e) => {
                      try {
                        const config = JSON.parse(e.target.value)
                        setCameraConfig(config)
                      } catch (error) {
                        // Invalid JSON, ignore
                      }
                    }}
                    rows={20}
                    className="font-mono text-xs"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveConfig}>
              <Settings className="w-4 h-4 mr-2" />
              Lưu cấu hình
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
