"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Search, Download, Send, Eye, FileText, Calendar, Car, Hash, Edit, History, RotateCcw } from "lucide-react"
import apiClient, { type ViolationOut, type ViolationUpdate, type ViolationVersionOut } from "@/lib/api"

export default function ViolationsList() {
  const [violations, setViolations] = useState<ViolationOut[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedViolation, setSelectedViolation] = useState<ViolationOut | null>(null)
  const [violationHistory, setViolationHistory] = useState<ViolationVersionOut[]>([])
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [isFineDialogOpen, setIsFineDialogOpen] = useState(false)
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false)
  const [editData, setEditData] = useState<ViolationUpdate>({})
  const [fineAmount, setFineAmount] = useState("")
  const [fineDescription, setFineDescription] = useState("")
  const [recipientInfo, setRecipientInfo] = useState({
    name: "",
    email: "",
  })
  const [isLoading, setIsLoading] = useState(true)

  // Fetch violations
  const fetchViolations = async () => {
    setIsLoading(true)
    try {
      const filters: any = {
        page: pagination.page,
        limit: pagination.limit,
      }

      if (filterStatus !== "all") {
        filters.status = filterStatus
      }
      if (filterType !== "all") {
        filters.violation_type = filterType
      }

      const response = await apiClient.getViolations(filters)

      if (response.data) {
        setViolations(response.data.data)
        setPagination(response.data.pagination)
      }
    } catch (error) {
      console.error("Error fetching violations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchViolations()
  }, [pagination.page, filterType, filterStatus])

  // Filter violations by search term (client-side)
  const filteredViolations = violations.filter((violation) => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    return (
      violation.license_plate?.toLowerCase().includes(searchLower) ||
      violation.violation_type.toLowerCase().includes(searchLower) ||
      violation.id.toLowerCase().includes(searchLower)
    )
  })

  const handleEditViolation = async () => {
    if (!selectedViolation) return

    try {
      const response = await apiClient.updateViolation(selectedViolation.id, editData)
      if (response.data) {
        setViolations(violations.map((v) => (v.id === selectedViolation.id ? response.data! : v)))
        setIsEditDialogOpen(false)
        setSelectedViolation(null)
        setEditData({})
      }
    } catch (error) {
      console.error("Error updating violation:", error)
    }
  }

  const handleViewHistory = async (violation: ViolationOut) => {
    setSelectedViolation(violation)
    try {
      const response = await apiClient.getViolationHistory(violation.id)
      if (response.data) {
        setViolationHistory(response.data)
      }
    } catch (error) {
      console.error("Error fetching violation history:", error)
    }
    setIsHistoryDialogOpen(true)
  }

  const handleRollback = async (versionId: string) => {
    if (!selectedViolation) return

    try {
      const response = await apiClient.rollbackViolation(selectedViolation.id, versionId)
      if (response.data) {
        setViolations(violations.map((v) => (v.id === selectedViolation.id ? response.data! : v)))
        setIsHistoryDialogOpen(false)
        // Refresh history
        handleViewHistory(response.data)
      }
    } catch (error) {
      console.error("Error rolling back violation:", error)
    }
  }

  const handleCreateFine = async () => {
    if (selectedViolation && fineAmount && fineDescription) {
      try {
        const ticketData = {
          amount: Number.parseFloat(fineAmount),
          notes: fineDescription,
          name: recipientInfo.name || null,
          email: recipientInfo.email || null,
        }

        const response = await apiClient.createTicket(selectedViolation.id, ticketData)

        if (response.data) {
          // Update violation status
          await apiClient.updateViolation(selectedViolation.id, { status: "processed" })

          // Refresh violations list
          fetchViolations()

          setIsFineDialogOpen(false)
          setFineAmount("")
          setFineDescription("")
        }
      } catch (error) {
        console.error("Error creating ticket:", error)
      }
    }
  }

  const handleSendFine = async () => {
    if (selectedViolation) {
      try {
        // Update violation status to sent
        await apiClient.updateViolation(selectedViolation.id, { status: "sent" })

        // Refresh violations list
        fetchViolations()

        setIsSendDialogOpen(false)
        setRecipientInfo({ name: "", email: "" })
      } catch (error) {
        console.error("Error sending fine:", error)
      }
    }
  }

  const openEditDialog = (violation: ViolationOut) => {
    setSelectedViolation(violation)
    setEditData({
      vehicle_type: violation.vehicle_type,
      violation_type: violation.violation_type,
      license_plate: violation.license_plate,
      confidence: violation.confidence,
      status: violation.status,
    })
    setIsEditDialogOpen(true)
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Chờ xử lý</Badge>
      case "processed":
        return <Badge variant="default">Đã xử lý</Badge>
      case "sent":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            Đã gửi
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status || "Chưa xác định"}</Badge>
    }
  }

  const getViolationTypeBadge = (type: string) => {
    const typeMap: Record<string, { variant: any; label: string }> = {
      red_light: { variant: "destructive", label: "Vượt đèn đỏ" },
      speeding: { variant: "destructive", label: "Vượt tốc độ" },
      no_helmet: { variant: "outline", label: "Không đội mũ bảo hiểm" },
      wrong_lane: { variant: "secondary", label: "Sai làn đường" },
    }

    const config = typeMap[type] || { variant: "default", label: type }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("vi-VN")
  }

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }))
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
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc và tìm kiếm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Biển số, loại vi phạm, ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Loại vi phạm</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại vi phạm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="red_light">Vượt đèn đỏ</SelectItem>
                  <SelectItem value="speeding">Vượt tốc độ</SelectItem>
                  <SelectItem value="no_helmet">Không đội mũ bảo hiểm</SelectItem>
                  <SelectItem value="wrong_lane">Sai làn đường</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Chờ xử lý</SelectItem>
                  <SelectItem value="processed">Đã xử lý</SelectItem>
                  <SelectItem value="sent">Đã gửi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Xuất Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Violations Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Danh sách vi phạm ({filteredViolations.length}/{pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã vi phạm</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Loại vi phạm</TableHead>
                <TableHead>Biển số xe</TableHead>
                <TableHead>Loại xe</TableHead>
                <TableHead>Độ tin cậy</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredViolations.map((violation) => (
                <TableRow key={violation.id}>
                  <TableCell className="font-medium">{violation.id.slice(0, 8)}...</TableCell>
                  <TableCell>{formatDateTime(violation.timestamp)}</TableCell>
                  <TableCell>{getViolationTypeBadge(violation.violation_type)}</TableCell>
                  <TableCell className="font-mono">{violation.license_plate || "N/A"}</TableCell>
                  <TableCell>{violation.vehicle_type || "N/A"}</TableCell>
                  <TableCell>{((violation.confidence || 0) * 100).toFixed(1)}%</TableCell>
                  <TableCell>{getStatusBadge(violation.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedViolation(violation)
                          setIsViewDialogOpen(true)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(violation)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleViewHistory(violation)}>
                        <History className="w-4 h-4" />
                      </Button>
                      {violation.status === "pending" && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setSelectedViolation(violation)
                            setIsFineDialogOpen(true)
                          }}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      )}
                      {violation.status === "processed" && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setSelectedViolation(violation)
                            setIsSendDialogOpen(true)
                          }}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Trang {pagination.page} / {pagination.totalPages}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Violation Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết vi phạm - {selectedViolation?.id}</DialogTitle>
            <DialogDescription>Thông tin chi tiết về vi phạm giao thông</DialogDescription>
          </DialogHeader>

          {selectedViolation && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">Thời gian:</span>
                    <span>{formatDateTime(selectedViolation.timestamp)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Hash className="w-4 h-4" />
                    <span className="font-medium">Biển số:</span>
                    <span className="font-mono">{selectedViolation.license_plate || "N/A"}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Độ tin cậy:</span>
                    <span>{((selectedViolation.confidence || 0) * 100).toFixed(1)}%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Car className="w-4 h-4" />
                    <span className="font-medium">Loại xe:</span>
                    <span>{selectedViolation.vehicle_type || "N/A"}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Loại vi phạm:</span>
                    {getViolationTypeBadge(selectedViolation.violation_type)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Trạng thái:</span>
                    {getStatusBadge(selectedViolation.status)}
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="space-y-4">
                <h4 className="font-medium">Hình ảnh bằng chứng</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Hình ảnh vi phạm</Label>
                    <img
                      src={apiClient.getImageUrl(selectedViolation.frame_image_path) || "/placeholder.svg"}
                      alt="Violation"
                      className="w-full h-48 object-cover rounded-lg border"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg?height=200&width=300"
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hình ảnh phương tiện</Label>
                    <img
                      src={apiClient.getImageUrl(selectedViolation.vehicle_image_path) || "/placeholder.svg"}
                      alt="Vehicle"
                      className="w-full h-48 object-cover rounded-lg border"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg?height=200&width=300"
                      }}
                    />
                  </div>
                  {selectedViolation.lp_image_path && (
                    <div className="space-y-2">
                      <Label>Ảnh biển số xe</Label>
                      <img
                        src={apiClient.getImageUrl(selectedViolation.lp_image_path) || "/placeholder.svg"}
                        alt="License Plate"
                        className="w-full h-48 object-cover rounded-lg border"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=200&width=300"
                        }}
                      />
                      <div className="text-center">
                        <Badge variant="outline" className="font-mono">
                          {selectedViolation.license_plate || "N/A"}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Violation Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa vi phạm</DialogTitle>
            <DialogDescription>Cập nhật thông tin vi phạm {selectedViolation?.id}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loại xe</Label>
                <Input
                  value={editData.vehicle_type || ""}
                  onChange={(e) => setEditData({ ...editData, vehicle_type: e.target.value })}
                  placeholder="Nhập loại xe"
                />
              </div>
              <div className="space-y-2">
                <Label>Loại vi phạm</Label>
                <Select
                  value={editData.violation_type || ""}
                  onValueChange={(value) => setEditData({ ...editData, violation_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại vi phạm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="red_light">Vượt đèn đỏ</SelectItem>
                    <SelectItem value="speeding">Vượt tốc độ</SelectItem>
                    <SelectItem value="no_helmet">Không đội mũ bảo hiểm</SelectItem>
                    <SelectItem value="wrong_lane">Sai làn đường</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Biển số xe</Label>
                <Input
                  value={editData.license_plate || ""}
                  onChange={(e) => setEditData({ ...editData, license_plate: e.target.value })}
                  placeholder="Nhập biển số xe"
                />
              </div>
              <div className="space-y-2">
                <Label>Độ tin cậy</Label>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={editData.confidence || ""}
                  onChange={(e) => setEditData({ ...editData, confidence: Number.parseFloat(e.target.value) })}
                  placeholder="0.0 - 1.0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select
                value={editData.status || ""}
                onValueChange={(value) => setEditData({ ...editData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Chờ xử lý</SelectItem>
                  <SelectItem value="processed">Đã xử lý</SelectItem>
                  <SelectItem value="sent">Đã gửi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleEditViolation}>
              <Edit className="w-4 h-4 mr-2" />
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lịch sử thay đổi - {selectedViolation?.id}</DialogTitle>
            <DialogDescription>Theo dõi tất cả các thay đổi của vi phạm này</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {violationHistory.map((version) => (
              <Card key={version.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{version.change_type}</Badge>
                        <span className="text-sm text-muted-foreground">{formatDateTime(version.updated_at)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Loại xe:</span> {version.vehicle_type || "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Loại vi phạm:</span> {version.violation_type}
                        </div>
                        <div>
                          <span className="font-medium">Biển số:</span> {version.license_plate || "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Độ tin cậy:</span>{" "}
                          {((version.confidence || 0) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRollback(version.id)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Khôi phục
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Fine Dialog */}
      <Dialog open={isFineDialogOpen} onOpenChange={setIsFineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xuất phiếu phạt</DialogTitle>
            <DialogDescription>Tạo phiếu phạt cho vi phạm {selectedViolation?.id}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fine-amount">Số tiền phạt (VNĐ)</Label>
              <Input
                id="fine-amount"
                type="number"
                placeholder="Nhập số tiền phạt"
                value={fineAmount}
                onChange={(e) => setFineAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fine-description">Mô tả vi phạm</Label>
              <Textarea
                id="fine-description"
                placeholder="Nhập mô tả chi tiết về vi phạm"
                value={fineDescription}
                onChange={(e) => setFineDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipient-name">Tên người vi phạm</Label>
                <Input
                  id="recipient-name"
                  placeholder="Nhập tên người vi phạm"
                  value={recipientInfo.name}
                  onChange={(e) => setRecipientInfo({ ...recipientInfo, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipient-email">Email</Label>
                <Input
                  id="recipient-email"
                  type="email"
                  placeholder="Nhập email"
                  value={recipientInfo.email}
                  onChange={(e) => setRecipientInfo({ ...recipientInfo, email: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFineDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateFine}>
              <FileText className="w-4 h-4 mr-2" />
              Tạo phiếu phạt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Fine Dialog */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gửi phiếu phạt</DialogTitle>
            <DialogDescription>Đánh dấu phiếu phạt đã được gửi cho vi phạm {selectedViolation?.id}</DialogDescription>
          </DialogHeader>

          <div className="text-center py-4">
            <p>Xác nhận đã gửi phiếu phạt cho vi phạm này?</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSendFine}>
              <Send className="w-4 h-4 mr-2" />
              Xác nhận đã gửi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
