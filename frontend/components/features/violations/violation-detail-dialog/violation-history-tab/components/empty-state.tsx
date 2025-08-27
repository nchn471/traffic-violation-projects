"use client";

import { History } from "lucide-react";
import { DialogHeader } from "@/components/shared/layout/dialog-header/dialog-header";
// Empty state
export function EmptyState() {
  return (
    <div className="space-y-6">
      <DialogHeader
        icon={<History className="h-8 w-8 text-muted-foreground" />}
        title="Violation History"
        description={`Track changes and modifications (${history.length} versions)`}
      />
      <div className="text-center py-8 text-muted-foreground">
        <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-foreground">
          No History Available
        </h3>
        <p className="text-sm">This violation has no recorded changes.</p>
      </div>
    </div>
  );
}
