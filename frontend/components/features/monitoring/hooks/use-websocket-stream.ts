"use client";

import { useEffect, useState } from "react";
import { getMediaUrl } from "@/lib/api/v1/media";
import { sendFrames } from "@/lib/api/v1/camera";

interface StreamFrame {
  camera_id: string;
  frame_url: string;
  timestamp: number;
  displayUrl: string;
}
export type StreamSource = "camera" | "video";
export function useWebSocketStream(
  cameraId: string,
  source: StreamSource = "camera"
) {
  const [frame, setFrame] = useState<StreamFrame | null>(null);

  useEffect(() => {
    if (!cameraId) {
      setFrame(null);
      return;
    }

    let ws: WebSocket;

    const startStream = async () => {
      if (source === "camera") {
        try {
          const res = await sendFrames(cameraId);

          if (!res || res.status !== 'accepted') {
            console.error("sendFrames failed with status:", res?.status);
            return;
          }
          console.log("Frame sending started for camera:", cameraId);
        } catch (e) {
          console.error("Failed to start frame sending:", e);
          return;
        }
      }

      const wsUrl =
        source === "video"
          ? `ws://localhost:8000/ws/video/${cameraId}`
          : `ws://localhost:8000/ws/camera/${cameraId}`;

      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.frame_url && data.camera_id && data.timestamp) {
            setFrame({
              camera_id: data.camera_id,
              frame_url: data.frame_url,
              timestamp: data.timestamp,
              displayUrl: getMediaUrl(data.frame_url),
            });
          }
        } catch (err) {
          console.error("Invalid WebSocket message:", err);
        }
      };
    };

    startStream();

    return () => {
      if (ws) ws.close();
    };
  }, [cameraId, source]);

  return frame;
}
