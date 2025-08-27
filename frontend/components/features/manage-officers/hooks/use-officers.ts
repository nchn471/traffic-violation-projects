import { useEffect, useState } from "react";
import { useToast } from "@/components/shared/hooks/use-toast";
import {
  createOfficer,
  updateOfficer,
  deleteOfficer,
  listOfficers,
} from "@/lib/api/v1/officer";
import type {
  Officer,
  OfficerCreate,
  OfficerUpdate,
} from "@/lib/types/api/v1/officer";

export function useOfficers() {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetch = async () => {
    setIsLoading(true);
    const res = await listOfficers();
    if (res) {
      setOfficers(res);
    } else {
      toast({
        title: "Error",
        description: "Could not load officers",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleCreate = async (data: OfficerCreate) => {
    try {
      await createOfficer(data);
      toast({ title: "Created successfully" });
      await fetch();
      return true;
    } catch (err: any) {
      toast({ title: "Create failed", description: err.message, variant: "destructive" });
      return false;
    }
  };

  const handleUpdate = async (id: string, data: OfficerUpdate) => {
    try {
      await updateOfficer(id, data);
      toast({ title: "Updated successfully" });
      await fetch();
      return true;
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
      return false;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this officer?")) return;
    try {
      await deleteOfficer(id);
      toast({ title: "Deleted successfully" });
      await fetch();
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  return {
    officers,
    isLoading,
    handleCreate,
    handleUpdate,
    handleDelete,
    refresh: fetch,
  };
}
