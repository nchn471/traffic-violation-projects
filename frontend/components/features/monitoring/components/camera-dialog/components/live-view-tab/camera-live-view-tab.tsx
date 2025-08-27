"use client";

import { useState, useEffect } from "react";
import { Play, Pause, Loader2, WifiOff } from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { Card, CardContent } from "@/components/shared/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shared/ui/select";
import { useWebSocketStream, StreamSource } from "@/components/features/monitoring/hooks/use-websocket-stream";
import type { Camera } from "@/lib/types/api/v1/camera";


interface CameraLiveViewTabProps {
  camera: Camera;
}

export function CameraLiveViewTab({ camera }: CameraLiveViewTabProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [source, setSource] = useState<StreamSource>("camera");

  const frame = useWebSocketStream(isStreaming ? camera.id : "", source);

  const handleToggle = async () => {
    if (isStreaming) {
      setIsStreaming(false);
      return;
    }
    setIsStreaming(true);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Live Stream</h3>
        <div className="flex items-center gap-2">
          <Select value={source} onValueChange={(val) => setSource(val as StreamSource)} disabled={isStreaming}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="camera">Camera</SelectItem>
              <SelectItem value="video">Video</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={isStreaming ? "destructive" : "default"}
            size="sm"
            onClick={handleToggle}
          >
            {isStreaming ? (
              <>
                <Pause className="h-4 w-4 mr-1" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" />
                Start
              </>
            )}
          </Button>
        </div>
      </div>

      <Card className="w-full max-w-[1280px] mx-auto">
        <CardContent className="p-0">
          <div className="w-full aspect-[16/9] bg-muted rounded-md overflow-hidden relative">
            {frame ? (
              <div className="relative w-full h-full">
                <img
                  src={frame.displayUrl}
                  alt="Live frame"
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {new Date(frame.timestamp).toLocaleTimeString()}
                </div>
                {/* <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-mono">
                  {frame.camera_id.slice(0, 8)}...
                </div> */}
              </div>
            ) : isStreaming ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-sm">Waiting for frames...</p>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <WifiOff className="h-6 w-6" />
                <p className="text-sm">
                  Click &quot;Start&quot; to begin live stream
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
