"use client";

import { History, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/shared/ui/alert";
import { DialogHeader } from "@/components/shared/layout/dialog-header/dialog-header";

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="space-y-6">
      <DialogHeader
        icon={<History className="h-8 w-8 text-muted-foreground" />}
        title="Violation History"
        description={`Track changes and modifications (${history.length} versions)`}
      />
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </div>
  );
}
