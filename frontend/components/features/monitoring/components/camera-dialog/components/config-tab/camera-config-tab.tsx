"use client"

import { useState } from "react"
import { Button } from "@/components/shared/ui/button"
import { Card, CardContent } from "@/components/shared/ui/card"
import { Loader2, Save, RotateCcw, Wrench } from "lucide-react"
import type { Camera } from "@/lib/types/api/v1/camera"
import { VideoSelector } from "./video-selector"
import { ViolationTypeSelector } from "./violation-type-selector"
import { InteractivePolygonEditor } from "./interactive-polygon-editor"
import { LaneManager } from "./lane-manager"
import { DialogHeader } from "@/components/shared/layout/dialog-header/dialog-header"

interface Props {
  camera: Camera
  videoList: string[]
  isSaving: boolean
  error?: string
  onCameraUpdate: (updated: Camera) => void
}

export function CameraConfigurationTab({
  camera,
  videoList,
  isSaving,
  error,
  onCameraUpdate,
}: Props) {
  const initialConfig = camera.config ?? {}
  const [videoUrl, setVideoUrl] = useState(initialConfig.video_url ?? "")
  const [detectionType, setDetectionType] = useState(initialConfig.detection_type ?? "")
  const [roi, setRoi] = useState(initialConfig.roi ?? [])
  const [stopLine, setStopLine] = useState(initialConfig.stop_line ?? [])
  const [lightRoi, setLightRoi] = useState(initialConfig.light_roi ?? [])
  const [lanes, setLanes] = useState(initialConfig.lanes ?? [])

  const handleSave = () => {
    onCameraUpdate({
      ...camera,
      config: {
        video_url: videoUrl || undefined,
        roi,
        stop_line: stopLine,
        light_roi: lightRoi,
        detection_type: detectionType || undefined,
        lanes,
      },
    })
  }

  const handleReset = () => {
    setVideoUrl(initialConfig.video_url ?? "")
    setDetectionType(initialConfig.detection_type ?? "")
    setRoi(initialConfig.roi ?? [])
    setStopLine(initialConfig.stop_line ?? [])
    setLightRoi(initialConfig.light_roi ?? [])
    setLanes(initialConfig.lanes ?? [])
  }

  const hasChanges =
    videoUrl !== (initialConfig.video_url ?? "") ||
    detectionType !== (initialConfig.detection_type ?? "") ||
    JSON.stringify(roi) !== JSON.stringify(initialConfig.roi ?? []) ||
    JSON.stringify(stopLine) !== JSON.stringify(initialConfig.stop_line ?? []) ||
    JSON.stringify(lightRoi) !== JSON.stringify(initialConfig.light_roi ?? []) ||
    JSON.stringify(lanes) !== JSON.stringify(initialConfig.lanes ?? [])

  return (
    <div className="space-y-6">
      <DialogHeader
        icon={<Wrench className="h-8 w-8 text-muted-foreground" />}
        title="Camera Configuration"
        description={`Configure detection regions and settings for ${camera.name}`}
        onRight={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} disabled={isSaving || !hasChanges}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        }
      />

      {/* Basic settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <VideoSelector
          videoList={videoList}
          selectedVideo={videoUrl}
          onVideoChange={setVideoUrl}
          disabled={isSaving}
        />
        <ViolationTypeSelector
          selectedType={detectionType}
          onTypeChange={setDetectionType}
          disabled={isSaving}
        />
      </div>

      {/* Polygon editor */}
      <div className="w-full">
        {videoUrl ? (
          <InteractivePolygonEditor
            videoUrl={videoUrl}
            roi={roi}
            stopLine={stopLine}
            lightRoi={lightRoi}
            lanes={lanes}
            onRoiChange={setRoi}
            onStopLineChange={setStopLine}
            onLightRoiChange={setLightRoi}
            onLanesChange={setLanes}
            disabled={isSaving}
          />
        ) : (
          <Card className="h-96 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">Select a video first</p>
              <p className="text-sm">Choose a video to start configuring detection regions</p>
            </div>
          </Card>
        )}
      </div>

      {/* Lane manager */}
      <div className="w-full">
        <LaneManager
          lanes={lanes}
          onChange={setLanes}
          disabled={isSaving}
        />
      </div>

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
