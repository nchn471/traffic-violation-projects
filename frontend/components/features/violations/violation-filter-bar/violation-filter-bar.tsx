"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shared/ui/select";
import { Card, CardContent } from "@/components/shared/ui/card";
import { Search, Filter, X, Calendar } from "lucide-react";

import type { GetViolationsParams } from "@/lib/types/api/v1/violation";
import type { ViolationFilterState } from "@/components/features/violations/violation-list-tab/types/violation-filter-state";
import type { Camera } from "@/lib/types/api/v1/camera";

import {
  STATUS_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
  VIOLATION_TYPE_OPTIONS,
} from "@/lib/constants/violations";

interface Props {
  onFiltersChange: (filters: GetViolationsParams) => void;
  isLoading?: boolean;
  cameras: Camera[];
}

export function ViolationFilterBar({
  onFiltersChange,
  isLoading,
  cameras,
}: Props) {
  const [filters, setFilters] = useState<ViolationFilterState>({
    search: "",
    status: "all",
    violation_type: "all",
    camera_id: "all",
    vehicle_type: "all",
    confidence_min: "",
    confidence_max: "",
    timestamp_from: "",
    timestamp_to: "",
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  // ✅ Debounce filters
  useEffect(() => {
    const timeout = setTimeout(() => {
      const apiFilters: GetViolationsParams = {
        search: filters.search || undefined,
        status: filters.status !== "all" ? filters.status : undefined,
        violation_type:
          filters.violation_type !== "all" ? filters.violation_type : undefined,
        camera_id: filters.camera_id !== "all" ? filters.camera_id : undefined,
        vehicle_type:
          filters.vehicle_type !== "all" ? filters.vehicle_type : undefined,
        confidence_min: filters.confidence_min
          ? parseFloat(filters.confidence_min) / 100
          : undefined,
        confidence_max: filters.confidence_max
          ? parseFloat(filters.confidence_max) / 100
          : undefined,
        timestamp_from: filters.timestamp_from || undefined,
        timestamp_to: filters.timestamp_to || undefined,
      };
      onFiltersChange(apiFilters);
    }, 400);

    return () => clearTimeout(timeout);
  }, [filters]);

  const handleFilterChange = (
    key: keyof ViolationFilterState,
    value: string
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    const reset: ViolationFilterState = {
      search: "",
      status: "all",
      violation_type: "all",
      camera_id: "all",
      vehicle_type: "all",
      confidence_min: "",
      confidence_max: "",
      timestamp_from: "",
      timestamp_to: "",
    };
    setFilters(reset);
  };

  const hasActiveFilters = Object.values(filters).some(
    (val) => val && val !== "all"
  );

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6 space-y-4">
        {/* Main Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ID, license plate, camera..."
                className="pl-10 h-10"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filters.status}
              onValueChange={(v) => handleFilterChange("status", v)}
            >
              <SelectTrigger className="h-10" disabled={isLoading}>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Violation Type</Label>
            <Select
              value={filters.violation_type}
              onValueChange={(v) => handleFilterChange("violation_type", v)}
            >
              <SelectTrigger className="h-10" disabled={isLoading}>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                {VIOLATION_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Camera</Label>
            <Select
              value={filters.camera_id}
              onValueChange={(v) => handleFilterChange("camera_id", v)}
            >
              <SelectTrigger className="h-10" disabled={isLoading}>
                <SelectValue placeholder="All cameras" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cameras</SelectItem>
                {cameras.map((camera) => (
                  <SelectItem key={camera.id} value={camera.id}>
                    {camera.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Toggle and Reset */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showAdvanced ? "Hide" : "Show"} Advanced Filters
          </Button>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              <Select
                value={filters.vehicle_type}
                onValueChange={(v) => handleFilterChange("vehicle_type", v)}
              >
                <SelectTrigger className="h-10" disabled={isLoading}>
                  <SelectValue placeholder="All vehicles" />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Min Confidence (%)</Label>
              <Input
                type="number"
                placeholder="1"
                min={1}
                max={100}
                value={filters.confidence_min}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "")
                    return handleFilterChange("confidence_min", "");
                  const num = parseInt(val);
                  if (!isNaN(num) && num >= 1 && num <= 100) {
                    handleFilterChange("confidence_min", val);
                  }
                }}
                className="h-10"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>Max Confidence (%)</Label>
              <Input
                type="number"
                placeholder="100"
                min={1}
                max={100}
                value={filters.confidence_max}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "")
                    return handleFilterChange("confidence_max", "");
                  const num = parseInt(val);
                  if (!isNaN(num) && num >= 1 && num <= 100) {
                    handleFilterChange("confidence_max", val);
                  }
                }}
                className="h-10"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>From Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="datetime-local"
                  className="pl-10 h-10"
                  value={filters.timestamp_from}
                  onChange={(e) =>
                    handleFilterChange("timestamp_from", e.target.value)
                  }
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>To Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="datetime-local"
                  className="pl-10 h-10"
                  value={filters.timestamp_to}
                  onChange={(e) =>
                    handleFilterChange("timestamp_to", e.target.value)
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
