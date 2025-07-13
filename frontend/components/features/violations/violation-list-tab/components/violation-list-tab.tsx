"use client"

import { ViolationFilterBar } from "@/components/features/violations/violation-filter-bar/violation-filter-bar"
import { ViolationTable } from "@/components/features/violations/violation-table/violation-table"
import { useViolationList } from "../hooks/use-violation-list"
import { ErrorSection } from "@/components/shared/layout/error-section/error-section"
import { TabHeader } from "@/components/shared/layout/tab-header/tab-header"

export function ViolationListTab() {
  const {
    violations,
    cameras,
    pagination,
    isLoading,
    error,
    handleFiltersChange,
    handlePageChange,
    handleRefresh,
    handleRetry,
    handleViolationUpdate,
  } = useViolationList()

  if (error && !isLoading) {
    return (
      <ErrorSection
        title="Traffic Violations"
        description="Manage and review traffic violation records"
        errorMessage={error}
        onRetry={handleRetry}
        forceReloadOnError={true}
      />
    )
  }

  return (
    <div className="space-y-6">
      <TabHeader
        title="Traffic Violations"
        description="Manage and review traffic violation records"
        onRefresh={handleRefresh}
        isRefreshing={isLoading}
      />

      <ViolationFilterBar
        onFiltersChange={handleFiltersChange}
        isLoading={isLoading}
        cameras={cameras}
      />

      <ViolationTable
        violations={violations}
        pagination={pagination}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onViolationUpdate={handleViolationUpdate}
      />
    </div>
  )
}
