"use client";

import { Alert } from "@/components/shared/ui/alert";
import { Button } from "@/components/shared/ui/button";
import { AlertTriangle } from "lucide-react";
import { TabHeader } from "@/components/shared/layout/tab-header/tab-header";

interface ErrorSectionProps {
  title?: string;
  description?: string;
  errorMessage?: string;
  onRetry?: () => void;
  forceReloadOnError?: boolean;
}

export function ErrorSection({
  title,
  description,
  errorMessage,
  onRetry,
  forceReloadOnError = false,
}: ErrorSectionProps) {
  const handleRetry = () => {
    if (forceReloadOnError) {
      window.location.reload();
    } else {
      onRetry?.();
    }
  };

  const resolvedTitle = title ?? "Something went wrong";
  const resolvedDescription =
    description ?? "Please try again or contact support.";
  const resolvedErrorMessage =
    errorMessage ?? "An unexpected error has occurred.";

  return (
    <div className="space-y-6">
      <TabHeader title={resolvedTitle} description={resolvedDescription} />

      <Alert
        variant="destructive"
        className="flex items-center justify-between gap-4 py-2 px-4 text-sm"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-destructive">{resolvedErrorMessage}</span>
        </div>
        <Button size="sm" variant="outline" onClick={handleRetry}>
          {forceReloadOnError ? "Reload" : "Try Again"}
        </Button>
      </Alert>
    </div>
  );
}
