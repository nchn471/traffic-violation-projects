import { useEffect, useState } from "react";
import { getViolationHistory, rollbackViolation } from "@/lib/api/v1/violations";
import { useToast } from "@/components/shared/hooks/use-toast";
import type { Violation, ViolationHistory } from "@/lib/types/api/v1/violation";

export function useViolationHistory(violationId: string, onViolationUpdate?: (v: Violation) => void) {
  const [history, setHistory] = useState<ViolationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const data = await getViolationHistory(violationId);
        setHistory(data);
      } catch {
        setError("Failed to load violation history");
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [violationId]);

  const handleRollback = async (versionId: string) => {
    setIsRollingBack(true);
    try {
      const updated = await rollbackViolation(violationId, versionId);
      onViolationUpdate?.(updated);
      const refreshed = await getViolationHistory(violationId);
      setHistory(refreshed);
      toast({
        title: "Success",
        description: "Violation rolled back successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to rollback violation",
        variant: "destructive",
      });
    } finally {
      setIsRollingBack(false);
    }
  };

  return {
    history,
    isLoading,
    error,
    isRollingBack,
    handleRollback,
  };
}
