import axios, { type AxiosResponse } from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Auth interfaces
export interface LoginRequest {
  username: string
  password: string
}

export interface Token {
  access_token: string
  token_type: string
}

// Camera interfaces
export interface CameraOut {
  id: string
  name: string
  location: string
  status: string
  created_at: string
  updated_at: string
}

export interface CameraCreate {
  name: string
  location: string
  rtsp_url?: string
  config?: Record<string, any>
}

export interface CameraUpdate {
  name?: string
  location?: string
  rtsp_url?: string
  config?: Record<string, any>
  status?: string
}

// Violation interfaces
export interface ViolationOut {
  id: string
  camera_id: string
  violation_type: string
  timestamp: string
  confidence: number
  bounding_box: number[]
  image_path?: string
  video_path?: string
  license_plate?: string
  vehicle_type?: string
  speed?: number
  created_at: string
  updated_at: string
}

export interface ViolationUpdate {
  violation_type?: string
  confidence?: number
  bounding_box?: number[]
  license_plate?: string
  vehicle_type?: string
  speed?: number
}

export interface ViolationHistory {
  id: string
  violation_id: string
  changed_by: string
  changed_at: string
  changes: Record<string, any>
  previous_values: Record<string, any>
}

// Ticket interfaces
export interface TicketOut {
  id: string
  amount: number
  name?: string
  email?: string
  notes?: string
  status?: string
  issued_at?: string
}

export interface TicketUpdate {
  amount?: number
  name?: string
  email?: string
  notes?: string
}

// Statistics interfaces
export interface ViolationStats {
  total_violations: number
  violations_by_type: Record<string, number>
  violations_by_camera: Record<string, number>
  violations_by_hour: Record<string, number>
  violations_by_day: Record<string, number>
}

export interface CameraStats {
  total_cameras: number
  active_cameras: number
  inactive_cameras: number
  cameras_by_location: Record<string, number>
}

export interface TicketStats {
  total_tickets: number
  total_amount: number
  tickets_by_status: Record<string, number>
  average_amount: number
}

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

const api = {
  // Auth endpoints
  login: (data: LoginRequest): Promise<AxiosResponse<Token>> => apiClient.post("/auth/login", data),

  // Camera endpoints
  getCameras: (): Promise<AxiosResponse<CameraOut[]>> => apiClient.get("/cameras/"),

  getCamera: (id: string): Promise<AxiosResponse<CameraOut>> => apiClient.get(`/cameras/${id}`),

  createCamera: (data: CameraCreate): Promise<AxiosResponse<CameraOut>> => apiClient.post("/cameras/", data),

  updateCamera: (id: string, data: CameraUpdate): Promise<AxiosResponse<CameraOut>> =>
    apiClient.put(`/cameras/${id}`, data),

  deleteCamera: (id: string): Promise<AxiosResponse<void>> => apiClient.delete(`/cameras/${id}`),

  // Violation endpoints
  getViolations: (
    skip?: number,
    limit?: number,
    camera_id?: string,
    violation_type?: string,
  ): Promise<AxiosResponse<ViolationOut[]>> =>
    apiClient.get("/violations/", { params: { skip, limit, camera_id, violation_type } }),

  getViolation: (id: string): Promise<AxiosResponse<ViolationOut>> => apiClient.get(`/violations/${id}`),

  updateViolation: (id: string, data: ViolationUpdate): Promise<AxiosResponse<ViolationOut>> =>
    apiClient.put(`/violations/${id}`, data),

  deleteViolation: (id: string): Promise<AxiosResponse<void>> => apiClient.delete(`/violations/${id}`),

  getViolationHistory: (id: string): Promise<AxiosResponse<ViolationHistory[]>> =>
    apiClient.get(`/violations/${id}/history`),

  rollbackViolation: (id: string, history_id: string): Promise<AxiosResponse<ViolationOut>> =>
    apiClient.post(`/violations/${id}/rollback/${history_id}`),

  // Ticket endpoints
  getTickets: (): Promise<AxiosResponse<TicketOut[]>> => apiClient.get("/tickets/"),

  updateTicket: (id: string, data: TicketUpdate): Promise<AxiosResponse<TicketOut>> =>
    apiClient.put(`/tickets/${id}`, data),

  markTicketPaid: (id: string): Promise<AxiosResponse<TicketOut>> => apiClient.post(`/tickets/${id}/paid`),

  getTicketPdf: (id: string): Promise<AxiosResponse<Blob>> =>
    apiClient.get(`/tickets/${id}/pdf`, { responseType: "blob" }),

  sendTicketEmail: (id: string): Promise<AxiosResponse<{ message: string }>> => apiClient.post(`/tickets/${id}/send`),

  // Statistics endpoints
  getViolationStats: (start_date?: string, end_date?: string): Promise<AxiosResponse<ViolationStats>> =>
    apiClient.get("/statistics/violations", { params: { start_date, end_date } }),

  getCameraStats: (): Promise<AxiosResponse<CameraStats>> => apiClient.get("/statistics/cameras"),

  getTicketStats: (start_date?: string, end_date?: string): Promise<AxiosResponse<TicketStats>> =>
    apiClient.get("/statistics/tickets", { params: { start_date, end_date } }),

  // Media endpoints
  getViolationImage: (id: string): Promise<AxiosResponse<Blob>> =>
    apiClient.get(`/media/violations/${id}/image`, { responseType: "blob" }),

  getViolationVideo: (id: string): Promise<AxiosResponse<Blob>> =>
    apiClient.get(`/media/violations/${id}/video`, { responseType: "blob" }),

  // Health endpoint
  getHealth: (): Promise<AxiosResponse<{ status: string; timestamp: string }>> => apiClient.get("/health"),
}

export default api
export type { ViolationHistory, CameraStats, TicketStats, ViolationStats }
