"use client";

import { Card, CardContent, CardHeader } from "@/components/shared/ui/card";
import { MapPin, Video } from "lucide-react";
import { getThumbnailUrl } from "@/lib/api/v1/media";
import type { Camera } from "@/lib/types/api/v1/camera";

interface CameraCardProps {
  camera: Camera;
  onClick: (camera: Camera) => void;
}

export function CameraCard({ camera, onClick }: CameraCardProps) {
  const thumbnailUrl = getThumbnailUrl(camera.config?.video_url);

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick(camera)}
    >
      <CardHeader className="pb-0 pt-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-base font-semibold">
            <Video className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{camera.name}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="truncate">
              {camera.location || "Unknown location"}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-3">
        <div className="aspect-video bg-muted rounded overflow-hidden flex items-center justify-center">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt="Camera thumbnail"
              className="object-cover w-full h-full"
            />
          ) : (
            <Video className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
