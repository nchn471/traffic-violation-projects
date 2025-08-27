export interface Point {
  x: number
  y: number
}

export interface Lane {
  id: number
  polygon: Point[]
  allow_labels: string[]
}

export interface CameraConfig {
  video_url?: string
  roi?: Point[]
  stop_line?: Point[]
  light_roi?: Point[]
  detection_type?: string
  lanes?: Lane[]
}
export interface Camera {
  id: string
  name: string
  location?: string | null
  folder_path: string
  config?: CameraConfig | null
  created_at: string
  updated_at: string
}

export type CameraUpdate = Partial<Omit<Camera, 'id' | 'created_at' | 'updated_at'>>
