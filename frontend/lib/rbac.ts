// lib/rbac.ts

export type Role = "admin" | "officer";

export type Permission =
  | "violation:rollback"
  | "violation:archive"
  | "ticket:rollback"
  | "ticket:archive"
  | "officer:list"
  | "officer:create"
  | "officer:edit"
  | "officer:delete"
  | "officer:view";

export const rolePermissions: Record<"admin", Permission[]> = {
  admin: [
    "violation:rollback",
    "violation:archive",
    "ticket:rollback",
    "ticket:archive",
    "officer:list",
    "officer:create",
    "officer:edit",
    "officer:delete",
    "officer:view"
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  if (role === "admin") return true;
  return role === "officer" && !rolePermissions.admin.includes(permission);
}
