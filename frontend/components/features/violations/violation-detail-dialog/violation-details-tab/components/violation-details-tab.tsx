"use client";

import { useViolationDetails } from "../hooks/use-violation-details";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shared/ui/card";
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
import {
  Eye,
  Edit2,
  Archive,
  CheckCircle2,
  XCircle,
  Info,
  Car,
  IdCard,
  CircleCheck,
  Target,
  Clock,
  Camera,
  MapPin,
  Shield,
  Save,
  X,
} from "lucide-react";
import type { Violation } from "@/lib/types/api/v1/violation";
import { formatTime } from "../../../utils";
import { DialogHeader } from "@/components/shared/layout/dialog-header/dialog-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/shared/ui/dropdown-menu";

import {
  STATUS_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
  VIOLATION_TYPE_OPTIONS,
} from "@/lib/constants/violations";

import { Can } from "@/components/shared/layout/can/can";
interface Props {
  violation: Violation;
  onViolationUpdate?: (violation: Violation) => void;
}

export function ViolationDetailsTab({ violation, onViolationUpdate }: Props) {
  const {
    action,
    isConfirming,
    isUpdating,
    editData,
    setEditData,
    errors,
    isValid,
    handleAction,
    handleCancel,
    handleConfirm,
  } = useViolationDetails(violation, onViolationUpdate);

  const timeFormatted = formatTime(violation.timestamp);

  const headerRight =
    violation.status !== "pending" ? (
      // Status Display - Non-editable
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-md border text-sm">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-muted-foreground">
            {STATUS_OPTIONS.find((opt) => opt.value === violation.status)
              ?.label ?? violation.status}{" "}
            – not editable
          </span>
        </div>
      </div>
    ) : isConfirming ? (
      // Confirmation Actions
      <div className="flex items-center gap-2 p-2 bg-background">
        <Button
          onClick={handleConfirm}
          size="sm"
          disabled={isUpdating || !isValid}
          className="gap-2 min-w-[100px]"
        >
          <Save className="h-4 w-4" />
          {isUpdating ? "Saving..." : "Confirm"}
        </Button>
        <Button
          onClick={handleCancel}
          size="sm"
          variant="outline"
          className="gap-2 bg-transparent"
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
      </div>
    ) : (
      // Actions Dropdown
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 min-w-[100px] hover:bg-muted/50 transition-colors bg-transparent"
          >
            <Eye className="h-4 w-4" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => handleAction("edit")}
            className="gap-2 cursor-pointer hover:bg-muted/50"
          >
            <Edit2 className="h-4 w-4 text-blue-500" />
            Edit Details
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => handleAction("approve")}
            className="gap-2 cursor-pointer hover:bg-green-50 focus:bg-green-50"
          >
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Approve
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleAction("reject")}
            className="gap-2 cursor-pointer hover:bg-yellow-50 focus:bg-yellow-50"
          >
            <XCircle className="h-4 w-4 text-yellow-600" />
            Reject
          </DropdownMenuItem>

          <Can permission="violation:archive">
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleAction("archive")}
              className="gap-2 cursor-pointer hover:bg-red-50 focus:bg-red-50 text-red-600"
            >
              <Archive className="h-4 w-4" />
              Archive
            </DropdownMenuItem>
          </Can>
        </DropdownMenuContent>
      </DropdownMenu>
    );

  const isEditing = action === "edit";

  return (
    <div className="space-y-6">
      <DialogHeader
        icon={<Info className="h-8 w-8 text-muted-foreground" />}
        title="Violation Details"
        description="Review and manage violation information"
        onRight={headerRight}
      />

      {isConfirming && (
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-semibold">
            Notes
          </Label>
          <Input
            id="notes"
            value={editData.notes || ""}
            onChange={(e) =>
              setEditData({ ...editData, notes: e.target.value })
            }
            placeholder="Enter notes (for version history)"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Car className="h-4 w-4" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* License Plate */}
            <div className="space-y-2">
              <Label>License Plate</Label>
              {isEditing ? (
                <>
                  <Input
                    value={editData.license_plate}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        license_plate: e.target.value,
                      })
                    }
                  />
                  {errors.license_plate && (
                    <p className="text-sm text-destructive">
                      {errors.license_plate}
                    </p>
                  )}
                </>
              ) : (
                <div className="p-3 bg-muted rounded-md border text-sm font-semibold">
                  <div className="flex gap-2 items-center">
                    <IdCard className="h-4 w-4 text-muted-foreground" />
                    {violation.license_plate || "Not detected"}
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Type */}
            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              {isEditing ? (
                <Select
                  value={editData.vehicle_type}
                  onValueChange={(value) =>
                    setEditData({ ...editData, vehicle_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPE_OPTIONS.filter(
                      (opt) => opt.value !== "all"
                    ).map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-3 bg-muted rounded-md border text-sm capitalize font-semibold">
                  <Car className="h-4 w-4 inline-block mr-2 text-muted-foreground" />
                  {VEHICLE_TYPE_OPTIONS.find(
                    (opt) => opt.value === violation.vehicle_type
                  )?.label || "Not specified"}
                </div>
              )}
            </div>

            {/* Violation Type */}
            <div className="space-y-2">
              <Label>Violation Type</Label>
              {isEditing ? (
                <Select
                  value={editData.violation_type}
                  onValueChange={(value) =>
                    setEditData({ ...editData, violation_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VIOLATION_TYPE_OPTIONS.filter(
                      (opt) => opt.value !== "all"
                    ).map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-3 bg-muted rounded-md border text-sm font-semibold">
                  <Info className="h-4 w-4 inline-block mr-2 text-muted-foreground" />
                  {VIOLATION_TYPE_OPTIONS.find(
                    (opt) => opt.value === violation.violation_type
                  )?.label || "Unknown"}
                </div>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="p-3 bg-muted rounded-md border text-sm font-semibold">
                <CircleCheck className="h-4 w-4 inline-block mr-2 text-muted-foreground" />
                {STATUS_OPTIONS.find((opt) => opt.value === violation.status)
                  ?.label ?? violation.status}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detection Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              Detection Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Time</Label>
              <div className="p-3 bg-muted rounded-md border text-sm font-semibold">
                <Clock className="h-4 w-4 inline-block mr-2 text-muted-foreground" />
                {timeFormatted.full}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Camera</Label>
              <div className="p-3 bg-muted rounded-md border text-sm font-semibold">
                <Camera className="h-4 w-4 inline-block mr-2 text-muted-foreground" />
                {violation.camera?.name || `Camera ${violation.camera_id}`}
              </div>
            </div>
            {violation.camera?.location && (
              <div className="space-y-2">
                <Label>Location</Label>
                <div className="p-3 bg-muted rounded-md border text-sm font-semibold">
                  <MapPin className="h-4 w-4 inline-block mr-2 text-muted-foreground" />
                  {violation.camera.location}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Confidence</Label>
              <div className="p-3 bg-muted rounded-md border text-sm font-semibold">
                <Shield className="h-4 w-4 inline-block mr-2 text-muted-foreground" />
                {violation.confidence != null
                  ? `${(violation.confidence * 100).toFixed(1)}%`
                  : "N/A"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
