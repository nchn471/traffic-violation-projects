"use client";

import { Badge } from "@/components/shared/ui/badge";
import { Copy, User } from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { useToast } from "@/components/shared/hooks/use-toast";
import type { Officer } from "@/lib/types/api/v1/officer";
import {
  STATUS_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
  VIOLATION_TYPE_OPTIONS,
} from "@/lib/constants/violations";

type Option = {
  value: string;
  label: string;
  variant: string;
};

const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1);

function renderBadge(options: Option[], value: string | null): JSX.Element {
  const opt = options.find((o) => o.value === value);
  return (
    <Badge variant={opt?.variant || "outline"}>
      {opt?.label || value || "Unknown"}
    </Badge>
  );
}

export const getStatusBadge = (value: string | null) =>
  renderBadge(STATUS_OPTIONS, value);

export const getVehicleTypeBadge = (value: string | null) =>
  renderBadge(VEHICLE_TYPE_OPTIONS, value);

export const getViolationTypeBadge = (value: string) =>
  renderBadge(VIOLATION_TYPE_OPTIONS, value);

export const getConfidenceColor = (confidence: number | null): string => {
  if (!confidence || confidence < 0 || confidence > 1) return "bg-muted";
  if (confidence >= 0.8) return "bg-green-500";
  if (confidence >= 0.6) return "bg-amber-500";
  return "bg-red-500";
};

export const getViolationTypeDisplay = (type: string): string => {
  if (!type) return "Not specified";
  const option = VIOLATION_TYPE_OPTIONS.find((o) => o.value === type);
  return option?.label ?? capitalize(type);
};

export const getVehicleTypeDisplay = (type: string | null): string => {
  if (!type) return "Not specified";
  const option = VEHICLE_TYPE_OPTIONS.find((o) => o.value === type);
  return option?.label ?? capitalize(type);
};

export const getViolationStatusDisplay = (type: string | null): string => {
  if (!type) return "Not specified";
  const option = STATUS_OPTIONS.find((o) => o.value === type);
  return option?.label ?? capitalize(type);
};

import { DateTime } from "luxon";

export function formatTime(timestamp: string) {
  const cleanTimestamp = timestamp.split(".")[0]; // Bỏ microseconds
  const dt = DateTime.fromISO(cleanTimestamp, { zone: "utc" }).setZone("Asia/Ho_Chi_Minh");

  if (!dt.isValid) {
    return {
      date: "Invalid",
      time: "Invalid",
      dateTime: "Invalid",
      full: "Invalid",
    };
  }

  const date = dt.toFormat("dd LLL yyyy");       // 01 Jul 2025
  const time = dt.toFormat("HH:mm");             // 14:35
  const dateTime = dt.toFormat("dd LLL yyyy, HH:mm");
  const full = `${date} at ${time}`;

  return { date, time, dateTime, full };
}

export function CopyableUUID({
  uuid,
  label,
  showCopy = true,
  showFull = false,
}: {
  uuid: string;
  label: string;
  showCopy?: boolean;
  showFull?: boolean;
}) {
  const { toast } = useToast();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(uuid);
      toast({ title: "Copied", description: `${label} copied to clipboard` });
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div
      className="flex items-center gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
        {showFull ? uuid : uuid.slice(0, 8)}
      </code>
      {showCopy && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleCopy}
          title={`Copy ${label}`}
        >
          <Copy className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

export function OfficerInfo({ officer }: { officer?: Officer }) {
  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground">
      <User className="h-3 w-3" />
      {officer ? (
        <>
          <span>{officer.name}</span>
          {officer.role && (
            <Badge className="text-xs border border-border text-muted-foreground bg-transparent">
              {officer.role}
            </Badge>
          )}
        </>
      ) : (
        <span className="italic">Unknown</span>
      )}
    </div>
  );
}
