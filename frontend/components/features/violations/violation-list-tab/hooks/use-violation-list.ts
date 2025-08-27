import { useState, useEffect, useCallback } from "react"
import { getViolations } from "@/lib/api/v1/violations"
import { getCameras } from "@/lib/api/v1/camera"
import { useToast } from "@/components/shared/hooks/use-toast"

import type { Violation } from "@/lib/types/api/v1/violation"
import type { Camera } from "@/lib/types/api/v1/camera"
import type { ViolationFilterState } from "../types/violation-filter-state"
import type { ViolationListState } from "../types/violation-list-state"

const defaultFilterState: ViolationFilterState = {
  search: "",
  status: "",
  violation_type: "",
  camera_id: "",
  vehicle_type: "",
  confidence_min: "",
  confidence_max: "",
  timestamp_from: "",
  timestamp_to: "",
}

export function useViolationList() {
  const [state, setState] = useState<ViolationListState>({
    violations: [],
    cameras: [],
    pagination: {
      page: 1,
      limit: 25,
      total: 0,
      totalPages: 0,
    },
    isLoading: true,
    error: null,
  })

  const [filters, setFilters] = useState<ViolationFilterState>(defaultFilterState)
  const { toast } = useToast()

  const fetchViolations = useCallback(
    async (page: number, currentFilters: ViolationFilterState, limit: number) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const params = {
          page,
          limit,
          ...currentFilters,
        }

        const data = await getViolations(params)

        setState((prev) => ({
          ...prev,
          violations: data.data,
          pagination: {
            ...data.pagination,
            limit,
          },
          isLoading: false,
        }))
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch violations"
        setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }))
        toast({ title: "Error", description: errorMessage, variant: "destructive" })
      }
    },
    [toast]
  )

  const fetchCameras = useCallback(async () => {
    try {
      const data = await getCameras()
      setState((prev) => ({ ...prev, cameras: data }))
    } catch (error) {
      console.error("Failed to fetch cameras:", error)
      toast({
        title: "Warning",
        description: "Failed to load camera data",
        variant: "destructive",
      })
    }
  }, [toast])

  useEffect(() => {
    fetchCameras()
    fetchViolations(1, filters, state.pagination.limit)
  }, [])

  const handleFiltersChange = useCallback(
    (newFilters: ViolationFilterState) => {
      setFilters(newFilters)
      fetchViolations(1, newFilters, state.pagination.limit)
    },
    [fetchViolations, state.pagination.limit]
  )

  const handlePageChange = useCallback(
    (page: number) => {
      fetchViolations(page, filters, state.pagination.limit)
    },
    [fetchViolations, filters, state.pagination.limit]
  )

  const handleRefresh = useCallback(() => {
    fetchViolations(state.pagination.page, filters, state.pagination.limit)
  }, [fetchViolations, filters, state.pagination.page, state.pagination.limit])

  const handleRetry = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
    fetchViolations(state.pagination.page, filters, state.pagination.limit)
  }, [fetchViolations, filters, state.pagination.page, state.pagination.limit])

  const handleViolationUpdate = useCallback((updated: Violation) => {
    setState((prev) => ({
      ...prev,
      violations: prev.violations.map((v) =>
        v.id === updated.id ? updated : v
      ),
    }))
  }, [])

  return {
    ...state,
    filters,
    handleFiltersChange,
    handlePageChange,
    handleRefresh,
    handleRetry,
    handleViolationUpdate,
  }
}
