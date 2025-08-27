import type { Violation } from "@/lib/types/api/v1/violation"
import type { Camera } from "@/lib/types/api/v1/camera"

export interface ViolationListState {
  violations: Violation[]
  cameras: Camera[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  isLoading: boolean
  error: string | null
}
