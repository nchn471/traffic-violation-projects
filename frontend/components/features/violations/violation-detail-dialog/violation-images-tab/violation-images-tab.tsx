"use client";

import type React from "react";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/shared/ui/dialog";
import { ImageIcon, Car, FileText, Maximize2, X } from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import type { Violation } from "@/lib/types/api/v1/violation";
import { getMediaUrl } from "@/lib/api/v1/media";
import { DialogHeader } from "@/components/shared/layout/dialog-header/dialog-header";

interface Props {
  violation: Violation;
}

interface ImageCardProps {
  title: string;
  icon: React.ReactNode;
  imagePath: string;
  alt: string;
}

function ImageCard({ title, icon, imagePath, alt }: ImageCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const imageUrl = getMediaUrl(imagePath);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 pt-2">
        <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="relative aspect-video bg-muted rounded-md overflow-hidden group">
          {isLoading && !hasError && (
            <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
            </div>
          )}
          {hasError ? (
            <div className="absolute inset-0 bg-muted flex flex-col items-center justify-center text-muted-foreground">
              <ImageIcon className="h-8 w-8 mb-2" />
              <span className="text-xs">Failed to load</span>
            </div>
          ) : (
            <>
              <img
                src={imageUrl || "/placeholder.svg?height=200&width=300"}
                alt={alt}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <Maximize2 className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
                        onClick={() => setIsPreviewOpen(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <img
                        src={
                          imageUrl || "/placeholder.svg?height=600&width=800"
                        }
                        alt={alt}
                        className="w-full h-auto max-h-[85vh] object-contain"
                      />
                      <div className="p-4 border-t">
                        <h3 className="font-medium">{title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {alt}
                        </p>
                      </div>
                    </div>
                  </DialogContent>

                </Dialog>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ViolationImagesTab({ violation }: Props) {
  const images = [
    {
      path: violation.frame_image_path,
      title: "Frame Image",
      icon: <ImageIcon className="h-4 w-4" />,
      alt: "Violation frame capture",
    },
    {
      path: violation.vehicle_image_path,
      title: "Vehicle Image",
      icon: <Car className="h-4 w-4" />,
      alt: "Vehicle in violation",
    },
    {
      path: violation.lp_image_path,
      title: "License Plate",
      icon: <FileText className="h-4 w-4" />,
      alt: "License plate capture",
    },
  ].filter((img) => img.path);

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 bg-muted rounded-full mb-4">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No Evidence Images</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Evidence images will appear here when they become available for this
          violation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <DialogHeader
          icon={<ImageIcon className="h-8 w-8 text-muted-foreground" />}
          title="Evidence Images"
          description={`Total ${images.length} evidence${
            images.length !== 1 ? "s" : ""
          } found`}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <ImageCard
            key={index}
            title={image.title}
            icon={image.icon}
            imagePath={image.path}
            alt={image.alt}
          />
        ))}
      </div>
    </div>
  );
}
