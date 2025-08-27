"use client"

import { CameraCard } from "./camera-card"
import { CameraDialog } from "./camera-dialog/components/camera-dialog"
import { useMonitoring } from "../hooks/use-monitoring"
import { ErrorSection } from "@/components/shared/layout/error-section/error-section"
import { TabHeader } from "@/components/shared/layout/tab-header/tab-header"
import { TabLoading } from "@/components/shared/layout/tab-loading/tab-loading"

export function MonitoringTab() {
  const {
    cameras,
    isLoading,
    error,
    handleRefresh,
    handleRetry,
    selectedCamera,
    isDialogOpen,
    openDialog,
    closeDialog,
    updateCameraInList,
  } = useMonitoring()

  if (isLoading) {
    return <TabLoading message="Loading monitoring..." />
  }

  if (error) {
    return (
      <ErrorSection
        title="Traffic Monitoring"
        description="Something went wrong while loading camera data."
        errorMessage={error}
        onRetry={handleRetry}
        forceReloadOnError
      />
    )
  }

  return (
    <>
      <TabHeader
        title="Traffic Monitoring"
        description="Manage and monitor real-time traffic camera feeds"
        onRefresh={handleRefresh}
        isRefreshing={isLoading}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {cameras.map((camera) => (
          <CameraCard key={camera.id} camera={camera} onClick={openDialog} />
        ))}
      </div>

      {selectedCamera && (
        <CameraDialog
          camera={selectedCamera}
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (!open) closeDialog()
          }}
          onCameraUpdate={updateCameraInList}
        />
      )}
    </>
  )
}
