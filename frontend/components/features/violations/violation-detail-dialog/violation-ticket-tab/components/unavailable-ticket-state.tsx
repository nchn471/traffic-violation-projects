"use client";

import { Lock, Receipt } from "lucide-react";
import { DialogHeader } from "@/components/shared/layout/dialog-header/dialog-header";

interface UnavailableTicketStateProps {
    status?: string | null;
  }

export function UnavailableTicketState({
  status,
}: UnavailableTicketStateProps) {
  return (
    <div className="space-y-6">
      {/* Section header */}
      <DialogHeader
        icon={<Receipt className="h-8 w-8 text-muted-foreground" />}
        title="Violation Ticket"
        description="View and manage the violation ticket"
      />

      {/* Locked state content */}
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 bg-muted rounded-full mb-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>

        <h3 className="text-lg font-medium mb-2">Ticket Unavailable</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Tickets can only be created and managed when the violation is{" "}
          <span className="font-semibold">approved</span>.
          <br />
          Current status:{" "}
          <span className="italic">{status ? status : "unknown"}</span>.
        </p>
      </div>
    </div>
  );
}
