"use client";

import type { Violation, ViolationHistory } from "@/lib/types/api/v1/violation";
import { ReactElement } from "react";

export function detectChanges(
  entry: Violation,
  sourceEntry?: ViolationHistory
): ReactElement | null {
  if (!sourceEntry) return null;

  const fieldsToCompare: Record<
    keyof Pick<
      Violation,
      "vehicle_type" | "violation_type" | "license_plate" | "confidence" | "status"
    >,
    string
  > = {
    vehicle_type: "Vehicle Type",
    violation_type: "Violation Type",
    license_plate: "License Plate",
    confidence: "Confidence",
    status: "Status",
  };

  const normalize = (val: any) =>
    val === null || val === undefined ? "" : String(val).trim();

  const changes = Object.entries(fieldsToCompare).flatMap(([key, label]) => {
    const oldValue = sourceEntry[key];
    const newValue = entry[key as keyof Violation];

    if (normalize(oldValue) !== normalize(newValue)) {
      return [
        <div key={key} className="text-sm">
          <span className="font-medium">{label}:</span>{" "}
          <span className="line-through text-muted-foreground">
            {normalize(oldValue) || "-"}
          </span>{" "}
          <span className="mx-1">→</span>{" "}
          <span className="text-foreground">{normalize(newValue) || "-"}</span>
        </div>,
      ];
    }

    return [];
  });

  if (changes.length === 0) {
    return null;
  }

  return <div className="space-y-1">{changes}</div>;
}
