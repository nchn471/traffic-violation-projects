"use client";

import { Card, CardContent } from "@/components/shared/ui/card";
import { Label } from "@/components/shared/ui/label";
import { Input } from "@/components/shared/ui/input";
import { Textarea } from "@/components/shared/ui/textarea";
import { Button } from "@/components/shared/ui/button";
import { Save, X, Receipt } from "lucide-react";
import { DialogHeader } from "@/components/shared/layout/dialog-header/dialog-header";
import type { TicketCreate } from "@/lib/types/api/v1/ticket";

interface Props {
  createData: TicketCreate;
  setCreateData: React.Dispatch<React.SetStateAction<TicketCreate>>;
  isSubmitting: boolean;
  validatorError: {
    name?: string;
    email?: string;
    amount?: string;
  };
  onSubmit: () => void;
  onCancel: () => void;
}

export function CreateTicketForm({
  createData,
  setCreateData,
  isSubmitting,
  validatorError,
  onSubmit,
  onCancel,
}: Props) {
  const handleChange = (key: keyof TicketCreate, value: string | number) => {
    setCreateData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <DialogHeader
        icon={<Receipt className="h-8 w-8 text-muted-foreground" />}
        title="Violation Ticket"
        description="Issue a new fine for the approved violation"
      />

      <Card className="mt-4">
        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Fine Amount *" error={validatorError.amount}>
              <Input
                type="number"
                min={0}
                value={createData.amount}
                onChange={(e) => handleChange("amount", Number(e.target.value))}
                required
              />
            </FormField>

            <FormField label="Violator Name *" error={validatorError.name}>
              <Input
                value={createData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </FormField>

            <FormField label="Email *" error={validatorError.email}>
              <Input
                type="email"
                value={createData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
              />
            </FormField>

            <FormField label="Notes">
              <Input
                value={createData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
              />
            </FormField>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button onClick={onSubmit} disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? "Creating..." : "Create Ticket"}
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
