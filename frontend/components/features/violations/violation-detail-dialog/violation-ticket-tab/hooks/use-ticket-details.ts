import { useEffect, useState } from "react";
import {
  createTicket,
  updateTicket,
  rollbackTicket,
  sendTicketEmail,
  markTicketPaid,
  getTicketPdf,
  getTicketHistory,
  getTicketByViolationId,
} from "@/lib/api/v1/tickets";

import { getViolation } from "@/lib/api/v1/violations";

import type {
  Ticket,
  TicketCreate,
  TicketUpdate,
  TicketHistory,
} from "@/lib/types/api/v1/ticket";
import {
  validateName,
  validateEmail,
  validateAmount,
} from "@/lib/validators/validators";

import type { Violation } from "@/lib/types/api/v1/violation";
import { useToast } from "@/components/shared/hooks/use-toast";

type Mode = "view" | "create" | "edit";

export function useTicketDetails(
  violationId: string,
  onViolationUpdate?: (v: Violation) => void
) {
  const { toast } = useToast();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [formData, setFormData] = useState<TicketCreate | TicketUpdate | null>(
    null
  );
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    amount?: string;
  }>({});
  const [history, setHistory] = useState<TicketHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<Mode>("view");

  const isCreating = mode === "create";
  const isEditing = mode === "edit";
  const isShowCreating = isCreating && !ticket;
  const isShowEditing = isEditing && !!ticket;

  // --- Helpers ---
  const getInitialFormData = (t?: Ticket): TicketCreate | TicketUpdate => ({
    violation_id: violationId,
    name: t?.name ?? "",
    email: t?.email ?? "",
    amount: t?.amount ?? 0,
    notes: t?.notes ?? "",
  });

  const validateAll = (data: TicketCreate | TicketUpdate) => {
    const newErrors = {
      name: validateName(data.name),
      email: validateEmail(data.email),
      amount: validateAmount(data.amount),
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((e) => !e);
  };

  useEffect(() => {
    if (formData) {
      validateAll(formData);
    }
  }, [formData]);

  useEffect(() => {
    const loadTicket = async () => {
      setIsLoading(true);
      try {
        const data = await getTicketByViolationId(violationId);
        setTicket(data);
        setFormData(getInitialFormData(data));
        setMode("view");
      } catch (err: any) {
        if (err.status === 404) {
          setTicket(null);
        } else {
          toast({
            title: "Error",
            description: "Failed to load ticket",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadTicket();
  }, [violationId]);

  // --- Create ---
  const handleCreateStart = () => {
    setFormData(getInitialFormData());
    setMode("create");
  };

  const handleCreateCancel = () => {
    setFormData(null);
    setErrors({});
    setMode("view");
  };

  const handleCreate = async () => {
    if (!formData || !validateAll(formData)) return;

    console.log("🚀 Submitting ticket create:", formData); // 👈 debug

    setIsSubmitting(true);
    try {
      const created = await createTicket(formData as TicketCreate);
      setTicket(created);
      toast({ title: "Success", description: "Ticket created successfully." });
      setMode("view");
    } catch (err: any) {
      console.error(
        "❌ Error while creating ticket:",
        err?.response?.data || err
      );
      toast({
        title: "Error",
        description: "Failed to create ticket",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Edit ---
  const handleEditStart = () => {
    if (!ticket) return;
    setFormData(getInitialFormData(ticket));
    setMode("edit");
  };

  const handleEditCancel = () => {
    setFormData(null);
    setErrors({});
    setMode("view");
  };

  const handleUpdate = async () => {
    if (!formData || !ticket || !validateAll(formData)) return;
    setIsSubmitting(true);
    try {
      const updated = await updateTicket(ticket.id, formData as TicketUpdate);
      setTicket(updated);
      toast({ title: "Success", description: "Ticket updated successfully." });
      setMode("view");
    } catch {
      toast({
        title: "Error",
        description: "Failed to update ticket",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Actions ---
  const handleSend = async () => {
    if (!ticket) return;
    setIsSubmitting(true);
    try {
      const updated = await sendTicketEmail(ticket.id);
      setTicket(updated);
      toast({ title: "Success", description: "Ticket sent successfully." });
    } catch {
      toast({
        title: "Error",
        description: "Failed to send ticket",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!ticket) return;
    setIsSubmitting(true);
    try {
      const updated = await markTicketPaid(ticket.id);
      setTicket(updated);

      const newViolation = await getViolation(violationId);
      console.log(newViolation)
      onViolationUpdate?.(newViolation);

      toast({ title: "Success", description: "Ticket marked as paid." });
    } catch {
      toast({
        title: "Error",
        description: "Failed to mark as paid",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRollback = async (versionId: string) => {
    if (!ticket) return;
    setIsSubmitting(true);
    try {
      const updated = await rollbackTicket(ticket.id, versionId);
      setTicket(updated);
      toast({ title: "Success", description: "Rolled back successfully." });
    } catch {
      toast({
        title: "Error",
        description: "Failed to rollback",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchTicketHistory = async () => {
    if (!ticket) return;
    try {
      const data = await getTicketHistory(ticket.id);
      setHistory(data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load history",
        variant: "destructive",
      });
    }
  };

  const fetchTicketPdf = async (): Promise<Blob | null> => {
    if (!ticket) return null;
    try {
      return await getTicketPdf(ticket.id);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch PDF",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    ticket,
    formData,
    setFormData,
    errors,
    isLoading,
    isSubmitting,
    isCreating,
    isEditing,
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
    handleRollback,
    fetchTicketHistory,
    fetchTicketPdf,
  };
}
