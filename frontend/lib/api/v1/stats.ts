export interface StatsOverview {
    total_violations: number
    average_per_day: number
    processed_ratio: number
    violations_by_type: Record<string, number>
    violations_by_camera: Record<string, number>
  }
  
  export interface WeekdayStats {
    weekday: string
    count: number
  }
  
  export interface WeeklyViolationStats {
    data: WeekdayStats[]
  }
  
  export interface HourlyStats {
    hour: number
    count: number
  }
  
  export interface HourlyViolationStats {
    data: HourlyStats[]
  }
  
  export interface ProcessingStats {
    processed: number
    unprocessed: number
    ratio: number
  }
  
  const base_api_url = "/api/v1/stats"
  
  export async function getStatsOverview(): Promise<StatsOverview> {
    const res = await fetch(`${base_api_url}/overview`)
    if (!res.ok) throw new Error("Failed to fetch stats overview")
    return res.json()
  }
  
  export async function getWeekdayStats(): Promise<WeeklyViolationStats> {
    const res = await fetch(`${base_api_url}/by-weekday`)
    if (!res.ok) throw new Error("Failed to fetch weekday stats")
    return res.json()
  }
  
  export async function getHourlyStats(): Promise<HourlyViolationStats> {
    const res = await fetch(`${base_api_url}/by-hour`)
    if (!res.ok) throw new Error("Failed to fetch hourly stats")
    return res.json()
  }
  
  export async function getProcessingRatio(): Promise<ProcessingStats> {
    const res = await fetch(`${base_api_url}/processing-ratio`)
    if (!res.ok) throw new Error("Failed to fetch processing ratio")
    return res.json()
  }
  