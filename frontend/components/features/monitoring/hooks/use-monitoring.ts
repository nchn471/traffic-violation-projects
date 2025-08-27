"use client"

import { useEffect, useState, useCallback } from "react"
import { getCameras, getCameraVideos } from "@/lib/api/v1/camera"
import type { Camera } from "@/lib/types/api/v1/camera"

export function useMonitoring() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialog state management
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const fetchCameras = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getCameras()
      setCameras(data)
    } catch (err) {
      console.error("Failed to fetch cameras", err)
      setError("Failed to load camera data.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCameras()
  }, [fetchCameras])

  const fetchCameraVideos = useCallback((cameraId: string) => {
    return getCameraVideos(cameraId)
  }, [])

  const openDialog = useCallback((camera: Camera) => {
    setSelectedCamera(camera)
    setIsDialogOpen(true)
  }, [])

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false)
    setSelectedCamera(null)
  }, [])

  const updateCameraInList = useCallback(
    (updatedCamera: Camera) => {
      setCameras((prevCameras) =>
        prevCameras.map((camera) => (camera.id === updatedCamera.id ? updatedCamera : camera)),
      )
      // Also update selectedCamera if it's the same camera
      if (selectedCamera?.id === updatedCamera.id) {
        setSelectedCamera(updatedCamera)
      }
    },
    [selectedCamera],
  )

  return {
    cameras,
    isLoading,
    error,
    fetchCameraVideos,
    selectedCamera,
    isDialogOpen,
    openDialog,
    closeDialog,
    updateCameraInList,
    handleRetry: fetchCameras,
    handleRefresh: fetchCameras,
  }
}
