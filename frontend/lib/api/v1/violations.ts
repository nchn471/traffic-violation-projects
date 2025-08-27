import {
  Violation,
  PaginatedViolations,
  ViolationHistory,
  ViolationUpdate,
  GetViolationsParams,
} from "@/lib/types/api/v1/violation";

import { apiFetch } from "@/lib/api/v1/fetch";

const BASE_API_URL = "/api/v1/violations";


// GET /violations
export async function getViolations(
  params?: GetViolationsParams
): Promise<PaginatedViolations> {
  const query = new URLSearchParams();

  const add = (key: string, value?: string | number | null) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  };

  add("page", params?.page);
  add("limit", params?.limit);
  add("status", params?.status);
  add("violation_type", params?.violation_type);
  add("search", params?.search);
  add("camera_id", params?.camera_id);
  add("vehicle_type", params?.vehicle_type);
  add("confidence_min", params?.confidence_min);
  add("confidence_max", params?.confidence_max);
  add("timestamp_from", params?.timestamp_from);
  add("timestamp_to", params?.timestamp_to);

  return apiFetch<PaginatedViolations>(
    `${BASE_API_URL}?${query.toString()}`,
    { credentials: "include" }
  );
}

// GET /violations/:id
export async function getViolation(id: string): Promise<Violation> {
  return apiFetch<Violation>(`${BASE_API_URL}/${id}`, {
    credentials: "include",
  });
}

// PATCH /violations/:id
export async function updateViolation(
  id: string,
  data: ViolationUpdate
): Promise<Violation> {
  return apiFetch<Violation>(`${BASE_API_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
}

// DELETE /violations/:id (archive)
export async function archiveViolation(id: string, notes?: string): Promise<Violation> {
  return apiFetch<Violation>(`${BASE_API_URL}/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ notes }),
  });
}


// GET /violations/:id/history
export async function getViolationHistory(id: string): Promise<ViolationHistory[]> {
  return apiFetch<ViolationHistory[]>(`${BASE_API_URL}/${id}/history`, {
    credentials: "include",
  });
}

// POST /violations/:id/rollback/:versionId
export async function rollbackViolation(
  id: string,
  versionId: string
): Promise<Violation> {
  return apiFetch<Violation>(`${BASE_API_URL}/${id}/rollback/${versionId}`, {
    method: "POST",
    credentials: "include",
  });
}

// PATCH /violations/:id/approve
export async function approveViolation(id: string, notes?: string): Promise<Violation> {
  return apiFetch<Violation>(`${BASE_API_URL}/${id}/approve`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ notes }), 
  });
}

// PATCH /violations/:id/reject
export async function rejectViolation(id: string, notes?: string): Promise<Violation> {
  return apiFetch<Violation>(`${BASE_API_URL}/${id}/reject`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ notes }), 
  });
}
