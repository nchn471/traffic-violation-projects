import { Camera } from "./camera"
import { Officer } from "./officer"
import { Pagination } from "./pagination"

export interface Violation {
    id: string
    camera_id: string
    timestamp: string
    vehicle_type: string | null
    violation_type: string
    license_plate: string | null
    confidence: number | null
    status: string | null
    frame_image_path: string
    vehicle_image_path: string
    lp_image_path: string | null
    version_id: string | null
    camera?: Camera
}

export interface PaginatedViolations {
    pagination: Pagination
    data: Violation[]
}

export interface ViolationHistory {
    id: string
    violation_id: string
    officer_id: string
    timestamp: string
    vehicle_type: string | null
    violation_type: string
    license_plate: string | null
    confidence: number | null
    frame_image_path: string
    vehicle_image_path: string
    lp_image_path: string | null
    updated_at: string
    change_type: string
    notes?: string | null     
    source_id?: string | null  
    camera?: Camera
    officer?: Officer
    status: string | null
}
  

export interface ViolationUpdate {
    vehicle_type: string | null
    violation_type: string | null
    license_plate: string | null
    confidence: number | null
    status: string | null
    notes?: string | null 
}

export interface GetViolationsParams {
    page?: number
    limit?: number
    status?: string | null
    violation_type?: string | null
    search?: string | null
    camera_id?: string | null
    vehicle_type?: string | null
    confidence_min?: number | null
    confidence_max?: number | null
    timestamp_from?: string | null
    timestamp_to?: string | null
  }