"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/ui/card"
import { Button } from "@/components/shared/ui/button"
import { MousePointer, Square, Minus, Lightbulb, Route, Trash2, Eye, EyeOff } from "lucide-react"
import { getThumbnailUrl } from "@/lib/api/v1/media"
import type { Lane } from "@/lib/types/api/v1/camera"

interface Point {
  x: number
  y: number
}

interface InteractivePolygonEditorProps {
  videoUrl: string
  roi: Point[]
  stopLine: Point[]
  lightRoi: Point[]
  lanes: Lane[]
  onRoiChange: (points: Point[]) => void
  onStopLineChange: (points: Point[]) => void
  onLightRoiChange: (points: Point[]) => void
  onLanesChange: (lanes: Lane[]) => void
  disabled?: boolean
}

type EditMode = "roi" | "stopLine" | "lightRoi" | "lane" | null

export function InteractivePolygonEditor({
  videoUrl,
  roi,
  stopLine,
  lightRoi,
  lanes,
  onRoiChange,
  onStopLineChange,
  onLightRoiChange,
  onLanesChange,
  disabled,
}: InteractivePolygonEditorProps) {
  const [editMode, setEditMode] = useState<EditMode>(null)
  const [selectedLaneId, setSelectedLaneId] = useState<number | null>(null)
  const [showOverlay, setShowOverlay] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  const thumbnailUrl = getThumbnailUrl(videoUrl)

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image || !imageLoaded) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)

    if (!showOverlay) return

    // Scale factor from original image to displayed canvas
    const scaleX = canvas.clientWidth / image.naturalWidth
    const scaleY = canvas.clientHeight / image.naturalHeight

    // Draw ROI
    if (roi.length > 0) {
      ctx.strokeStyle = "#3b82f6"
      ctx.fillStyle = "rgba(59, 130, 246, 0.1)"
      ctx.lineWidth = 2
      ctx.beginPath()
      roi.forEach((point, index) => {
        const x = point.x * scaleX
        const y = point.y * scaleY
        if (index === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // Draw ROI points
      ctx.fillStyle = "#3b82f6"
      roi.forEach((point) => {
        const x = point.x * scaleX
        const y = point.y * scaleY
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, 2 * Math.PI)
        ctx.fill()
      })
    }

    // Draw Stop Line
    if (stopLine.length >= 2) {
      ctx.strokeStyle = "#ef4444"
      ctx.lineWidth = 3
      ctx.beginPath()
      const startX = stopLine[0].x * scaleX
      const startY = stopLine[0].y * scaleY
      const endX = stopLine[1].x * scaleX
      const endY = stopLine[1].y * scaleY
      ctx.moveTo(startX, startY)
      ctx.lineTo(endX, endY)
      ctx.stroke()

      // Draw stop line points
      ctx.fillStyle = "#ef4444"
      stopLine.slice(0, 2).forEach((point) => {
        const x = point.x * scaleX
        const y = point.y * scaleY
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, 2 * Math.PI)
        ctx.fill()
      })
    }

    // Draw Light ROI
    if (lightRoi.length > 0) {
      ctx.strokeStyle = "#f59e0b"
      ctx.fillStyle = "rgba(245, 158, 11, 0.1)"
      ctx.lineWidth = 2
      ctx.beginPath()
      lightRoi.forEach((point, index) => {
        const x = point.x * scaleX
        const y = point.y * scaleY
        if (index === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // Draw light ROI points
      ctx.fillStyle = "#f59e0b"
      lightRoi.forEach((point) => {
        const x = point.x * scaleX
        const y = point.y * scaleY
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, 2 * Math.PI)
        ctx.fill()
      })
    }

    // Draw Lanes
    lanes.forEach((lane, laneIndex) => {
      const colors = ["#10b981", "#8b5cf6", "#f97316", "#06b6d4", "#84cc16"]
      const color = colors[laneIndex % colors.length]

      if (lane.polygon.length > 0) {
        ctx.strokeStyle = color
        ctx.fillStyle = color + "20"
        ctx.lineWidth = 2
        ctx.beginPath()
        lane.polygon.forEach((point, index) => {
          const x = point.x * scaleX
          const y = point.y * scaleY
          if (index === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        // Draw lane points
        ctx.fillStyle = color
        lane.polygon.forEach((point) => {
          const x = point.x * scaleX
          const y = point.y * scaleY
          ctx.beginPath()
          ctx.arc(x, y, 4, 0, 2 * Math.PI)
          ctx.fill()
        })

        // Draw lane label
        if (lane.polygon.length > 0) {
          const centerX = lane.polygon.reduce((sum, p) => sum + p.x * scaleX, 0) / lane.polygon.length
          const centerY = lane.polygon.reduce((sum, p) => sum + p.y * scaleY, 0) / lane.polygon.length

          ctx.fillStyle = "#ffffff"
          ctx.fillRect(centerX - 15, centerY - 10, 30, 20)
          ctx.strokeStyle = color
          ctx.strokeRect(centerX - 15, centerY - 10, 30, 20)

          ctx.fillStyle = color
          ctx.font = "12px sans-serif"
          ctx.textAlign = "center"
          ctx.fillText(`L${lane.id}`, centerX, centerY + 4)
        }
      }
    })
  }, [roi, stopLine, lightRoi, lanes, imageLoaded, showOverlay])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!editMode || disabled) return

      const canvas = canvasRef.current
      const image = imageRef.current
      if (!canvas || !image) return

      const rect = canvas.getBoundingClientRect()

      // Get click position relative to canvas
      const canvasX = event.clientX - rect.left
      const canvasY = event.clientY - rect.top

      // Convert to original image coordinates
      // image.naturalWidth/naturalHeight = original image dimensions
      // canvas.clientWidth/clientHeight = displayed canvas dimensions
      const x = (canvasX / canvas.clientWidth) * image.naturalWidth
      const y = (canvasY / canvas.clientHeight) * image.naturalHeight

      const newPoint = { x, y }

      switch (editMode) {
        case "roi":
          onRoiChange([...roi, newPoint])
          break
        case "stopLine":
          if (stopLine.length < 2) {
            onStopLineChange([...stopLine, newPoint])
          }
          break
        case "lightRoi":
          onLightRoiChange([...lightRoi, newPoint])
          break
        case "lane":
          if (selectedLaneId !== null) {
            const updatedLanes = lanes.map((lane) =>
              lane.id === selectedLaneId ? { ...lane, polygon: [...lane.polygon, newPoint] } : lane,
            )
            onLanesChange(updatedLanes)
          }
          break
      }
    },
    [
      editMode,
      roi,
      stopLine,
      lightRoi,
      lanes,
      selectedLaneId,
      onRoiChange,
      onStopLineChange,
      onLightRoiChange,
      onLanesChange,
      disabled,
    ],
  )

  const clearRegion = (type: EditMode) => {
    switch (type) {
      case "roi":
        onRoiChange([])
        break
      case "stopLine":
        onStopLineChange([])
        break
      case "lightRoi":
        onLightRoiChange([])
        break
      case "lane":
        if (selectedLaneId !== null) {
          const updatedLanes = lanes.map((lane) => (lane.id === selectedLaneId ? { ...lane, polygon: [] } : lane))
          onLanesChange(updatedLanes)
        }
        break
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MousePointer className="h-5 w-5" />
            Interactive Region Editor
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowOverlay(!showOverlay)}>
            {showOverlay ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showOverlay ? "Hide" : "Show"} Overlay
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Control Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={editMode === "roi" ? "default" : "outline"}
            size="sm"
            onClick={() => setEditMode(editMode === "roi" ? null : "roi")}
            disabled={disabled}
          >
            <Square className="h-4 w-4 mr-2" />
            ROI ({roi.length})
          </Button>

          <Button
            variant={editMode === "stopLine" ? "default" : "outline"}
            size="sm"
            onClick={() => setEditMode(editMode === "stopLine" ? null : "stopLine")}
            disabled={disabled}
          >
            <Minus className="h-4 w-4 mr-2" />
            Stop Line ({stopLine.length}/2)
          </Button>

          <Button
            variant={editMode === "lightRoi" ? "default" : "outline"}
            size="sm"
            onClick={() => setEditMode(editMode === "lightRoi" ? null : "lightRoi")}
            disabled={disabled}
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            Light ROI ({lightRoi.length})
          </Button>

          {lanes.map((lane, index) => (
            <Button
              key={lane.id}
              variant={editMode === "lane" && selectedLaneId === lane.id ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (editMode === "lane" && selectedLaneId === lane.id) {
                  setEditMode(null)
                  setSelectedLaneId(null)
                } else {
                  setEditMode("lane")
                  setSelectedLaneId(lane.id)
                }
              }}
              disabled={disabled}
            >
              <Route className="h-4 w-4 mr-2" />
              Lane {lane.id} ({lane.polygon.length})
            </Button>
          ))}
        </div>

        {/* Clear Buttons */}
        {editMode && (
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={() => clearRegion(editMode)} disabled={disabled}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear{" "}
              {editMode === "roi"
                ? "ROI"
                : editMode === "stopLine"
                  ? "Stop Line"
                  : editMode === "lightRoi"
                    ? "Light ROI"
                    : `Lane ${selectedLaneId}`}
            </Button>
          </div>
        )}

        {/* Instructions */}
        {editMode && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {editMode === "stopLine" && stopLine.length < 2
                ? `Click ${2 - stopLine.length} more point${2 - stopLine.length > 1 ? "s" : ""} to define the stop line`
                : `Click on the image to add points for ${
                    editMode === "roi"
                      ? "Region of Interest"
                      : editMode === "stopLine"
                        ? "Stop Line"
                        : editMode === "lightRoi"
                          ? "Light ROI"
                          : `Lane ${selectedLaneId}`
                  }`}
            </p>
          </div>
        )}

        {/* Canvas Container */}
        <div className="relative">
          <img
            ref={imageRef}
            src={thumbnailUrl || "/placeholder.svg"}
            alt="Video thumbnail"
            className="w-full h-auto rounded-lg"
            onLoad={() => {
              setImageLoaded(true)
              const canvas = canvasRef.current
              const image = imageRef.current
              if (canvas && image) {
                canvas.width = image.clientWidth
                canvas.height = image.clientHeight
              }
            }}
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full cursor-crosshair rounded-lg"
            onClick={handleCanvasClick}
            style={{ pointerEvents: editMode ? "auto" : "none" }}
          />
        </div>

        {/* Legend */}
        {showOverlay && (
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>ROI</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-red-500"></div>
              <span>Stop Line</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-500 rounded"></div>
              <span>Light ROI</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Lanes</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
