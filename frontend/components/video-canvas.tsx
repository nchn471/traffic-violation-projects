"use client"

import { useRef, useEffect, useState } from "react"
import { Camera } from "lucide-react"

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

interface VideoCanvasProps {
  currentFrame: string
  isStreaming: boolean
  isConnected: boolean
  cameraConfig: CameraParams | null
}

export default function VideoCanvas({ currentFrame, isStreaming, isConnected, cameraConfig }: VideoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 1280, height: 720 })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")

    if (!canvas || !ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw video frame if available
    if (currentFrame && imageRef.current) {
      const img = imageRef.current
      img.onload = () => {
        // Update canvas size to match image
        canvas.width = img.naturalWidth || 1280
        canvas.height = img.naturalHeight || 720
        setCanvasSize({ width: canvas.width, height: canvas.height })

        // Draw image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        // Draw overlays if config exists
        if (cameraConfig) {
          drawOverlays(ctx, cameraConfig.params, canvas.width, canvas.height)
        }
      }
      img.src = `data:image/jpeg;base64,${currentFrame}`
    } else if (cameraConfig) {
      // Draw overlays on black background
      drawOverlays(ctx, cameraConfig.params, canvas.width, canvas.height)
    }
  }, [currentFrame, cameraConfig])

  const drawOverlays = (
    ctx: CanvasRenderingContext2D,
    params: CameraParams["params"],
    width: number,
    height: number,
  ) => {
    ctx.save()

    // Draw ROI (Region of Interest)
    if (params.roi && params.roi.length > 0) {
      ctx.strokeStyle = "#ff0000"
      ctx.lineWidth = 2
      ctx.beginPath()
      params.roi.forEach((point: number[], index: number) => {
        if (index === 0) {
          ctx.moveTo(point[0], point[1])
        } else {
          ctx.lineTo(point[0], point[1])
        }
      })
      ctx.closePath()
      ctx.stroke()

      // Label
      ctx.fillStyle = "#ff0000"
      ctx.font = "14px Arial"
      ctx.fillText("ROI", params.roi[0][0], params.roi[0][1] - 5)
    }

    // Draw Stop Line
    if (params.stop_line && params.stop_line.length === 2) {
      ctx.strokeStyle = "#00ff00"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(params.stop_line[0][0], params.stop_line[0][1])
      ctx.lineTo(params.stop_line[1][0], params.stop_line[1][1])
      ctx.stroke()

      // Label
      ctx.fillStyle = "#00ff00"
      ctx.font = "14px Arial"
      ctx.fillText("Stop Line", params.stop_line[0][0], params.stop_line[0][1] - 5)
    }

    // Draw Light ROI
    if (params.light_roi && params.light_roi.length === 4) {
      ctx.strokeStyle = "#ffff00"
      ctx.lineWidth = 2
      ctx.strokeRect(
        params.light_roi[0][0],
        params.light_roi[0][1],
        params.light_roi[2][0] - params.light_roi[0][0],
        params.light_roi[2][1] - params.light_roi[0][1],
      )

      // Label
      ctx.fillStyle = "#ffff00"
      ctx.font = "14px Arial"
      ctx.fillText("Light ROI", params.light_roi[0][0], params.light_roi[0][1] - 5)
    }

    // Draw Lanes
    if (params.lanes && params.lanes.length > 0) {
      const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7"]

      params.lanes.forEach((lane: any, index: number) => {
        const color = colors[index % colors.length]

        // Draw lane polygon
        ctx.strokeStyle = color
        ctx.fillStyle = color + "20" // Add transparency
        ctx.lineWidth = 2

        ctx.beginPath()
        lane.polygon.forEach((point: number[], pointIndex: number) => {
          if (pointIndex === 0) {
            ctx.moveTo(point[0], point[1])
          } else {
            ctx.lineTo(point[0], point[1])
          }
        })
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        // Draw lane label
        const centerX = lane.polygon.reduce((sum: number, point: number[]) => sum + point[0], 0) / lane.polygon.length
        const centerY = lane.polygon.reduce((sum: number, point: number[]) => sum + point[1], 0) / lane.polygon.length

        ctx.fillStyle = color
        ctx.font = "16px Arial"
        ctx.fillText(`Lane ${lane.id}`, centerX - 30, centerY)

        // Draw allowed labels
        ctx.font = "12px Arial"
        ctx.fillText(lane.allow_labels.join(", "), centerX - 40, centerY + 20)
      })
    }

    // Draw detection type indicator
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(10, 10, 200, 30)
    ctx.fillStyle = "#000000"
    ctx.font = "14px Arial"
    ctx.fillText(`Detection: ${params.detection_type}`, 15, 30)

    // Draw location
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(10, 50, 300, 30)
    ctx.fillStyle = "#000000"
    ctx.font = "14px Arial"
    ctx.fillText(`Location: ${params.location}`, 15, 70)

    ctx.restore()
  }

  return (
    <div className="relative w-full aspect-video">
      {currentFrame && (
        <img ref={imageRef} src={`data:image/jpeg;base64,${currentFrame}`} alt="Camera feed" className="hidden" />
      )}

      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="w-full h-full object-contain bg-black"
        style={{ maxHeight: "70vh" }}
      />

      {!currentFrame && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <div className="text-center">
            <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">{isConnected ? "Nhấn Phát để bắt đầu stream" : "Đang kết nối camera..."}</p>
            {cameraConfig && (
              <p className="text-sm mt-2 opacity-75">Config loaded: {cameraConfig.params.detection_type} detection</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
