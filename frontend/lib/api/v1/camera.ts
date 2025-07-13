export interface Camera {
  id: string
  name: string
  location: string
  folder_path: string
  created_at: string
  updated_at: string
}

const base_api_url = "/api/v1/cameras"

function getAuthHeaders() {
  const token = localStorage.getItem("access_token")
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export async function getCameras(): Promise<Camera[]> {
  const res = await fetch(`${base_api_url}/`, {
    headers: getAuthHeaders(),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed to fetch cameras" }))
    throw new Error(error.detail || "Failed to fetch cameras")
  }

  return res.json()
}

export async function getCamera(id: string): Promise<Camera> {
  const res = await fetch(`${base_api_url}/${id}`, {
    headers: getAuthHeaders(),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed to fetch camera" }))
    throw new Error(error.detail || "Failed to fetch camera")
  }

  return res.json()
}

export async function createCamera(data: {
  name: string
  location: string
  folder_path: string
}): Promise<Camera> {
  const res = await fetch(`${base_api_url}/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed to create camera" }))
    throw new Error(error.detail || "Failed to create camera")
  }

  return res.json()
}

export async function updateCamera(
  id: string,
  data: {
    name?: string | null
    location?: string | null
    folder_path?: string | null
  },
): Promise<Camera> {
  const res = await fetch(`${base_api_url}/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed to update camera" }))
    throw new Error(error.detail || "Failed to update camera")
  }

  return res.json()
}

export async function deleteCamera(id: string): Promise<void> {
  const res = await fetch(`${base_api_url}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed to delete camera" }))
    throw new Error(error.detail || "Failed to delete camera")
  }
}

export async function getCameraVideos(cameraId: string): Promise<string[]> {
  const res = await fetch(`${base_api_url}/${cameraId}/videos`, {
    headers: getAuthHeaders(),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed to fetch camera videos" }))
    throw new Error(error.detail || "Failed to fetch camera videos")
  }

  return res.json()
}
