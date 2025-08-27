"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shared/ui/card"
import { Label } from "@/components/shared/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shared/ui/select"
import { Video, Play } from "lucide-react"

interface VideoSelectorProps {
  videoList: string[]
  selectedVideo: string
  onVideoChange: (video: string) => void
  disabled?: boolean
}

export function VideoSelector({
  videoList,
  selectedVideo,
  onVideoChange,
  disabled,
}: VideoSelectorProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Video className="h-5 w-5" />
          Video Source
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Label htmlFor="video-select">Select Video</Label>
        <Select
          value={selectedVideo}
          onValueChange={onVideoChange}
          disabled={disabled}
        >
          <SelectTrigger id="video-select">
            <SelectValue placeholder="Choose a video source" />
          </SelectTrigger>
          <SelectContent>
            {videoList.map((video) => (
              <SelectItem key={video} value={video}>
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  {video}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}
