import { useEffect, useState } from "react";
import {
  createTicket,
  updateTicket,
  sendTicketEmail,
  markTicketPaid,
  getTicketByViolationId,
  archiveTicket,
} from "@/lib/api/v1/tickets";
import type {
  Ticket,
  TicketUpdate,
  TicketCreate,
} from "@/lib/types/api/v1/ticket";
import { useToast } from "@/components/shared/hooks/use-toast";

export function useTicketDetails(violationId: string) {
  const { toast } = useToast();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [editData, setEditData] = useState<TicketUpdate | null>(null);
  const [createData, setCreateData] = useState<TicketCreate | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isShowEditing, setIsShowEditing] = useState(false);
  const [isShowCreating, setIsShowCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTicket() {
      setIsLoading(true);
      try {
        const data = await getTicketByViolationId(violationId);
        setTicket(data);
        setEditData({
          amount: data.amount,
          name: data.name ?? "",
          email: data.email ?? "",
          notes: data.notes ?? "",
        });
        setError(null);
      } catch (err: any) {
        if (err.status === 404) {
          setTicket(null);
          setEditData(null);
          setError(null);
        } else {
          setError("Failed to load ticket information");
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchTicket();
  }, [violationId]);

  const handleCreateStart = () => {
    setCreateData({
      violation_id: violationId,
      amount: 100,
      name: "",
      email: "nchn.work@gmail.com",
      notes: "",
    });
    setIsShowCreating(true);
  };

  const handleCreateCancel = () => {
    setCreateData(null);
    setIsShowCreating(false);
  };

  const handleCreate = async () => {
    if (!createData) return;
    setIsCreating(true);
    try {
      const newTicket = await createTicket(createData);
      setTicket(newTicket);
      setEditData({
        amount: newTicket.amount,
        name: newTicket.name,
        email: newTicket.email,
        notes: newTicket.notes,
      });
      toast({
        title: "Success",
        description: "Ticket created successfully.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to create ticket.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
      setIsShowCreating(false);
      setCreateData(null);
    }
  };

  const handleUpdate = async () => {
    if (!ticket || !editData) return;
    setIsEditing(true);
    try {
      const updated = await updateTicket(ticket.id, editData);
      setTicket(updated);
      setEditData({
        amount: updated.amount,
        name: updated.name ?? "",
        email: updated.email ?? "",
        notes: updated.notes ?? "",
      });
      toast({
        title: "Success",
        description: "Ticket updated successfully.",
      });
      setIsShowEditing(false);
    } catch {
      toast({
        title: "Error",
        description: "Failed to update ticket.",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleSend = async () => {
    if (!ticket) return;
    setIsEditing(true);
    try {
      const updated = await sendTicketEmail(ticket.id);
      setTicket(updated);
      toast({
        title: "Success",
        description: "Ticket sent via email.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to send ticket.",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!ticket) return;
    setIsEditing(true);
    try {
      const updated = await markTicketPaid(ticket.id);
      setTicket(updated);
      toast({
        title: "Success",
        description: "Ticket marked as paid.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to mark ticket as paid.",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleArchive = async () => {
    if (!ticket) return;
    setIsEditing(true);
    try {
      const updated = await archiveTicket(ticket.id);
      setTicket(updated);
      toast({
        title: "Success",
        description: "Ticket archived.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to archive ticket.",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleEdit = () => setIsShowEditing(true);

  const handleCancel = () => {
    if (!ticket) return;
    setIsShowEditing(false);
    setEditData({
      amount: ticket.amount,
      name: ticket.name ?? "",
      email: ticket.email ?? "",
      notes: ticket.notes ?? "",
    });
  };

  return {
    ticket,
    editData,
    setEditData,
    createData,
    setCreateData,
    isLoading,
    isCreating,
    isEditing,
    isShowCreating,
    isShowEditing,
    error,
    handleCreateStart,
    handleCreateCancel,
    handleCreate,
    handleUpdate,
    handleEdit,
    handleCancel,
    handleSend,
    handleMarkPaid,
    handleArchive,
  };
}
