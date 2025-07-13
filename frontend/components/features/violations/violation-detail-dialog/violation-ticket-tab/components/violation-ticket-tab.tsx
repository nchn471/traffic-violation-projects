"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/shared/ui/card";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import {
  Receipt,
  Edit,
  Save,
  X,
  Send,
  DollarSign,
  FileDown,
  IdCard,
  CircleDollarSign,
  CircleCheck,
  Clock,
} from "lucide-react";

import { useState } from "react";
import { formatTime } from "@/components/features/violations/utils";
import { formatCurrency } from "../utils";
import { useTicketDetails } from "../hooks/use-ticket-details";
import { EmptyTicketState } from "./empty-ticket-state";
import { LoadingSkeleton } from "./loading-skeleton";
import { CreateTicketForm } from "./create-ticket-form";
import { UnavailableTicketState } from "./unavailable-ticket-state";
import { DialogHeader } from "@/components/shared/layout/dialog-header/dialog-header";
import type { Violation } from "@/lib/types/api/v1/violation";
import { TicketHistoryDialog } from "./ticket-history-dialog";

interface Props {
  violation: Violation;
  onViolationUpdate?: (violation: Violation) => void;
}

export function ViolationTicketTab({ violation, onViolationUpdate }: Props) {
  const {
    ticket,
    formData,
    setFormData,
    errors,
    isLoading,
    isSubmitting,
    isCreating,
    isShowCreating,
    isShowEditing,
    history,
    handleCreateStart,
    handleCreateCancel,
    handleCreate,
    handleEditStart,
    handleEditCancel,
    handleUpdate,
    handleSend,
    handleMarkPaid,
    fetchTicketHistory,
    fetchTicketPdf,
  } = useTicketDetails(violation.id, onViolationUpdate);

  if (isLoading) return <LoadingSkeleton />;

  if (violation.status !== "approved") {
    return <UnavailableTicketState status={violation.status} />;
  }

  if (!ticket && isShowCreating) {
    if (!formData) return null;
    return (
      <CreateTicketForm
        createData={formData}
        setCreateData={setFormData}
        onSubmit={handleCreate}
        onCancel={handleCreateCancel}
        isSubmitting={isSubmitting}
        validatorError={errors}
      />
    );
  }

  if (!ticket) {
    return (
      <EmptyTicketState
        onCreateTicket={handleCreateStart}
        isCreatingForm={isCreating}
      />
    );
  }

  const updateFormField = <K extends keyof typeof formData>(
    key: K,
    value: (typeof formData)[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const renderEditableField = (
    label: string,
    key: keyof typeof formData,
    type: "text" | "number" = "text",
    icon?: React.ReactNode
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      {isShowEditing ? (
        <>
          <Input
            type={type}
            value={formData?.[key] ?? ""}
            onChange={(e) =>
              updateFormField(
                key,
                type === "number" ? Number(e.target.value) : e.target.value
              )
            }
          />
          {errors[key] && (
            <p className="text-sm text-destructive">{errors[key]}</p>
          )}
        </>
      ) : (
        <div className="p-3 bg-muted rounded-md border text-sm font-semibold flex items-center gap-2">
          {icon}
          {key === "amount"
            ? formatCurrency(formData?.[key] ?? 0)
            : formData?.[key] || (
                <span className="italic text-muted-foreground">
                  Not provided
                </span>
              )}
        </div>
      )}
    </div>
  );

  const onRight =
    isShowEditing && ticket.status === "draft" ? (
      <div className="flex gap-2">
        <Button onClick={handleUpdate} disabled={isSubmitting} size="sm">
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
        <Button onClick={handleEditCancel} variant="outline" size="sm">
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    ) : ticket.status === "draft" ? (
      <Button onClick={handleEditStart} variant="outline" size="sm">
        <Edit className="h-4 w-4 mr-2" />
        Edit
      </Button>
    ) : (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-md border text-sm">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-muted-foreground">
            {ticket.status} – not editable
          </span>
        </div>
      </div>
    );

  const handleDownloadPdf = async () => {
    const blob = await fetchTicketPdf();
    if (!blob) return;

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ticket_${ticket.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <DialogHeader
        icon={<Receipt className="h-8 w-8 text-muted-foreground" />}
        title="Violation Ticket"
        description="View and manage the violation ticket"
        onRight={onRight}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4" />
              Ticket Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderEditableField(
              "Fine Amount *",
              "amount",
              "number",
              <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
            )}

            <div className="space-y-2">
              <Label>Issued At</Label>
              <div className="p-3 bg-muted rounded-md border text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {formatTime(ticket.issued_at).dateTime}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="p-3 bg-muted rounded-md border text-sm font-semibold flex items-center gap-2 capitalize">
                <CircleCheck className="h-4 w-4 text-muted-foreground" />
                {ticket.status}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IdCard className="h-4 w-4" />
              Recipient Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderEditableField(
              "Name *",
              "name",
              "text",
              <IdCard className="h-4 w-4 text-muted-foreground" />
            )}

            {renderEditableField(
              "Email *",
              "email",
              "text",
              <Send className="h-4 w-4 text-muted-foreground" />
            )}

            {renderEditableField(
              "Notes",
              "notes",
              "text",
              <FileDown className="h-4 w-4 text-muted-foreground" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={handleSend} disabled={ticket.status !== "draft"}>
            <Send className="h-4 w-4 mr-2" />
            Send Ticket
          </Button>

          <Button
            onClick={handleMarkPaid}
            disabled={ticket.status !== "sent"}
            variant="outline"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Mark as Paid
          </Button>

          <TicketHistoryDialog history={history} onFetch={fetchTicketHistory} />

          <Button onClick={handleDownloadPdf} variant="secondary">
            <FileDown className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
