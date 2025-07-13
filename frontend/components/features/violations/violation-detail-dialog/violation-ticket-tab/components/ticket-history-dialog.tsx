"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/shared/ui/dialog";
import { Card, CardHeader, CardContent } from "@/components/shared/ui/card";
import { Button } from "@/components/shared/ui/button";
import { DialogHeader } from "@/components/shared/layout/dialog-header/dialog-header";
import { History, Clock, User, Mail, FileText } from "lucide-react";
import {
  formatTime,
  CopyableUUID,
  OfficerInfo,
} from "@/components/features/violations/utils";
import type { TicketHistory } from "@/lib/types/api/v1/ticket";
import {formatCurrency} from "../utils"
interface Props {
  history: TicketHistory[];
  onFetch?: () => void;
}



export function TicketHistoryDialog({ history, onFetch }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={onFetch} variant="secondary">
          <History className="h-4 w-4 mr-2" />
          View History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader
          icon={<History className="h-8 w-8 text-muted-foreground" />}
          title="Ticket History"
          description={`${history.length} version${
            history.length > 1 ? "s" : ""
          }`}
        />
        <div className="space-y-3">
          {history.map((entry, index) => (
            <Card
              key={entry.id}
              className={index === 0 ? "border-l-4 border-l-blue-500" : ""}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {formatTime(entry.issued_at).full}
                  </div>
                  <CopyableUUID uuid={entry.id} label="" />
                </div>
                <OfficerInfo officer={entry.officer} />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Amount
                    </div>
                    <div className="font-medium">
                      {formatCurrency(entry.amount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Status
                    </div>
                    <div className="font-medium capitalize">{entry.status}</div>
                  </div>
                </div>

                {(entry.name || entry.email) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {entry.name && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Name
                        </div>
                        <div className="font-medium">{entry.name}</div>
                      </div>
                    )}
                    {entry.email && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          Email
                        </div>
                        <div className="font-medium">{entry.email}</div>
                      </div>
                    )}
                  </div>
                )}

                {entry.notes && (
                  <div className="border-t pt-3">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Notes
                    </div>
                    <div className="font-medium whitespace-pre-line">
                      {entry.notes}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
