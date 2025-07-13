import { useEffect, useState } from "react";
import {
  updateViolation,
  archiveViolation,
  approveViolation,
  rejectViolation,
} from "@/lib/api/v1/violations";
import { getTicketByViolationId, archiveTicket } from "@/lib/api/v1/tickets";
import { useToast } from "@/components/shared/hooks/use-toast";
import type { Violation } from "@/lib/types/api/v1/violation";
import { validateLicensePlate } from "@/lib/validators/validators";

export function useViolationDetails(
  violation: Violation,
  onUpdate?: (v: Violation) => void
) {
  const [action, setAction] = useState<
    "edit" | "archive" | "approve" | "reject" | null
  >(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const isConfirming = action !== null;

  const [editData, setEditData] = useState({
    license_plate: violation.license_plate || "",
    vehicle_type: violation.vehicle_type || "",
    violation_type: violation.violation_type,
    status: violation.status || "pending",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string | null>>({
    license_plate: null,
  });

  const isValid = Object.values(errors).every((e) => !e);

  const validateAll = () => {
    const newErrors = {
      license_plate: validateLicensePlate(editData.license_plate),
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((e) => !e);
  };

  useEffect(() => {
    validateAll();
  }, [editData.license_plate]);

  const handleAction = (type: typeof action) => {
    setAction(type);
  };

  const handleCancel = () => {
    setAction(null);
    setEditData({
      license_plate: violation.license_plate || "",
      vehicle_type: violation.vehicle_type || "",
      violation_type: violation.violation_type,
      status: violation.status || "pending",
      notes: "",
    });
    setErrors({ license_plate: null });
  };

  const handleConfirm = async () => {
    const currentAction = action; 
    if (!currentAction) return;
    if (currentAction == "edit" && !validateAll()) return;

    setIsUpdating(true);
    try {
      let updated: Violation | null = null;

      if (action === "edit") {
        updated = await updateViolation(violation.id, editData);
      } else if (action === "archive") {
        updated = await archiveViolation(violation.id, editData.notes);
        try {
          const ticket = await getTicketByViolationId(violation.id);
          if (ticket) {
            await archiveTicket(ticket.id);
          }
        } catch (err) {
          console.warn("No ticket found or failed to archive ticket:", err);
        }
      } else if (action === "approve") {
        updated = await approveViolation(violation.id, editData.notes);
      } else if (action === "reject") {
        updated = await rejectViolation(violation.id, editData.notes);
      }

      if (updated) {
        onUpdate?.(updated);
        toast({
          title: "Success",
          description: `Violation ${action}d successfully.`,
        });
      }

      setAction(null);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} the violation.`,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    action,
    isUpdating,
    isConfirming,
    editData,
    setEditData,
    errors,
    isValid,
    handleAction,
    handleCancel,
    handleConfirm,
  };
}
