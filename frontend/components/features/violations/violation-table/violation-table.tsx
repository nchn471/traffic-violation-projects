"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/shared/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shared/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shared/ui/card";
import { Skeleton } from "@/components/shared/ui/skeleton";

import { ViolationDetailDialog } from "../violation-detail-dialog";
import {
  CopyableUUID,
  getViolationTypeBadge,
  getStatusBadge,
  formatTime,
  getConfidenceColor,
} from "../utils";

import type { Violation } from "@/lib/types/api/v1/violation";

interface Props {
  violations: Violation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onViolationUpdate?: (violation: Violation) => void;
}

export function ViolationTable({
  violations,
  pagination,
  isLoading,
  onPageChange,
  onViolationUpdate,
}: Props) {
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleViewViolation = (violation: Violation) => {
    setSelectedViolation(violation);
    setIsDialogOpen(true);
  };

  const handleViolationUpdate = (updated: Violation) => {
    console.log("Handle Violation Update",updated)
    setSelectedViolation(updated);
    onViolationUpdate?.(updated);
  };

  const goToPage = (page: number) => {
    onPageChange(Math.max(1, Math.min(page, pagination.totalPages)));
  };

  const renderLoading = () => (
    <Card>
      <CardHeader>
        <CardTitle>Loading Violations...</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderEmpty = () => (
    <Card>
      <CardContent className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <h3 className="text-lg font-medium text-foreground">No violations found</h3>
        <p className="text-sm">Try adjusting your search or filters</p>
      </CardContent>
    </Card>
  );

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    const getPages = () => {
      const range: number[] = [];
      const shown = 5;
      let start = Math.max(1, pagination.page - Math.floor(shown / 2));
      let end = Math.min(pagination.totalPages, start + shown - 1);
      if (end - start + 1 < shown) start = Math.max(1, end - shown + 1);
      for (let i = start; i <= end; i++) range.push(i);
      return range;
    };

    const startIdx = (pagination.page - 1) * pagination.limit + 1;
    const endIdx = Math.min(pagination.page * pagination.limit, pagination.total);
    return (
      <div className="flex items-center justify-between px-2 py-4 border-t">
        <div className="text-sm text-muted-foreground">
          Showing {startIdx} to {endIdx} of {pagination.total} results
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => goToPage(1)} disabled={pagination.page === 1 || isLoading} className="h-8 w-8 p-0">
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => goToPage(pagination.page - 1)} disabled={pagination.page === 1 || isLoading} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {getPages().map((p) => (
            <Button
              key={p}
              size="sm"
              variant={pagination.page === p ? "default" : "outline"}
              onClick={() => goToPage(p)}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              {p}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={() => goToPage(pagination.page + 1)} disabled={pagination.page === pagination.totalPages || isLoading} className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => goToPage(pagination.totalPages)} disabled={pagination.page === pagination.totalPages || isLoading} className="h-8 w-8 p-0">
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Page {pagination.page} of {pagination.totalPages}
        </div>
      </div>
    );
  };

  if (isLoading) return renderLoading();

  return (
    <>
      <Card>
        <CardContent className="p-0">
          {violations.length === 0 ? (
            renderEmpty()
          ) : (
            <>
              <div className="overflow-auto rounded-t-lg rounded-b-none">
                <Table className="w-full table-auto">
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>License Plate</TableHead>
                      <TableHead>Violation</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Camera</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {violations.map((v) => {
                      const time = formatTime(v.timestamp);
                      return (
                        <TableRow
                          key={v.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleViewViolation(v)}
                        >
                          <TableCell>
                            <CopyableUUID uuid={v.id} label="Violation ID" />
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm font-medium">{time.date}</div>
                              <div className="text-xs text-muted-foreground">{time.time}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm truncate">
                            {v.license_plate || (
                              <span className="italic text-muted-foreground">Not detected</span>
                            )}
                          </TableCell>
                          <TableCell>{getViolationTypeBadge(v.violation_type)}</TableCell>
                          <TableCell className="capitalize">
                            {v.vehicle_type || (
                              <span className="italic text-muted-foreground">Unknown</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 truncate">
                              <div className="text-sm font-medium truncate">
                                {v.camera?.name || `Camera ${v.camera_id}`}
                              </div>
                              {v.camera?.location && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {v.camera.location}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {v.confidence ? (
                              <div className="space-y-1">
                                <div className="text-sm font-medium whitespace-nowrap">
                                  {(v.confidence * 100).toFixed(1)}%
                                </div>
                                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${getConfidenceColor(v.confidence)}`}
                                    style={{ width: `${v.confidence * 100}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(v.status)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {renderPagination()}
            </>
          )}
        </CardContent>
      </Card>

      <ViolationDetailDialog
        violation={selectedViolation}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onViolationUpdate={handleViolationUpdate}
      />
    </>
  );
}
