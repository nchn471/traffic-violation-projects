"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Car, Clock, Activity } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import apiClient, { type StatsOverview } from "@/lib/api"

export default function DashboardTab() {
  const [stats, setStats] = useState<StatsOverview | null>(null)
  const [weeklyData, setWeeklyData] = useState<any[]>([])
  const [hourlyData, setHourlyData] = useState<any[]>([])
  const [processingStats, setProcessingStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [overviewRes, weeklyRes, hourlyRes, processingRes] = await Promise.all([
          apiClient.getStatsOverview(),
          apiClient.getWeeklyStats(),
          apiClient.getHourlyStats(),
          apiClient.getProcessingStats(),
        ])

        if (overviewRes.data) {
          setStats(overviewRes.data)
        }

        if (weeklyRes.data) {
          // Transform weekday data for chart
          const weekdayMap: Record<string, string> = {
            Monday: "T2",
            Tuesday: "T3",
            Wednesday: "T4",
            Thursday: "T5",
            Friday: "T6",
            Saturday: "T7",
            Sunday: "CN",
          }

          const transformedWeekly = weeklyRes.data.data.map((item) => ({
            day: weekdayMap[item.weekday] || item.weekday,
            violations: item.count,
          }))
          setWeeklyData(transformedWeekly)
        }

        if (hourlyRes.data) {
          // Transform hourly data for chart
          const transformedHourly = hourlyRes.data.data.map((item) => ({
            hour: item.hour.toString().padStart(2, "0"),
            violations: item.count,
          }))
          setHourlyData(transformedHourly)
        }

        if (processingRes.data) {
          setProcessingStats(processingRes.data)
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Transform violation types data for pie chart
  const violationTypeData = stats?.violations_by_type
    ? Object.entries(stats.violations_by_type).map(([name, value], index) => ({
        name,
        value,
        color: ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"][index % 5],
      }))
    : []

  // Transform camera data for location stats
  const locationData = stats?.violations_by_camera
    ? Object.entries(stats.violations_by_camera).map(([location, violations]) => ({
        location,
        violations,
      }))
    : []

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng vi phạm</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_violations?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Tổng số vi phạm đã ghi nhận</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trung bình/ngày</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.average_per_day?.toFixed(1) || 0}</div>
            <p className="text-xs text-muted-foreground">Vi phạm trung bình mỗi ngày</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ xử lý</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((stats?.processed_ratio || 0) * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Vi phạm đã được xử lý</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chưa xử lý</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processingStats?.unprocessed || 0}</div>
            <p className="text-xs text-muted-foreground">Cần xử lý ngay</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vi phạm theo ngày trong tuần</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="violations" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vi phạm theo giờ trong ngày</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="violations" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Phân loại vi phạm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={violationTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {violationTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top camera vi phạm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {locationData.slice(0, 5).map((location, index) => (
                <div key={location.location} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <span className="font-medium">{location.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(location.violations / Math.max(...locationData.map((l) => l.violations))) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{location.violations}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
