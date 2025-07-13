"use client";

import { Button } from "@/components/shared/ui/button";
import { Receipt, Plus } from "lucide-react";
import { DialogHeader } from "@/components/shared/layout/dialog-header/dialog-header";

interface EmptyTicketStateProps {
  onCreateTicket: () => void;
  isCreatingForm: boolean;
}

export function EmptyTicketState({
  onCreateTicket,
  isCreatingForm,
}: EmptyTicketStateProps) {
  return (
    <div className="space-y-6">
      {/* Section header */}
      <DialogHeader
        icon={<Receipt className="h-8 w-8 text-muted-foreground" />}
        title="Violation Ticket"
        description="View and manage the violation ticket"
      />

      {/* Empty state content */}
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 bg-muted rounded-full mb-4">
          <Receipt className="h-8 w-8 text-muted-foreground" />
        </div>

        <h3 className="text-lg font-medium mb-2">No Ticket Created</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Create a traffic ticket for this violation to issue a fine and manage
          payment.
        </p>

        <Button onClick={onCreateTicket} disabled={isCreatingForm}>
          <Plus className="h-4 w-4 mr-2" />
          {isCreatingForm ? "Opening..." : "Create Ticket"}
        </Button>
      </div>
    </div>
  );
}
