"use client";

import { History } from "lucide-react";
import { Skeleton } from "@/components/shared/ui/skeleton";
import { DialogHeader } from "@/components/shared/layout/dialog-header/dialog-header";

// Loading state
export function LoadingState() {
  return (
    <div className="space-y-6">
      <DialogHeader
        icon={<History className="h-8 w-8 text-muted-foreground" />}
        title="Violation History"
        description={`Track changes and modifications (${history.length} versions)`}
      />

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
