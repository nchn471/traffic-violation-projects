"use client"

import { useEffect, useState, useCallback } from "react"
import { updateCamera, getCameraVideos } from "@/lib/api/v1/camera"
import type { Camera } from "@/lib/types/api/v1/camera"
import { useToast } from "@/components/shared/hooks/use-toast"

export function useCameraDialog(camera: Camera, onCameraUpdate?: (camera: Camera) => void) {
  const [videoList, setVideoList] = useState<string[]>([])
  const [isLoadingVideos, setIsLoadingVideos] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchVideoList = useCallback(async () => {
    setIsLoadingVideos(true)
    setError(null)
    try {
      const videos = await getCameraVideos(camera.id)
      setVideoList(videos)
    } catch (err) {
      console.error("Failed to fetch videos", err)
      setError("Failed to load video list.")
      toast({
        title: "Error",
        description: "Failed to load video list.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingVideos(false)
    }
  }, [camera.id, toast])

  useEffect(() => {
    fetchVideoList()
  }, [fetchVideoList])

  const handleUpdate = useCallback(
    async (updatedCamera: Camera) => {
      setIsSaving(true)
      setError(null)
      try {
        await updateCamera(updatedCamera.id, updatedCamera)
        // Call the callback to update the parent state
        onCameraUpdate?.(updatedCamera)

        // Show success toast
        toast({
          title: "Success",
          description: `Camera "${updatedCamera.name}" has been updated successfully.`,
        })
      } catch (err) {
        console.error("Failed to update camera", err)
        const errorMessage = "Failed to update camera configuration."
        setError(errorMessage)

        // Show error toast
        toast({
          title: "Update Failed",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setIsSaving(false)
      }
    },
    [onCameraUpdate, toast],
  )

  return {
    videoList,
    isLoadingVideos,
    isSaving,
    error,
    handleUpdate,
  }
}
