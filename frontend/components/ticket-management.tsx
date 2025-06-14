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
import { Textarea } from "@/components/ui/textarea"
import { Download, Eye, CheckCircle, Mail, Edit } from "lucide-react"
import apiClient, { type TicketOut, type TicketUpdate } from "@/lib/api"

export default function TicketManagement() {
  const [tickets, setTickets] = useState<TicketOut[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<TicketOut | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editData, setEditData] = useState<TicketUpdate>({})

  // Mock data for demonstration - in real app, you'd have a getTickets endpoint
  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true)
      try {
        const response = await apiClient.getTickets()
        if (response.data) {
          setTickets(response.data)
        }
      } catch (error) {
        console.error("Error fetching tickets:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTickets()
  }, [])

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return

    try {
      const response = await apiClient.updateTicket(selectedTicket.id, editData)
      if (response.data) {
        setTickets(tickets.map((t) => (t.id === selectedTicket.id ? response.data! : t)))
        setIsEditDialogOpen(false)
        setSelectedTicket(null)
        setEditData({})
      }
    } catch (error) {
      console.error("Error updating ticket:", error)
    }
  }

  const handleMarkPaid = async (ticketId: string) => {
    try {
      const response = await apiClient.markTicketPaid(ticketId)
      if (response.data) {
        setTickets(tickets.map((t) => (t.id === ticketId ? { ...t, status: "paid" } : t)))
      }
    } catch (error) {
      console.error("Error marking ticket as paid:", error)
    }
  }

  const handleSendEmail = async (ticketId: string) => {
    try {
      const response = await apiClient.sendTicketEmail(ticketId)
      if (response.data) {
        setTickets(tickets.map((t) => (t.id === ticketId ? { ...t, status: "sent" } : t)))
      }
    } catch (error) {
      console.error("Error sending ticket email:", error)
    }
  }

  const handleDownloadPdf = async (ticketId: string) => {
    try {
      const response = await apiClient.getTicketPdf(ticketId)
      if (response.data) {
        const url = window.URL.createObjectURL(response.data)
        const a = document.createElement("a")
        a.style.display = "none"
        a.href = url
        a.download = `ticket-${ticketId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Error downloading PDF:", error)
    }
  }

  const getStatusBadge = (status: string | null | undefined) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Chờ xử lý</Badge>
      case "sent":
        return <Badge variant="default">Đã gửi</Badge>
      case "paid":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            Đã thanh toán
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status || "Chưa xác định"}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  const formatDateTime = (timestamp: string | null | undefined) => {
    if (!timestamp) return "N/A"
    return new Date(timestamp).toLocaleString("vi-VN")
  }

  const openEditDialog = (ticket: TicketOut) => {
    setSelectedTicket(ticket)
    setEditData({
      amount: ticket.amount,
      name: ticket.name,
      email: ticket.email,
      notes: ticket.notes,
    })
    setIsEditDialogOpen(true)
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
        <h2 className="text-2xl font-bold">Quản lý Phiếu phạt</h2>
      </div>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Phiếu phạt ({tickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã phiếu</TableHead>
                <TableHead>Người vi phạm</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Ngày xuất</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">{ticket.id.slice(0, 8)}...</TableCell>
                  <TableCell>{ticket.name || "N/A"}</TableCell>
                  <TableCell>{ticket.email || "N/A"}</TableCell>
                  <TableCell className="font-bold text-red-600">{formatCurrency(ticket.amount)}</TableCell>
                  <TableCell>{formatDateTime(ticket.issued_at)}</TableCell>
                  <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTicket(ticket)
                          setIsViewDialogOpen(true)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(ticket)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(ticket.id)}>
                        <Download className="w-4 h-4" />
                      </Button>
                      {ticket.status === "pending" && (
                        <Button variant="outline" size="sm" onClick={() => handleSendEmail(ticket.id)}>
                          <Mail className="w-4 h-4" />
                        </Button>
                      )}
                      {ticket.status === "sent" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkPaid(ticket.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Ticket Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết Phiếu phạt - {selectedTicket?.id}</DialogTitle>
            <DialogDescription>Thông tin chi tiết về phiếu phạt</DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Người vi phạm</Label>
                  <div className="p-2 bg-gray-50 rounded">{selectedTicket.name || "N/A"}</div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="p-2 bg-gray-50 rounded">{selectedTicket.email || "N/A"}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Số tiền phạt</Label>
                  <div className="p-2 bg-red-50 rounded font-bold text-red-600">
                    {formatCurrency(selectedTicket.amount)}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <div className="p-2 bg-gray-50 rounded">{getStatusBadge(selectedTicket.status)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ghi chú</Label>
                <div className="p-2 bg-gray-50 rounded min-h-[60px]">{selectedTicket.notes || "Không có ghi chú"}</div>
              </div>

              <div className="space-y-2">
                <Label>Ngày xuất phiếu</Label>
                <div className="p-2 bg-gray-50 rounded">{formatDateTime(selectedTicket.issued_at)}</div>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => handleDownloadPdf(selectedTicket.id)}>
                  <Download className="w-4 h-4 mr-2" />
                  Tải PDF
                </Button>
                {selectedTicket.status === "pending" && (
                  <Button onClick={() => handleSendEmail(selectedTicket.id)}>
                    <Mail className="w-4 h-4 mr-2" />
                    Gửi phiếu phạt
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Ticket Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Phiếu phạt</DialogTitle>
            <DialogDescription>Cập nhật thông tin phiếu phạt {selectedTicket?.id}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Số tiền phạt (VNĐ)</Label>
              <Input
                id="edit-amount"
                type="number"
                value={editData.amount || ""}
                onChange={(e) => setEditData({ ...editData, amount: Number.parseFloat(e.target.value) })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Tên người vi phạm</Label>
                <Input
                  id="edit-name"
                  value={editData.name || ""}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editData.email || ""}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Ghi chú</Label>
              <Textarea
                id="edit-notes"
                value={editData.notes || ""}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateTicket}>
              <Edit className="w-4 h-4 mr-2" />
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
