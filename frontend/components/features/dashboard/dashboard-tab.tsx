"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shared/ui/card";
import { Progress } from "@/components/shared/ui/progress";
import { Button } from "@/components/shared/ui/button";
import { useToast } from "@/components/shared/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  AlertTriangle,
  Camera,
  RefreshCw,
  Activity,
  Clock,
  BarChart3,
  PieChartIcon,
} from "lucide-react";
import {
  getStatsOverview,
  getWeekdayStats,
  getHourlyStats,
  getProcessingRatio,
  type StatsOverview,
  type WeekdayStats,
  type HourlyStats,
  type ProcessingStats,
} from "@/lib/api/v1/stats";
import { TabLoading } from "@/components/shared/layout/tab-loading/tab-loading";
const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#f97316",
];

interface DashboardState {
  overview: StatsOverview | null;
  weekdayStats: WeekdayStats[];
  hourlyStats: HourlyStats[];
  processingStats: ProcessingStats | null;
  isLoading: boolean;
  error: string | null;
}

// Custom label component for pie chart
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
}: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Only show label if percentage is greater than 5%
  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function DashboardTab() {
  const [state, setState] = useState<DashboardState>({
    overview: null,
    weekdayStats: [],
    hourlyStats: [],
    processingStats: null,
    isLoading: true,
    error: null,
  });
  const { toast } = useToast();

  const fetchStats = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const [overviewData, weekdayData, hourlyData, processingData] =
        await Promise.allSettled([
          getStatsOverview(),
          getWeekdayStats(),
          getHourlyStats(),
          getProcessingRatio(),
        ]);

      setState((prev) => ({
        ...prev,
        overview:
          overviewData.status === "fulfilled" ? overviewData.value : null,
        weekdayStats:
          weekdayData.status === "fulfilled" ? weekdayData.value.data : [],
        hourlyStats:
          hourlyData.status === "fulfilled" ? hourlyData.value.data : [],
        processingStats:
          processingData.status === "fulfilled" ? processingData.value : null,
        isLoading: false,
      }));

      const failedRequests = [
        overviewData,
        weekdayData,
        hourlyData,
        processingData,
      ].filter((result) => result.status === "rejected");
      if (failedRequests.length > 0) {
        toast({
          title: "Warning",
          description: "Some statistics could not be loaded",
          variant: "destructive",
        });
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch statistics",
      }));
      toast({
        title: "Error",
        description: "Failed to fetch statistics",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (state.isLoading) {
    return <TabLoading message="Loading analytics..." />;
  }

  if (state.error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto" />
          <div>
            <h3 className="text-xl font-semibold">Error Loading Dashboard</h3>
            <p className="text-muted-foreground">{state.error}</p>
          </div>
          <Button onClick={fetchStats} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const violationTypeData = state.overview
    ? Object.entries(state.overview.violations_by_type).map(
        ([name, value]) => ({
          name: name
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          value,
        })
      )
    : [];

  const cameraData = state.overview
    ? Object.entries(state.overview.violations_by_camera)
        .map(([name, value]) => ({
          name: name.length > 20 ? `${name.substring(0, 20)}...` : name,
          value,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
    : [];

  const processingRatio =
    state.processingStats?.ratio || state.overview?.processed_ratio || 0;
  const totalProcessed = state.processingStats?.processed || 0;
  const totalUnprocessed = state.processingStats?.unprocessed || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Comprehensive overview of traffic violation statistics and trends
          </p>
        </div>
        <Button onClick={fetchStats} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Violations
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {state.overview?.total_violations?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All time violations detected
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Daily Average
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {state.overview?.average_per_day?.toFixed(1) || "0.0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Violations per day
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Processing Rate
            </CardTitle>
            <Activity className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(processingRatio * 100).toFixed(1)}%
            </div>
            <Progress value={processingRatio * 100} className="mt-2" />
            {state.processingStats && (
              <p className="text-xs text-muted-foreground mt-2">
                {totalProcessed} processed, {totalUnprocessed} pending
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Cameras
            </CardTitle>
            <Camera className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Object.keys(state.overview?.violations_by_camera || {}).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cameras with violations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekday Pattern */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <CardTitle>Weekly Pattern</CardTitle>
            </div>
            <CardDescription>
              Violation distribution across weekdays
            </CardDescription>
          </CardHeader>
          <CardContent>
            {state.weekdayStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={state.weekdayStats}>
                  <defs>
                    <linearGradient
                      id="weekdayGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="weekday"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [value, "Violations"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#weekdayGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No weekday data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Violation Types */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-green-500" />
              <CardTitle>Violation Types</CardTitle>
            </div>
            <CardDescription>
              Breakdown of different violation categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            {violationTypeData.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={violationTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {violationTypeData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [value, "Violations"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Custom Legend */}
                <div className="grid grid-cols-1 gap-2">
                  {violationTypeData.map((entry, index) => (
                    <div
                      key={entry.name}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="flex-1">{entry.name}</span>
                      <span className="font-medium">
                        {entry.value.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">
                        (
                        {(
                          (entry.value /
                            violationTypeData.reduce(
                              (sum, item) => sum + item.value,
                              0
                            )) *
                          100
                        ).toFixed(1)}
                        %)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No violation type data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hourly Pattern & Camera Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Pattern */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <CardTitle>24-Hour Pattern</CardTitle>
            </div>
            <CardDescription>
              Violation frequency throughout the day
            </CardDescription>
          </CardHeader>
          <CardContent>
            {state.hourlyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={state.hourlyStats}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value}:00`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [value, "Violations"]}
                    labelFormatter={(label) => `${label}:00`}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "#f59e0b", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No hourly data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Cameras */}
        {cameraData.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-purple-500" />
                <CardTitle>Top Cameras</CardTitle>
              </div>
              <CardDescription>Most active camera locations</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cameraData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    width={120}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [value, "Violations"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
