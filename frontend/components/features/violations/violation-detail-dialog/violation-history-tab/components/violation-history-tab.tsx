"use client";

import { useState } from "react";
import { useViolationHistory } from "../hooks/use-violation-history";
import { detectChanges } from "../utils";

import {
  getViolationTypeDisplay,
  getVehicleTypeDisplay,
  getViolationStatusDisplay,
  formatTime,
  CopyableUUID,
  OfficerInfo,
} from "@/components/features/violations/utils";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shared/ui/card";
import { Button } from "@/components/shared/ui/button";
import { Badge } from "@/components/shared/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/shared/ui/collapsible";

import { LoadingState } from "./loading-state";
import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";
import { RotateCcw, ChevronRight, ChevronDown, History } from "lucide-react";
import { DialogHeader } from "@/components/shared/layout/dialog-header/dialog-header";
import { Can } from "@/components/shared/layout/can/can";
import type { Violation } from "@/lib/types/api/v1/violation";

interface Props {
  violation: Violation;
  onViolationUpdate?: (violation: Violation) => void;
}

export function ViolationHistoryTab({ violation, onViolationUpdate }: Props) {
  const {
    history,
    isLoading,
    error,
    isRollingBack,
    handleRollback,
  } = useViolationHistory(violation.id, onViolationUpdate);

  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newSet = new Set(expandedEntries);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setExpandedEntries(newSet);
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (history.length === 0) return <EmptyState />;

  return (
    <div className="space-y-6">
      <DialogHeader
        icon={<History className="h-8 w-8 text-muted-foreground" />}
        title="Violation History"
        description={`Track changes and modifications (${history.length} versions)`}
      />

      <div className="space-y-4">
        {history.map((entry) => {
          const isExpanded = expandedEntries.has(entry.id);
          const isCurrent = entry.id === violation.version_id;
          const canRollback = !isCurrent && entry.change_type !== "rollback";
          const sourceEntry = history.find((e) => e.id === entry.source_id);

          return (
            <Card
              key={entry.id}
              className={
                isCurrent ? "border-l-4 border-l-primary bg-primary/5" : ""
              }
            >
              <Collapsible
                open={isExpanded}
                onOpenChange={() => toggleExpanded(entry.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="capitalize text-base font-medium">
                              {entry.change_type}
                            </CardTitle>
                            {isCurrent && (
                              <Badge className="px-1.5 h-5 text-[10px] bg-primary text-primary-foreground">
                                Current
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground flex gap-3 mt-1">
                            <span>{formatTime(entry.updated_at).full}</span>
                            <OfficerInfo officer={entry.officer} />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {canRollback && (
                          <Can permission="violation:rollback">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRollback(entry.id);
                              }}
                              disabled={isRollingBack}
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              {isRollingBack ? "Rolling..." : "Rollback"}
                            </Button>
                          </Can>
                        )}
                        <CopyableUUID uuid={entry.id} label="Version ID" />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Violation Info */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm text-muted-foreground">
                            Violation Info
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                          <div>
                            <span>Type:</span>
                            <div className="text-foreground">
                              {getViolationTypeDisplay(entry.violation_type)}
                            </div>
                          </div>
                          <div>
                            <span>Vehicle:</span>
                            <div className="text-foreground">
                              {getVehicleTypeDisplay(entry.vehicle_type)}
                            </div>
                          </div>
                          <div>
                            <span>License:</span>
                            <div className="text-foreground">
                              {entry.license_plate || (
                                <span className="italic text-muted-foreground">
                                  Not detected
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <span>Confidence:</span>
                            <div className="text-foreground">
                              {entry.confidence
                                ? `${(entry.confidence * 100).toFixed(1)}%`
                                : "N/A"}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <span>Status:</span>
                            <div className="text-foreground">
                              {getViolationStatusDisplay(entry.status)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Detection Info */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm text-muted-foreground">
                            Detection Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-muted-foreground">
                          <div>
                            <span>Camera:</span>
                            <div className="text-foreground">
                              {entry.camera?.name ?? `Camera ${entry.camera_id}`}
                            </div>
                          </div>
                          {entry.camera?.location && (
                            <div>
                              <span>Location:</span>
                              <div className="text-foreground">
                                {entry.camera.location}
                              </div>
                            </div>
                          )}
                          <div>
                            <span>Detection Time:</span>
                            <div className="text-foreground">
                              {formatTime(entry.timestamp).full}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Changes from previous */}
                    {entry.source_id && sourceEntry && detectChanges(entry, sourceEntry) && (
                      <Card>
                        <CardHeader>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="font-medium">Changes from:</span>
                            <CopyableUUID uuid={entry.source_id} label="" />
                          </div>
                        </CardHeader>
                        <CardContent className="text-sm text-foreground space-y-1">
                          {detectChanges(entry, sourceEntry)}
                        </CardContent>
                      </Card>
                    )}

                    {/* Notes */}
                    {entry.notes && (
                      <Card>
                        <CardContent className="text-sm text-muted-foreground flex gap-2 py-3">
                          <span className="font-medium">Notes:</span>
                          <span className="text-foreground whitespace-pre-line">
                            {entry.notes}
                          </span>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
