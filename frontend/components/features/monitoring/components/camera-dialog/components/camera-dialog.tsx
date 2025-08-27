"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/shared/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shared/ui/tabs";
import { Eye, Settings } from "lucide-react";
import type { Camera } from "@/lib/types/api/v1/camera";
import { CameraLiveViewTab } from "./live-view-tab/camera-live-view-tab";
import { CameraConfigurationTab } from "./config-tab/camera-config-tab";
import { useCameraDialog } from "../hooks/use-camera-dialog";

interface CameraDialogProps {
  camera: Camera;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCameraUpdate?: (camera: Camera) => void;
}

export function CameraDialog({
  camera,
  open,
  onOpenChange,
  onCameraUpdate,
}: CameraDialogProps) {
  const { videoList, isSaving, error, handleUpdate } = useCameraDialog(
    camera,
    onCameraUpdate
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none p-0 rounded-none">
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
          <Tabs defaultValue="config" className="flex-1 flex flex-col">
            <DialogHeader className="border-b border-border px-6 py-4 space-y-2 shrink-0">
              <DialogTitle className="text-lg font-semibold text-foreground">
                {camera.name}
              </DialogTitle>

              <TabsList className="grid w-full grid-cols-2 bg-muted/30">
                <TabsTrigger
                  value="live"
                  className="flex items-center gap-2 text-sm"
                >
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">Live</span>
                </TabsTrigger>
                <TabsTrigger
                  value="config"
                  className="flex items-center gap-2 text-sm"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Config</span>
                </TabsTrigger>
              </TabsList>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <TabsContent value="live">
                <CameraLiveViewTab camera={camera} />
              </TabsContent>

              <TabsContent value="config">
                <CameraConfigurationTab
                  camera={camera}
                  videoList={videoList}
                  isSaving={isSaving}
                  error={error}
                  onCameraUpdate={handleUpdate}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <style jsx global>{`
          .custom-scrollbar {
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE/Edge */
          }

          .custom-scrollbar::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Opera */
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
