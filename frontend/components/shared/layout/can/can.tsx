import { ReactNode } from "react";
import { hasPermission, Permission } from "@/lib/rbac";
import { useAuth } from "@/components/shared/hooks/use_auth";

interface CanProps {
  permission: Permission;
  children?: ReactNode;
}

export function Can({ permission, children }: CanProps) {
  const { user } = useAuth();

  if (!user || !hasPermission(user.role, permission)) {
    return null;
  }

  return <>{children}</>;
}
