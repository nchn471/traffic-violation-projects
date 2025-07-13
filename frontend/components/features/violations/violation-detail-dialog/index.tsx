"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/shared/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shared/ui/tabs";
import { AlertTriangle, FileText, ImageIcon, History } from "lucide-react";

import type { Violation } from "@/lib/types/api/v1/violation";

import { ViolationDetailsTab } from "./violation-details-tab/components/violation-details-tab";
import { ViolationImagesTab } from "./violation-images-tab/violation-images-tab";
import { ViolationTicketTab } from "./violation-ticket-tab/components/violation-ticket-tab";
import { ViolationHistoryTab } from "./violation-history-tab/components/violation-history-tab";

import { CopyableUUID } from "@/components/features/violations/utils";

interface Props {
  violation: Violation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViolationUpdate?: (violation: Violation) => void;
}

export function ViolationDetailDialog({
  violation,
  open,
  onOpenChange,
  onViolationUpdate,
}: Props) {
  if (!violation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-background border-border p-0">
        <Tabs defaultValue="details" className="flex-1">
          <DialogHeader className="border-b border-border px-6 py-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-foreground">
                Violation Details
              </h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Violation ID:</span>
                <CopyableUUID uuid={violation.id} label="" showCopy />
              </div>
            </div>
            <TabsList className="grid w-full grid-cols-4 bg-muted/30">
              <TabsTrigger
                value="details"
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Details</span>
              </TabsTrigger>
              <TabsTrigger
                value="images"
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Evidence</span>
              </TabsTrigger>
              <TabsTrigger
                value="ticket"
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">Ticket</span>
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
              </TabsTrigger>
            </TabsList>
          </DialogHeader>

          <div className="mt-2 max-h-[calc(90vh-180px)] overflow-y-auto custom-scrollbar">
            <TabsContent value="details" className="mt-0">
              <div className="px-6 pb-6">
                <ViolationDetailsTab
                  violation={violation}
                  onViolationUpdate={onViolationUpdate}
                />
              </div>
            </TabsContent>

            <TabsContent value="images" className="mt-0">
              <div className="px-6 pb-6">
                <ViolationImagesTab violation={violation} />
              </div>
            </TabsContent>

            <TabsContent value="ticket" className="mt-0">
              <div className="px-6 pb-6">
                <ViolationTicketTab
                  violation={violation}
                  onViolationUpdate={onViolationUpdate}
                />
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <div className="px-6 pb-6">
                <ViolationHistoryTab
                  violation={violation}
                  onViolationUpdate={onViolationUpdate}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Custom Scrollbar */}
        <style jsx global>{`
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: transparent transparent;
          }

          .custom-scrollbar::-webkit-scrollbar {
            width: 3px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: transparent;
            border-radius: 2px;
          }

          .custom-scrollbar:hover::-webkit-scrollbar-thumb {
            background-color: hsl(var(--muted-foreground) / 0.15);
          }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: hsl(var(--muted-foreground) / 0.25);
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
