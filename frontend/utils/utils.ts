import { Car, AlertTriangle } from "lucide-react"

export const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString("vi-VN")
}

export const getViolationColor = (type: string) => {
  switch (type.toLowerCase()) {
    case "speeding":
    case "red_light":
      return "destructive"
    case "wrong_lane":
      return "secondary"
    case "no_helmet":
      return "outline"
    default:
      return "default"
  }
}

export const getViolationIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "speeding":
      return <Car className="w-4 h-4" />
    case "red_light":
    default:
      return <AlertTriangle className="w-4 h-4" />
  }
}

export const getTabTitle = (tab: string) => {
  switch (tab) {
    case "monitoring":
      return "Monitoring"
    case "dashboard":
      return "Dashboard"
    case "violations":
      return "Danh sách vi phạm"
    default:
      return "Monitoring"
  }
}
