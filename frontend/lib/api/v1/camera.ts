import { apiFetch } from "@/lib/api/v1/fetch"
import type { Camera, CameraUpdate } from "@/lib/types/api/v1/camera"

const basePath = "/api/v1/cameras"


export function getCameras(): Promise<Camera[]> {
  return apiFetch<Camera[]>(`${basePath}/`, {
    credentials: "include",
  })
}


export function getCamera(id: string): Promise<Camera> {
  return apiFetch<Camera>(`${basePath}/${id}`, {
    credentials: "include",
  })
}

export function updateCamera(id: string, data: CameraUpdate): Promise<Camera> {
  return apiFetch<Camera>(`${basePath}/${id}`, {
    method: "PATCH",
    credentials: "include",
    body: data,
  })
}

export function getCameraVideos(cameraId: string): Promise<string[]> {
  return apiFetch<string[]>(`${basePath}/${cameraId}/videos`, {
    credentials: "include",
  })
}

export function sendFrames(
  cameraId: string,
  params?: { frame_skip?: number; max_frames?: number }
): Promise<void> {
  const query = new URLSearchParams()
  if (params?.frame_skip !== undefined) query.set("frame_skip", String(params.frame_skip))
  if (params?.max_frames !== undefined) query.set("max_frames", String(params.max_frames))

  const queryString = query.toString() ? `?${query.toString()}` : ""

  return apiFetch<void>(`${basePath}/${cameraId}/send-frames${queryString}`, {
    method: "POST",
    credentials: "include",
  })
}
