"use client";

import { FC } from "react";

export const TabLoading: FC<{ message?: string }> = ({ message = "Loading..." }) => {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};
