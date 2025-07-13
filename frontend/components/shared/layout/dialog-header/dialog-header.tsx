"use client";

import { ReactNode } from "react";

interface DialogHeaderProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  onRight?: ReactNode;
}

export function DialogHeader({
  icon,
  title,
  description,
  onRight,
}: DialogHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-3">
        {icon && <div className="p-2 bg-muted rounded-lg">{icon}</div>}
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>

      {/* Right side: Custom content */}
      <div className="ml-auto flex items-center gap-2">{onRight}</div>
    </div>
  );
}

